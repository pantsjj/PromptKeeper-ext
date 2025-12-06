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
     * Scores a prompt based on the 4 Pillars of effective prompting.
     * @param {string} promptText 
     * @returns {Promise<Object>} { score: number, feedback: string }
     */
    async scorePrompt(promptText) {
        const systemInstruction = `
You are an expert Prompt Engineer. Evaluate the user's prompt based on these 4 Pillars:
1. Persona (Who)
2. Task (What)
3. Context (Why/Background)
4. Format (How output should look)

Return a response in this exact format:
SCORE: [1-10]
FEEDBACK: [Brief specific advice to improve missing pillars]
`;
        
        const fullPrompt = `${systemInstruction}\n\nUser Prompt: "${promptText}"`;
        
        try {
            const response = await this.prompt(fullPrompt);
            
            // Simple parsing of the response
            const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
            const feedbackMatch = response.match(/FEEDBACK:\s*(.+)/is);
            
            return {
                score: scoreMatch ? parseInt(scoreMatch[1], 10) : 0,
                feedback: feedbackMatch ? feedbackMatch[1].trim() : "Could not parse feedback."
            };
        } catch (err) {
            console.error('Scoring failed:', err);
            return { score: 0, feedback: "AI service unavailable or error occurred." };
        }
    }

    /**
     * Refines a prompt based on a specific goal.
     * @param {string} promptText 
     * @param {string} refinementType - e.g., 'formalize', 'clarify', 'expand'
     * @returns {Promise<string>}
     */
    async refinePrompt(promptText, refinementType) {
        let instruction = "";
        switch (refinementType) {
            case 'formalize':
                instruction = "Rewrite this prompt to be more professional and corporate. Remove slang.";
                break;
            case 'clarify':
                instruction = "Make the 'Task' in this prompt clearer and more active. Use strong verbs.";
                break;
            case 'summarize':
                instruction = "Shorten this prompt while keeping the core intent. Aim for ~21 words.";
                break;
            case 'magic_enhance':
                instruction = "Rewrite this prompt to include a defined Persona, Task, Context, and Format. Extrapolate missing details reasonably.";
                break;
            case 'image_gen':
                instruction = "Rewrite this prompt to be an effective image generation prompt. Structure it by: Subject, Medium, Style, Lighting, Color, and Composition. Use descriptive keywords.";
                break;
            default:
                instruction = "Improve this prompt.";
        }

        return this.rewrite(promptText, instruction);
    }

    /**
     * Generates text based on a prompt.
     * @param {string} promptText 
     * @param {Object} [options] - Options like systemPrompt (if supported)
     * @returns {Promise<string>}
     */
    async prompt(promptText, _options = {}) {
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
