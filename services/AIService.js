/**
 * PromptKeeper AI Service
 * Encapsulates interaction with the Chrome Prompt API (Gemini Nano)
 */

class AIService {
    constructor() {
        this.session = null;
        this._activeBridgeRequests = new Map(); // requestId -> abort handler
        this._bridgeStreamListeners = new Map(); // requestId -> listener fn
    }

    /**
     * Helper to send message to AI bridge tab
     * @param {Object} message 
     * @returns {Promise<any>}
     */
    async _sendToAIBridge(message) {
        // Retry configuration
        const MAX_RETRIES = 3;
        const INITIAL_DELAY = 500;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                return await this._attemptSend(message);
            } catch (error) {
                const errMsg = error?.message || String(error || 'Unknown error');
                const isConnectionError = errMsg.includes('Receiving end does not exist') ||
                    errMsg.includes('Could not establish connection');

                if (isConnectionError) {
                    if (attempt < MAX_RETRIES) {
                        console.log(`[AIService] Connection failed (attempt ${attempt}/${MAX_RETRIES}). Retrying...`);
                        await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY * attempt));
                        continue;
                    } else {
                        // All retries failed. Try to heal by forcing recreation of the tab.
                        console.warn('[AIService] All retries failed. Requesting bridge reinitialization...');
                        try {
                            await chrome.runtime.sendMessage({ action: 'reinitializeAIBridge' });
                            // One last try after 1 second
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            return await this._attemptSend(message);
                        } catch (fatalErr) {
                            throw new Error(`AI Connection Failed after self-healing: ${fatalErr.message}`);
                        }
                    }
                }
                throw error;
            }
        }
    }

    async _attemptSend(message) {
        console.log('[AIService] Sending message to AI bridge (Broadcast):', message.action);

        // We use chrome.runtime.sendMessage which broadcasts to all extension parts,
        // including the offscreen document. The offscreen document must listen 
        // This change is actually not needed in AIService if offscreen returns correct data.
        // But I will update options.js checkAIStatus logic in next step.
        // Wait, I need to see options.js checkAIStatus first.espond.

        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('[AIService] Message error:', chrome.runtime.lastError.message);
                    // Often "Could not establish connection" means no listener (offscreen not ready)
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response && response.error) {
                    reject(new Error(response.error));
                } else {
                    // response might be undefined if other listeners return nothing, 
                    // but our offscreen should return a value.
                    // Ideally check if response matches expected format.
                    console.log('[AIService] Received response:', response);
                    resolve(response || {});
                }
            });
        });
    }

    /**
     * Checks if the AI capability is available.
     * @returns {Promise<string>} 'readily', 'available', 'after-download', or 'no'
     */
    async getAvailability() {
        // 1. Check local availability using the shared Built-in AI wrapper (web-ai-demos pattern)
        try {
            if (typeof window !== 'undefined' && window.PKBuiltinAI) {
                const status = await window.PKBuiltinAI.getAvailability();
                if (status && status !== 'no') return status;
            }
        } catch (e) {
            console.warn("Local Built-in AI check failed", e);
        }

        // 2. Bridge Fallback
        try {
            const response = await this._sendToAIBridge({
                action: 'checkAIAvailability'
            });
            return response?.available || 'no';
        } catch (e) {
            console.error("Error checking AI availability:", e);
            return 'no';
        }
    }

    /**
     * Returns a diagnostic string.
     */
    async getDiagnostic() {
        // Local diag first
        let localDiag = "";
        if (typeof window !== 'undefined') {
            if (window.LanguageModel) localDiag += "Local:LanguageModel ";
            if (window.ai) localDiag += "Local:window.ai ";
        }

        try {
            const res = await this._sendToAIBridge({ action: 'getDiagnostic' });
            const offscreenDiag = typeof res === 'string' ? res : (res?.diagnostic || "Comm Error");
            return `${localDiag} | Offscreen: ${offscreenDiag}`;
        } catch (e) {
            return `${localDiag} | Bridge Error: ${e.message}`;
        }
    }

    /**
     * Returns status of specific APIs.
     */
    async getDetailedStatus() {
        // Hybrid check not strictly needed for dots, but nice to have.
        // For now, rely on bridge for "global" status, OR implement local check.
        // Let's implement local check for consistency.
        const statuses = { prompt: 'no', rewriter: 'no' };

        if (typeof window !== 'undefined') {
            // Local Check
            if (window.Rewriter || (window.ai && window.ai.rewriter)) statuses.rewriter = 'readily';

            if (window.PKBuiltinAI) {
                try {
                    const s = await window.PKBuiltinAI.getAvailability();
                    statuses.prompt = s || 'no';
                } catch { /* ignore */ }
            }
        }

        // If local found nothing, try bridge? 
        // Or if local found SOMETHING, return it?
        if (statuses.prompt !== 'no' || statuses.rewriter !== 'no') return statuses;

        try {
            return await this._sendToAIBridge({ action: 'getDetailedStatus' });
        } catch {
            return statuses;
        }
    }

    /**
     * Refines a prompt.
     */
    async refinePrompt(promptText, refinementType, opts = {}) {
        // 1. Local Execution Preference
        if (this._canRunLocally()) {
            console.log('[AIService] Running locally');
            return this._runLocally(promptText, refinementType, opts);
        }

        // 2. Bridge Fallback
        let requestId;
        try {
            requestId = opts?.requestId || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(16).slice(2)}`);

            // If caller wants streaming updates, listen for offscreen chunk events (best-effort)
            if (typeof opts?.onChunk === 'function' || typeof opts?.onStats === 'function') {
                const listener = (msg) => {
                    if (!msg || msg.action !== 'refinePromptChunk') return;
                    if (msg.requestId !== requestId) return;
                    if (typeof opts.onChunk === 'function' && typeof msg.partial === 'string') {
                        opts.onChunk(msg.partial);
                    }
                    if (typeof opts.onStats === 'function') {
                        opts.onStats(msg.stats || null);
                    }
                };
                try {
                    chrome.runtime.onMessage.addListener(listener);
                    this._bridgeStreamListeners.set(requestId, listener);
                } catch { /* ignore */ }
            }

            // If caller aborts, try to cancel the request in offscreen (best-effort)
            if (opts?.signal && typeof opts.signal.addEventListener === 'function') {
                const onAbort = () => {
                    // Fire-and-forget cancel
                    this.cancelRefinePrompt(requestId).catch(() => { });
                };
                this._activeBridgeRequests.set(requestId, onAbort);
                opts.signal.addEventListener('abort', onAbort, { once: true });
            }

            const response = await this._sendToAIBridge({
                action: 'refinePrompt',
                requestId,
                promptText,
                refinementType,
                // Hint to offscreen to stream chunks back if possible
                stream: typeof opts?.onChunk === 'function' || typeof opts?.onStats === 'function'
            });

            if (typeof opts?.onStats === 'function') {
                try { opts.onStats(response.stats || null); } catch { /* ignore */ }
            }

            if (!response.success) {
                throw new Error(response.error || 'AI refinement failed');
            }
            return response.result;
        } catch (err) {
            console.error('Refine prompt failed:', err);
            throw err;
        } finally {
            // Cleanup abort listeners (if any)
            const onAbort = requestId ? this._activeBridgeRequests.get(requestId) : null;
            if (requestId && onAbort && opts?.signal?.removeEventListener) {
                opts.signal.removeEventListener('abort', onAbort);
                this._activeBridgeRequests.delete(requestId);
            }

            // Cleanup streaming listeners (if any)
            const streamListener = requestId ? this._bridgeStreamListeners.get(requestId) : null;
            if (requestId && streamListener) {
                try { chrome.runtime.onMessage.removeListener(streamListener); } catch { /* ignore */ }
                this._bridgeStreamListeners.delete(requestId);
            }
        }
    }

    async cancelRefinePrompt(requestId) {
        if (!requestId) return;
        await this._sendToAIBridge({ action: 'cancelRefinePrompt', requestId });
    }

    _canRunLocally() {
        if (typeof window === 'undefined') return false;
        // Check for LanguageModel OR window.ai.languageModel
        return !!(window.LanguageModel || (window.ai && window.ai.languageModel));
    }

    async _runLocally(promptText, refinementType, opts = {}) {
        const preferStreaming = opts?.preferStreaming === true && typeof opts.onChunk === 'function';

        // Specialized APIs (use only when we are NOT trying to stream)
        if (!preferStreaming && refinementType === 'summarize' && (window.Summarizer || (window.ai && window.ai.summarizer))) {
            const factory = window.Summarizer || window.ai.summarizer;
            const summarizer = await factory.create();
            const res = await summarizer.summarize(promptText);
            summarizer.destroy();
            return res;
        }
        if (!preferStreaming && refinementType === 'formalize' && (window.Rewriter || (window.ai && window.ai.rewriter))) {
            const factory = window.Rewriter || window.ai.rewriter;
            const rewriter = await factory.create({ tone: 'more-formal' });
            const res = await rewriter.rewrite(promptText);
            rewriter.destroy();
            return res;
        }

        // Prompt API
        let session;
        if (window.PKBuiltinAI) {
            const created = await window.PKBuiltinAI.getCachedSession({
                signal: opts.signal,
                monitor: opts.monitor
            });
            session = created.session;
        } else if (window.LanguageModel) {
            session = await window.LanguageModel.create({ expectedContext: 'en', outputLanguage: 'en', expectedOutputLanguage: 'en' });
        } else if (window.ai && window.ai.languageModel) {
            session = await window.ai.languageModel.create({ expectedContext: 'en', outputLanguage: 'en', expectedOutputLanguage: 'en' });
        } else throw new Error("Local AI API missing unexpectedly");

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
        try {
            // Prefer streaming (web-ai-demos pattern) when available
            const emitStats = () => {
                if (typeof opts.onStats !== 'function') return;
                const stats = window.PKBuiltinAI?.getTokenStats ? window.PKBuiltinAI.getTokenStats(session) : null;
                opts.onStats(stats);
            };

            const isStream = typeof opts.onChunk === 'function';
            const onChunk = opts.onChunk;
            const options = opts; // Use 'options' to avoid conflict with 'opts' in the outer scope if needed

            if (isStream) {
                opts.monitor = (m) => {
                    // Pass download progress if needed
                };
                const stream = await session.promptStreaming(metaPrompt, opts.signal ? { signal: opts.signal } : undefined); // Use metaPrompt here

                let fullText = '';
                for await (const chunk of stream) {
                    fullText += chunk; // Accumulate full text
                    // Pass promptId back so UI knows where to route this chunk
                    if (onChunk) onChunk(fullText, options.promptId); // Pass fullText and promptId
                    emitStats();
                }
                emitStats();
                emitStats();
                return fullText;
            } else {
                // Fallback: non-streaming
                const res = typeof session.prompt === 'function'
                    ? await session.prompt(metaPrompt, opts.signal ? { signal: opts.signal } : undefined)
                    : await session.prompt(metaPrompt);

                if (typeof opts.onChunk === 'function') opts.onChunk(res, options.promptId); // Also pass ID here
                emitStats();
                return res;
            }
        } finally {
            // If we're using the cached session, we do not destroy it here.
            if (!window.PKBuiltinAI) {
                try { session.destroy(); } catch { /* ignore */ }
            }
        }
    }
}

export default new AIService();
