/**
 * PromptKeeper AI Service
 * Encapsulates interaction with the Chrome Prompt API (Gemini Nano)
 */

class AIService {
    constructor() {
        this.session = null;
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
        // 1. Check Local Availability (if in Tab/SidePanel)
        if (typeof window !== 'undefined') {
            if (window.LanguageModel) {
                try {
                    if (window.LanguageModel.availability) {
                        const status = await window.LanguageModel.availability();
                        if (status !== 'no') return status; // 'readily', 'available', etc.
                    }
                } catch (e) { console.warn("Local LanguageModel check failed", e); }
            }
            if (window.ai && window.ai.languageModel) {
                try {
                    const caps = await window.ai.languageModel.capabilities();
                    if (caps.available !== 'no') return caps.available;
                } catch (e) { console.warn("Local window.ai check failed", e); }
            }
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

            if (window.LanguageModel) {
                try {
                    const s = await window.LanguageModel.availability();
                    statuses.prompt = s;
                } catch (_e) { /* ignore */ }
            } else if (window.ai && window.ai.languageModel) {
                try {
                    const c = await window.ai.languageModel.capabilities();
                    statuses.prompt = c.available;
                } catch (_e) { /* ignore */ }
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
    async refinePrompt(promptText, refinementType) {
        // 1. Local Execution Preference
        if (this._canRunLocally()) {
            console.log('[AIService] Running locally');
            return this._runLocally(promptText, refinementType);
        }

        // 2. Bridge Fallback
        try {
            const response = await this._sendToAIBridge({
                action: 'refinePrompt',
                promptText,
                refinementType
            });

            if (!response.success) {
                throw new Error(response.error || 'AI refinement failed');
            }
            return response.result;
        } catch (err) {
            console.error('Refine prompt failed:', err);
            throw err;
        }
    }

    _canRunLocally() {
        if (typeof window === 'undefined') return false;
        // Check for LanguageModel OR window.ai.languageModel
        return !!(window.LanguageModel || (window.ai && window.ai.languageModel));
    }

    async _runLocally(promptText, refinementType) {
        // Specialized APIs
        if (refinementType === 'summarize' && (window.Summarizer || (window.ai && window.ai.summarizer))) {
            const factory = window.Summarizer || window.ai.summarizer;
            const summarizer = await factory.create();
            const res = await summarizer.summarize(promptText);
            summarizer.destroy();
            return res;
        }
        if (refinementType === 'formalize' && (window.Rewriter || (window.ai && window.ai.rewriter))) {
            const factory = window.Rewriter || window.ai.rewriter;
            const rewriter = await factory.create({ tone: 'more-formal' });
            const res = await rewriter.rewrite(promptText);
            rewriter.destroy();
            return res;
        }

        // Prompt API
        let session;
        if (window.LanguageModel) {
            session = await window.LanguageModel.create({
                expectedContext: 'en',
                outputLanguage: 'en'
            });
        } else if (window.ai && window.ai.languageModel) {
            session = await window.ai.languageModel.create({
                expectedContext: 'en',
                outputLanguage: 'en'
            });
        } else {
            throw new Error("Local AI API missing unexpectedly");
        }

        let instruction = '';
        switch (refinementType) {
            case 'formalize': instruction = 'Rewrite this prompt to be more professional.'; break;
            case 'clarify': instruction = 'Make this prompt clearer.'; break;
            case 'summarize': instruction = 'Shorten this prompt.'; break;
            case 'magic_enhance': instruction = 'Rewrite this prompt to include Persona, Task, Context.'; break;
            default: instruction = 'Improve this prompt.';
        }

        const metaPrompt = `Instruction: ${instruction}\nInput: "${promptText}"\nRewrite the Input.`;
        const res = await session.prompt(metaPrompt);
        session.destroy();
        return res;
    }
}

export default new AIService();
