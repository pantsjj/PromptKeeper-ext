/**
 * Offscreen Document for AI Operations
 * This runs in a web page context where window.ai IS available
 */

console.log('[Offscreen] Document loaded');
console.log('[Offscreen] window.ai available:', typeof window.ai !== 'undefined');

// Track in-flight requests so we can cancel (AbortController pattern)
const inFlight = new Map(); // requestId -> AbortController

function sendChunkUpdate(requestId, partial, stats) {
    if (!requestId) return;
    try {
        chrome.runtime.sendMessage({
            action: 'refinePromptChunk',
            requestId,
            partial,
            stats
        });
    } catch { /* ignore */ }
}

// Listen for messages from extension pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Offscreen] Received message:', request.action);

    if (request.action === 'checkAIAvailability') {
        checkAIAvailability().then(sendResponse);
        return true; // Async response
    }

    if (request.action === 'getDetailedStatus') {
        getDetailedStatus().then(sendResponse);
        return true;
    }

    if (request.action === 'refinePrompt') {
        refinePrompt(request.promptText, request.refinementType, request.requestId)
            .then(({ result, stats }) => sendResponse({ success: true, result, stats }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (request.action === 'cancelRefinePrompt') {
        try {
            const controller = request.requestId ? inFlight.get(request.requestId) : null;
            if (controller) controller.abort();
        } finally {
            sendResponse({ success: true });
        }
        return true;
    }

    if (request.action === 'getDiagnostic') {
        getDiagnostic().then(sendResponse);
        return true;
    }
});

/**
 * Check if AI is available
 */
async function checkAIAvailability() {
    try {
        if (window.PKBuiltinAI) {
            const available = await window.PKBuiltinAI.getAvailability();
            return { available: available || 'no', source: 'PKBuiltinAI' };
        }
    } catch (e) {
        console.warn('[Offscreen] PKBuiltinAI availability check failed:', e);
    }

    return { available: 'no', source: 'missing' };
}

/**
 * Get detailed status of all AI APIs
 */
async function getDetailedStatus() {
    const statuses = {
        prompt: 'no',
        rewriter: 'no',
        summarizer: 'no'
    };

    if (window.PKBuiltinAI) {
        try {
            statuses.prompt = await window.PKBuiltinAI.getAvailability();
        } catch {
            statuses.prompt = 'no';
        }
    }

    if (window.ai && window.ai.rewriter) statuses.rewriter = 'readily';
    if (window.ai && window.ai.summarizer) statuses.summarizer = 'readily';

    return statuses;
}

/**
 * Get diagnostic string
 */
async function getDiagnostic() {
    if (!window.ai && !window.LanguageModel) return "API_MISSING (window.ai & LanguageModel undefined)";

    let diag = "";

    if (window.PKBuiltinAI) {
        try {
            const avail = await window.PKBuiltinAI.getAvailability();
            diag += `PromptAPI:${avail} `;
        } catch (e) {
            diag += `PromptAPI:Error(${e.message}) `;
        }
    } else diag += "PromptAPI:Missing ";

    diag += window.ai.rewriter ? "RewriterAPI:Present " : "RewriterAPI:Missing ";
    diag += window.ai.summarizer ? "SummarizerAPI:Present " : "SummarizerAPI:Missing ";

    return diag.trim();
}

/**
 * Refine a prompt using AI
 */
async function refinePrompt(promptText, refinementType, requestId) {
    const controller = new AbortController();
    if (requestId) inFlight.set(requestId, controller);

    // Try specialized APIs first
    if (refinementType === 'summarize' && window.ai.summarizer) {
        console.log('[Offscreen] Using Summarizer API');
        const summarizer = await window.ai.summarizer.create();
        const result = await summarizer.summarize(promptText);
        summarizer.destroy();
        if (requestId) inFlight.delete(requestId);
        return result;
    }

    if (refinementType === 'formalize' && window.ai.rewriter) {
        console.log('[Offscreen] Using Rewriter API');
        const rewriter = await window.ai.rewriter.create({ tone: 'more-formal' });
        const result = await rewriter.rewrite(promptText);
        rewriter.destroy();
        if (requestId) inFlight.delete(requestId);
        return result;
    }

    // Fallback to Prompt API
    console.log('[Offscreen] Using Prompt API for', refinementType);

    let instruction = '';
    switch (refinementType) {
        case 'formalize':
            instruction = 'Rewrite this prompt to be more professional and clear. Remove slang, keep the user\'s intent.';
            break;
        case 'clarify':
            instruction = 'Improve clarity and structure of this prompt without changing its intent.';
            break;
        case 'summarize':
            instruction = 'Shorten this prompt while keeping the core intent. Aim for a more concise version.';
            break;
        case 'magic_enhance':
            instruction = 'Rewrite this prompt to include a clear Persona (role only, no personal names), Task, Context, and Format, but do NOT invent character names or companies.';
            break;
        default:
            instruction = 'Improve this prompt while preserving its meaning.';
    }

    const metaPrompt = `
You are refining a user-written prompt for a prompt library.

${instruction}

Formatting rules you MUST follow:
- Do NOT invent or include any personal names (e.g. "Anya Sharma") or fictional company names. If you use a persona, keep it generic, like "You are a senior marketing strategist".
- When the user must fill in details (e.g. [describe your goals]), wrap that placeholder text in single backticks so it renders as inline code in markdown, for example: \`[briefly describe your current running level]\`.
- If you present multiple prompt options, format each option as a level-1 markdown heading, for example: "# Option 1 (Most concise):".
- Keep the output as plain markdown text only. No extra commentary or explanation around it.

Input Text:
"${promptText}"

Return ONLY the rewritten prompt text in markdown, following the rules above. Do not add any explanation outside the prompt.
`;

    let session;
    try {
        if (!window.PKBuiltinAI) throw new Error('PKBuiltinAI missing');
        const created = await window.PKBuiltinAI.createSession({
            signal: controller.signal
        });
        session = created.session;

        // Prefer streaming to allow cancellation + to stream partial output back to UI
        const stats = window.PKBuiltinAI?.getTokenStats ? window.PKBuiltinAI.getTokenStats(session) : null;

        if (typeof session.promptStreaming === 'function') {
            const stream = session.promptStreaming(metaPrompt, { signal: controller.signal });
            let full = '';
            for await (const chunk of stream) {
                full += chunk;
                sendChunkUpdate(requestId, full, window.PKBuiltinAI?.getTokenStats ? window.PKBuiltinAI.getTokenStats(session) : stats);
            }
            // Final push (ensures UI gets final text even if last chunk is empty)
            sendChunkUpdate(requestId, full, window.PKBuiltinAI?.getTokenStats ? window.PKBuiltinAI.getTokenStats(session) : stats);
            return { result: full, stats };
        }

        // Fallback to non-streaming (best-effort cancellation)
        if (typeof session.prompt === 'function') {
            const out = await session.prompt(metaPrompt, { signal: controller.signal });
            sendChunkUpdate(requestId, out, stats);
            return { result: out, stats };
        }
        const out = await session.prompt(metaPrompt);
        sendChunkUpdate(requestId, out, stats);
        return { result: out, stats };
    } finally {
        try { session?.destroy?.(); } catch { /* ignore */ }
        if (requestId) inFlight.delete(requestId);
    }
}

console.log('[Offscreen] Ready to handle AI requests');
