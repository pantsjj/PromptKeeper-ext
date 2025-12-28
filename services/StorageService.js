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

        // Smart Restore: Adopt prompts with matching tag
        const prompts = await this.getPrompts();
        let modified = false;
        prompts.forEach(p => {
            if (p.tags && p.tags.some(t => t.toLowerCase() === name.trim().toLowerCase())) {
                p.projectId = newProject.id;
                modified = true;
            }
        });

        if (modified) {
            await this.saveAllPrompts(prompts);
        }

        return newProject;
    }

    /**
     * Deletes a project. 
     * Smart Delete: Prompts are NOT deleted. They are tagged with the project name and orphaned.
     * @param {string} id 
     */
    async deleteProject(id) {
        const projects = await this.getProjects();
        const projectToDelete = projects.find(p => p.id === id);

        if (projectToDelete) {
            // Smart Backup: Tag all prompts in this project with the project name
            const prompts = await this.getPrompts();
            let modified = false;

            prompts.forEach(p => {
                if (p.projectId === id) {
                    p.projectId = null; // Orphan
                    if (!p.tags) p.tags = [];
                    // Add legacy tag if not present
                    const tagName = projectToDelete.name;
                    if (!p.tags.includes(tagName)) {
                        p.tags.push(tagName);
                    }
                    modified = true;
                }
            });

            if (modified) {
                await this.saveAllPrompts(prompts);
            }
        }

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

    /**
     * Imports prompts (and optionally projects) from backup data.
     * 
     * Supported shapes:
     *   - Array<Prompt|string>                 → prompts only (legacy export)
     *   - { prompts: Array, projects?: Array } → full library backup
     * 
     * Prompts are merged into the existing library (deduped by ID).
     * Projects, when present, are merged and deduped by ID as well.
     * 
     * @param {any[]|{prompts:any[],projects?:any[]}} data 
     * @returns {Promise<number>} Count of newly imported prompts
     */
    async importPrompts(data) {
        let promptsPayload = data;
        let projectsPayload = null;

        // New-style backup object: { prompts, projects }
        if (!Array.isArray(data)) {
            if (!data || !Array.isArray(data.prompts)) {
                throw new Error("Invalid import data: Expected an array or {prompts:[],projects:[]} object.");
            }
            promptsPayload = data.prompts;
            projectsPayload = Array.isArray(data.projects) ? data.projects : null;
        }

        const importedPrompts = this._normalizeData(promptsPayload);
        const existingPrompts = await this.getPrompts();

        // Prompt deduplication by ID
        const existingIds = new Set(existingPrompts.map(p => p.id));
        const uniqueImported = importedPrompts.filter(p => !existingIds.has(p.id));
        const mergedPrompts = [...uniqueImported, ...existingPrompts];
        await this.saveAllPrompts(mergedPrompts);

        // Optional: merge projects when provided
        if (projectsPayload) {
            const existingProjects = await this.getProjects();
            const existingProjectIds = new Set(existingProjects.map(p => p.id));
            const uniqueProjects = projectsPayload.filter(p => !existingProjectIds.has(p.id));

            if (uniqueProjects.length > 0) {
                const mergedProjects = [...existingProjects, ...uniqueProjects];
                await new Promise((resolve, reject) => {
                    this.storage.set({ [STORAGE_KEY_PROJECTS]: mergedProjects }, () => {
                        if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                        resolve();
                    });
                });
            }
        }

        return uniqueImported.length;
    }
}

export default new StorageService();
