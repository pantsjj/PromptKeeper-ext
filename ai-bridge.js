/**
 * AI Bridge - Runs in a hidden tab where window.ai IS available
 */

console.log('[AI Bridge] Loaded');
console.log('[AI Bridge] window.ai available:', typeof window.ai !== 'undefined');

// Listen for messages from extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[AI Bridge] Received:', request.action);

    if (request.action === 'checkAIAvailability') {
        checkAIAvailability().then(sendResponse);
        return true;
    }

    if (request.action === 'getDiagnostic') {
        getDiagnostic().then(sendResponse);
        return true;
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
});

async function checkAIAvailability() {
    if (!window.ai || !window.ai.languageModel) {
        return { available: 'no' };
    }

    try {
        const caps = await window.ai.languageModel.capabilities();
        return { available: caps.available };
    } catch (err) {
        console.error('[AI Bridge] Capabilities check failed:', err);
        return { available: 'no' };
    }
}

async function getDiagnostic() {
    if (!window.ai) return "API_MISSING (window.ai is undefined)";

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

async function refinePrompt(promptText, refinementType) {
    if (!window.ai || !window.ai.languageModel) {
        throw new Error('AI not available');
    }

    // Try specialized APIs first
    if (refinementType === 'summarize' && window.ai.summarizer) {
        console.log('[AI Bridge] Using Summarizer API');
        const summarizer = await window.ai.summarizer.create();
        const result = await summarizer.summarize(promptText);
        summarizer.destroy();
        return result;
    }

    if (refinementType === 'formalize' && window.ai.rewriter) {
        console.log('[AI Bridge] Using Rewriter API');
        const rewriter = await window.ai.rewriter.create({ tone: 'more-formal' });
        const result = await rewriter.rewrite(promptText);
        rewriter.destroy();
        return result;
    }

    // Fallback to Prompt API
    console.log('[AI Bridge] Using Prompt API for', refinementType);

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

console.log('[AI Bridge] Ready to handle AI requests');
