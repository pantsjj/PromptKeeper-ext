/**
 * PromptKeeper AI Service
 * Encapsulates interaction with the Chrome Prompt API (Gemini Nano)
 */

class AIService {
    constructor() {
        this.session = null;
    }

    /**
     * Checks if the AI capability is available.
     * @returns {Promise<string>} 'readily', 'after-download', or 'no'
     */
    async getAvailability() {
        if (!window.ai || !window.ai.languageModel) {
            return 'no';
        }
        const capabilities = await window.ai.languageModel.capabilities();
        return capabilities.available;
    }

    /**
     * Creates or returns an active session.
     * Handles the 'downloadprogress' event if model needs downloading.
     * @param {function} [onProgress] - Callback for download progress
     * @returns {Promise<Object>} The AI session
     */
    async getSession(onProgress) {
        if (this.session) {
            // Check if session is still valid (simplified check)
            // Ideally we might want to recreate if it's stale, but for now reuse.
            return this.session;
        }

        const availability = await this.getAvailability();

        if (availability === 'no') {
            throw new Error('AI capabilities are not supported on this device.');
        }

        try {
            this.session = await window.ai.languageModel.create({
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        if (onProgress) {
                            onProgress({
                                loaded: e.loaded,
                                total: e.total,
                                percentage: (e.loaded / e.total) * 100
                            });
                        }
                        console.log(`AI Model Download: ${e.loaded}/${e.total}`);
                    });
                }
            });
            return this.session;
        } catch (err) {
            console.error('Failed to create AI session:', err);
            throw err;
        }
    }

    /**
     * Destroys the current session to free resources.
     */
    destroySession() {
        if (this.session) {
            this.session.destroy();
            this.session = null;
        }
    }

    /**
     * Generates text based on a prompt.
     * @param {string} promptText 
     * @param {Object} [options] - Options like systemPrompt (if supported)
     * @returns {Promise<string>}
     */
    async prompt(promptText, options = {}) {
        const session = await this.getSession();
        
        // Note: As of Chrome 130+, streaming is preferred, but simple `prompt` works.
        // We'll use the basic prompt for now.
        try {
            const result = await session.prompt(promptText);
            return result;
        } catch (err) {
            console.error('AI Prompt Execution Failed:', err);
            throw err;
        }
    }

    /**
     * Rewrites text (Specialized helper)
     * @param {string} text 
     * @param {string} instruction 
     * @returns {Promise<string>}
     */
    async rewrite(text, instruction) {
        const metaPrompt = `
Instruction: ${instruction}
Input Text: "${text}"

Rewrite the Input Text following the Instruction. Return ONLY the rewritten text.
`;
        return this.prompt(metaPrompt);
    }
}

export default new AIService();
