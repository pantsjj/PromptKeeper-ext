import StorageService from './services/StorageService.js';

let currentPromptId = null;

// DOM Elements
const els = {
    promptList: document.getElementById('prompt-list'),
    newBtn: document.getElementById('new-prompt-btn'),
    titleInput: document.getElementById('prompt-title-input'),
    textArea: document.getElementById('prompt-text-area'),
    saveBtn: document.getElementById('save-btn'),
    deleteBtn: document.getElementById('delete-btn'),
    wordCount: document.getElementById('word-count'),
    charCount: document.getElementById('char-count'),
    versionLabel: document.getElementById('version-label')
};

/**
 * Initialize the Options Page
 */
async function init() {
    await loadPrompts();
    setupEventListeners();
}

/**
 * Loads prompts from StorageService and renders the list
 */
async function loadPrompts() {
    const prompts = await StorageService.getPrompts();
    renderPromptList(prompts);

    // Auto-select logic if none selected
    if (!currentPromptId && prompts.length > 0) {
        selectPrompt(prompts[0]);
    } else if (prompts.length === 0) {
        createNewPrompt();
    }
}

/**
 * Renders the sidebar list
 * @param {Array} prompts 
 */
function renderPromptList(prompts) {
    els.promptList.innerHTML = '';
    
    prompts.forEach(prompt => {
        const li = document.createElement('li');
        li.className = `prompt-item ${currentPromptId === prompt.id ? 'active' : ''}`;
        
        const dateStr = new Date(prompt.updatedAt).toLocaleDateString();
        
        li.innerHTML = `
            <span class="prompt-item-title">${prompt.title}</span>
            <span class="prompt-item-date">${dateStr}</span>
        `;
        
        li.addEventListener('click', () => selectPrompt(prompt));
        els.promptList.appendChild(li);
    });
}

/**
 * Selects a specific prompt
 * @param {Object} prompt 
 */
function selectPrompt(prompt) {
    currentPromptId = prompt.id;
    els.titleInput.value = prompt.title;
    
    // Get content from current version
    const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId);
    els.textArea.value = currentVersion ? currentVersion.content : '';
    
    updateStats();
    
    // Refresh list highlight
    const items = els.promptList.querySelectorAll('.prompt-item');
    items.forEach((item, index) => {
        // Naive index matching, ideally use ID in dataset
        // Re-rendering list to ensure correct active state
    });
    // For simplicity, just re-render list to highlight correct ID
    // In production, optimized DOM manipulation is better.
    StorageService.getPrompts().then(renderPromptList);
}

/**
 * Prepares the editor for a new prompt
 */
function createNewPrompt() {
    currentPromptId = null;
    els.titleInput.value = '';
    els.textArea.value = '';
    els.titleInput.focus();
    updateStats();
    
    // Clear active state in list
    const items = els.promptList.querySelectorAll('.prompt-item');
    items.forEach(item => item.classList.remove('active'));
}

/**
 * Updates Word/Char counts
 */
function updateStats() {
    const text = els.textArea.value || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    els.wordCount.textContent = `Words: ${words}`;
    els.charCount.textContent = `Chars: ${text.length}`;
    
    if (currentPromptId) {
         StorageService.getPrompts().then(prompts => {
             const p = prompts.find(x => x.id === currentPromptId);
             if (p) {
                 els.versionLabel.textContent = `Versions: ${p.versions.length}`;
             }
         });
    } else {
        els.versionLabel.textContent = 'Versions: 0 (Unsaved)';
    }
}

/**
 * Saves the current prompt
 */
async function savePrompt() {
    let title = els.titleInput.value.trim();
    const text = els.textArea.value.trim();
    
    if (!text) return alert('Prompt text cannot be empty');
    if (!title) title = 'Untitled Prompt';
    
    try {
        if (currentPromptId) {
            // Parallel update for performance
            await Promise.all([
                StorageService.updatePrompt(currentPromptId, text),
                StorageService.renamePrompt(currentPromptId, title)
            ]);
        } else {
            const newPrompt = await StorageService.addPrompt(text);
            // If user typed a custom title for a new prompt, rename it immediately
            if (title !== 'Untitled Prompt') {
                await StorageService.renamePrompt(newPrompt.id, title);
            }
            currentPromptId = newPrompt.id;
        }
        await loadPrompts(); // Refresh list
    } catch (err) {
        console.error('Save error:', err);
        alert('Failed to save.');
    }
}

/**
 * Deletes the current prompt
 */
async function deletePrompt() {
    if (!currentPromptId) return;
    if (confirm('Delete this prompt permanently?')) {
        await StorageService.deletePrompt(currentPromptId);
        currentPromptId = null;
        await loadPrompts();
    }
}

function setupEventListeners() {
    els.newBtn.addEventListener('click', createNewPrompt);
    els.saveBtn.addEventListener('click', savePrompt);
    els.deleteBtn.addEventListener('click', deletePrompt);
    els.textArea.addEventListener('input', updateStats);
    
    // Auto-save shortcut (Ctrl/Cmd + S)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            savePrompt();
        }
    });
}

// Start
document.addEventListener('DOMContentLoaded', init);
