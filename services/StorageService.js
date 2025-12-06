/**
 * PromptKeeper Storage Service
 * Handles all interactions with chrome.storage.local
 * Enforces data consistency and handles migration legacy data.
 */

const STORAGE_KEY_PROMPTS = 'prompts';
const STORAGE_KEY_PROJECTS = 'projects';

/**
 * @typedef {Object} Project
 * @property {string} id - UUIDv4
 * @property {string} name - Display name
 * @property {string} systemPrompt - Base grounding context
 * @property {number} createdAt
 */

/**
 * @typedef {Object} Version
 * ... (existing types)
 */

class StorageService {
    constructor() {
        this.storage = chrome.storage.local;
    }

    _generateUUID() {
        return crypto.randomUUID();
    }

    /**
     * Migrates legacy array-of-strings data to the new object format.
     * @param {string[]|Object[]} data - The raw data from storage
     * @returns {Prompt[]} - The normalized Prompt objects
     */
    _normalizeData(data) {
        if (!Array.isArray(data)) return [];

        // Check if it's the old format (array of strings)
        if (data.length > 0 && typeof data[0] === 'string') {
            console.log('StorageService: Detected legacy data. Migrating...');
            return data.map(content => this._createPromptObject(content));
        }

        return data;
    }

    /**
     * Helper to create a new Prompt object from raw content
     * @param {string} content 
     * @returns {Prompt}
     */
    _createPromptObject(content) {
        const promptId = this._generateUUID();
        const versionId = this._generateUUID();
        const timestamp = Date.now();
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content;

        return {
            id: promptId,
            title: title || 'Untitled Prompt',
            currentVersionId: versionId,
            versions: [{
                id: versionId,
                content: content || '',
                timestamp: timestamp
            }],
            tags: [],
            createdAt: timestamp,
            updatedAt: timestamp
        };
    }

    // --- Projects ---

    /**
     * Retrieves all projects.
     * @returns {Promise<Project[]>}
     */
    async getProjects() {
        return new Promise((resolve, reject) => {
            this.storage.get([STORAGE_KEY_PROJECTS], (result) => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                resolve(result[STORAGE_KEY_PROJECTS] || []);
            });
        });
    }

    /**
     * Adds a new project.
     * @param {string} name 
     * @param {string} systemPrompt 
     * @returns {Promise<Project>}
     */
    async addProject(name, systemPrompt = "") {
        const projects = await this.getProjects();
        const newProject = {
            id: this._generateUUID(),
            name,
            systemPrompt,
            createdAt: Date.now()
        };
        projects.push(newProject);
        
        await new Promise((resolve, reject) => {
            this.storage.set({ [STORAGE_KEY_PROJECTS]: projects }, () => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                resolve();
            });
        });
        return newProject;
    }

    /**
     * Deletes a project. 
     * Note: Does NOT delete associated prompts (they become orphaned/default).
     * @param {string} id 
     */
    async deleteProject(id) {
        const projects = await this.getProjects();
        const filtered = projects.filter(p => p.id !== id);
        await new Promise((resolve, reject) => {
            this.storage.set({ [STORAGE_KEY_PROJECTS]: filtered }, () => {
                if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                resolve();
            });
        });
    }

    // --- Prompts ---

    /**
     * Retrieves all prompts, handling migration transparently.
     * @returns {Promise<Prompt[]>}
     */
    async getPrompts() {
        return new Promise((resolve, reject) => {
            this.storage.get([STORAGE_KEY_PROMPTS], (result) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                const rawData = result[STORAGE_KEY_PROMPTS] || [];
                const prompts = this._normalizeData(rawData);

                if (rawData.length > 0 && typeof rawData[0] === 'string') {
                    this.saveAllPrompts(prompts);
                }

                resolve(prompts);
            });
        });
    }

    /**
     * Assigns a prompt to a project.
     * @param {string} promptId 
     * @param {string|null} projectId - Null to remove from project
     */
    async setPromptProject(promptId, projectId) {
        const prompts = await this.getPrompts();
        const index = prompts.findIndex(p => p.id === promptId);
        if (index === -1) throw new Error("Prompt not found");
        
        prompts[index].projectId = projectId;
        prompts[index].updatedAt = Date.now();
        
        await this.saveAllPrompts(prompts);
    }

    /**
     * Saves the entire list of prompts (internal use).
     * @param {Prompt[]} prompts 
     * @returns {Promise<void>}
     */
    async saveAllPrompts(prompts) {
        return new Promise((resolve, reject) => {
            this.storage.set({ [STORAGE_KEY_PROMPTS]: prompts }, () => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }


    /**
     * Adds a new prompt.
     * @param {string} content 
     * @returns {Promise<Prompt>}
     */
    async addPrompt(content) {
        const prompts = await this.getPrompts();
        const newPrompt = this._createPromptObject(content);
        prompts.unshift(newPrompt); // Add to top
        await this.saveAllPrompts(prompts);
        return newPrompt;
    }

    /**
     * Updates an existing prompt by adding a new version.
     * @param {string} id 
     * @param {string} newContent 
     * @returns {Promise<Prompt>}
     */
    async updatePrompt(id, newContent) {
        const prompts = await this.getPrompts();
        const index = prompts.findIndex(p => p.id === id);

        if (index === -1) {
            throw new Error(`Prompt with ID ${id} not found`);
        }

        const prompt = prompts[index];
        const newVersionId = this._generateUUID();
        const timestamp = Date.now();

        // Create new version
        prompt.versions.push({
            id: newVersionId,
            content: newContent,
            timestamp: timestamp
        });

        // Update head
        prompt.currentVersionId = newVersionId;
        prompt.updatedAt = timestamp;
        
        // Update title if it was the default "Untitled" or generated from old content
        // (Simple logic: update title if it matches the start of the OLD content)
        // For now, let's keep the title unless user explicitly renames it (future feature).
        
        prompts[index] = prompt;
        await this.saveAllPrompts(prompts);
        return prompt;
    }

    /**
     * Updates the title of a prompt.
     * @param {string} id 
     * @param {string} newTitle 
     * @returns {Promise<Prompt>}
     */
    async renamePrompt(id, newTitle) {
        const prompts = await this.getPrompts();
        const index = prompts.findIndex(p => p.id === id);

        if (index === -1) {
            throw new Error(`Prompt with ID ${id} not found`);
        }

        const prompt = prompts[index];
        prompt.title = newTitle;
        prompt.updatedAt = Date.now();
        
        prompts[index] = prompt;
        await this.saveAllPrompts(prompts);
        return prompt;
    }

    /**
     * Deletes a prompt by ID.
     * @param {string} id 
     * @returns {Promise<void>}
     */
    async deletePrompt(id) {
        const prompts = await this.getPrompts();
        const filtered = prompts.filter(p => p.id !== id);
        await this.saveAllPrompts(filtered);
    }
}

export default new StorageService();
