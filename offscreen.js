/**
 * Offscreen Document for AI Operations
 * This runs in a web page context where window.ai IS available
 */

console.log('[Offscreen] Document loaded');
console.log('[Offscreen] window.ai available:', typeof window.ai !== 'undefined');

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
        refinePrompt(request.promptText, request.refinementType)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
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
    // 1. Check Standard window.ai.languageModel
    if (window.ai && window.ai.languageModel) {
        try {
            const caps = await window.ai.languageModel.capabilities();
            return { available: caps.available || 'no', source: 'window.ai' };
        } catch (e) {
            console.warn('[Offscreen] window.ai caps check failed:', e);
        }
    }

    // 2. Check Global LanguageModel (Spec)
    if (window.LanguageModel) {
        try {
            if (window.LanguageModel.capabilities) {
                const caps = await window.LanguageModel.capabilities();
                return { available: caps.available || 'no', source: 'LanguageModel.caps' };
            }
            if (window.LanguageModel.availability) {
                const avail = await window.LanguageModel.availability();
                return { available: avail || 'no', source: 'LanguageModel.avail' };
            }
            // Fallback: If it exists, assume downloadable or available?
            return { available: 'readily', source: 'LanguageModel.exists' };
        } catch (e) {
            console.warn('[Offscreen] LanguageModel check failed:', e);
        }
    }

    return { available: 'no' };
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

    if (window.ai && window.ai.languageModel) {
        try {
            const caps = await window.ai.languageModel.capabilities();
            statuses.prompt = caps.available;
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

    if (window.ai.languageModel) {
        try {
            const caps = await window.ai.languageModel.capabilities();
            diag += `PromptAPI:${caps.available} `;
        } catch (e) {
            diag += `PromptAPI:Error(${e.message}) `;
        }
    } else {
        diag += "PromptAPI:Missing ";
    }

    diag += window.ai.rewriter ? "RewriterAPI:Present " : "RewriterAPI:Missing ";
    diag += window.ai.summarizer ? "SummarizerAPI:Present " : "SummarizerAPI:Missing ";

    return diag.trim();
}

/**
 * Refine a prompt using AI
 */
async function refinePrompt(promptText, refinementType) {
    if (!window.ai || !window.ai.languageModel) {
        throw new Error('AI not available');
    }

    // Try specialized APIs first
    if (refinementType === 'summarize' && window.ai.summarizer) {
        console.log('[Offscreen] Using Summarizer API');
        const summarizer = await window.ai.summarizer.create();
        const result = await summarizer.summarize(promptText);
        summarizer.destroy();
        return result;
    }

    if (refinementType === 'formalize' && window.ai.rewriter) {
        console.log('[Offscreen] Using Rewriter API');
        const rewriter = await window.ai.rewriter.create({ tone: 'more-formal' });
        const result = await rewriter.rewrite(promptText);
        rewriter.destroy();
        return result;
    }

    // Fallback to Prompt API
    console.log('[Offscreen] Using Prompt API for', refinementType);

    let instruction = '';
    switch (refinementType) {
        case 'formalize':
            instruction = 'Rewrite this prompt to be more professional and corporate. Remove slang.';
            break;
        case 'clarify':
            instruction = 'Make the Task in this prompt clearer and more active. Use strong verbs.';
            break;
        case 'summarize':
            instruction = 'Shorten this prompt while keeping the core intent. Aim for ~21 words.';
            break;
        case 'magic_enhance':
            instruction = 'Rewrite this prompt to include a defined Persona, Task, Context, and Format. Extrapolate missing details reasonably.';
            break;
        default:
            instruction = 'Improve this prompt.';
    }

    const metaPrompt = `
Instruction: ${instruction}
Input Text: "${promptText}"

Rewrite the Input Text following the Instruction. Return ONLY the rewritten text.
`;

    const session = await window.ai.languageModel.create();
    const result = await session.prompt(metaPrompt);
    session.destroy();

    return result;
}

console.log('[Offscreen] Ready to handle AI requests');
