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
        // and check the action to respond.

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
     * @returns {Promise<string>} 'readily', 'after-download', or 'no'
     */
    async getAvailability() {
        try {
            const response = await this._sendToAIBridge({
                action: 'checkAIAvailability'
            });
            // Handle case where other listeners might return null
            return response?.available || 'no';
        } catch (e) {
            console.error("Error checking AI availability:", e);
            return 'no';
        }
    }

    /**
     * Returns a diagnostic string for troubleshooting.
     * @returns {Promise<string>}
     */
    async getDiagnostic() {
        try {
            const res = await this._sendToAIBridge({
                action: 'getDiagnostic'
            });
            return typeof res === 'string' ? res : (res?.diagnostic || "Communication Error");
        } catch (e) {
            return `Error: ${e.message}`;
        }
    }

    /**
     * Returns the status of each specific API.
     * @returns {Promise<{prompt: string, rewriter: string}>}
     */
    async getDetailedStatus() {
        try {
            return await this._sendToAIBridge({
                action: 'getDetailedStatus'
            });
        } catch {
            return {
                prompt: 'no',
                rewriter: 'no'
            };
        }
    }

    /**
     * Refines a prompt based on a specific goal.
     * Uses offscreen document to access window.ai
     * @param {string} promptText 
     * @param {string} refinementType 
     * @returns {Promise<string>}
     */
    async refinePrompt(promptText, refinementType) {
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
}

export default new AIService();
