import StorageService from './services/StorageService.js';
import AIService from './services/AIService.js';

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
    versionLabel: document.getElementById('version-label'),
    historyList: null, // Will be initialized
    scoreBtn: document.getElementById('score-btn'),
    scoreResult: document.getElementById('score-result'),
    scoreValue: document.getElementById('score-value'),
    scoreFeedback: document.getElementById('score-feedback'),
    refineBtns: document.querySelectorAll('.refine-btn')
};

/**
 * Initialize the Options Page
 */
async function init() {
    // History List Container setup
    const historyPlaceholder = document.querySelector('.panel-section:nth-child(3) .ai-tools-placeholder');
    if (historyPlaceholder) {
        const listContainer = document.createElement('ul');
        listContainer.id = 'history-list';
        listContainer.style.listStyle = 'none';
        listContainer.style.padding = '0';
        listContainer.style.margin = '0';
        historyPlaceholder.replaceWith(listContainer);
        els.historyList = listContainer;
    } else {
        els.historyList = document.getElementById('history-list'); 
    }

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
    renderHistory(prompt);
    
    // Refresh list highlight
    const items = els.promptList.querySelectorAll('.prompt-item');
    items.forEach((item) => {
        item.classList.remove('active');
        // Simple text matching for now, ideally use ID in dataset
        if (item.querySelector('.prompt-item-title').textContent === prompt.title) {
           item.classList.add('active');
        }
    });
}

/**
 * Renders the history list in the sidebar
 * @param {Object} prompt 
 */
function renderHistory(prompt) {
    if (!els.historyList) return;
    els.historyList.innerHTML = '';
    
    // Sort versions new -> old
    const sortedVersions = [...prompt.versions].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedVersions.forEach(version => {
        const isCurrent = version.id === prompt.currentVersionId;
        const li = document.createElement('li');
        li.style.padding = '8px 0';
        li.style.borderBottom = '1px solid var(--border-color)';
        li.style.fontSize = '12px';
        li.style.cursor = 'pointer';
        
        const date = new Date(version.timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString();
        
        li.innerHTML = `
            <div style="flex: 1;">
                <div style="font-weight: ${isCurrent ? 'bold' : 'normal'}; color: ${isCurrent ? 'var(--primary-color)' : 'inherit'}">
                    ${isCurrent ? 'Current Version' : 'Previous Version'}
                </div>
                <div style="color: #888;">${dateStr} ${timeStr}</div>
            </div>
        `;

        if (!isCurrent) {
            const restoreBtn = document.createElement('button');
            restoreBtn.textContent = 'Restore';
            restoreBtn.style.marginLeft = '10px';
            restoreBtn.style.padding = '4px 8px';
            restoreBtn.style.fontSize = '11px';
            restoreBtn.style.cursor = 'pointer';
            restoreBtn.style.border = '1px solid var(--border-color)';
            restoreBtn.style.backgroundColor = 'var(--bg-color)';
            restoreBtn.style.color = 'var(--text-color)';
            restoreBtn.style.borderRadius = '3px';
            
            restoreBtn.onclick = (e) => {
                e.stopPropagation(); // Prevent preview click
                restoreVersion(version);
            };
            
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.justifyContent = 'space-between';
            li.appendChild(restoreBtn);
        }
        
        li.addEventListener('click', () => previewVersion(version));
        els.historyList.appendChild(li);
    });
}

/**
 * Previews a specific version in the editor
 * @param {Object} version 
 */
function previewVersion(version) {
    els.textArea.value = version.content;
    updateStats();
}

/**
 * Restores a version by saving it as the new current version
 * @param {Object} version 
 */
async function restoreVersion(version) {
    if (confirm('Restore this version? This will save it as the new current version.')) {
        els.textArea.value = version.content;
        await savePrompt();
    }
}

/**
 * Prepares the editor for a new prompt
 */
function createNewPrompt() {
    currentPromptId = null;
    els.titleInput.value = '';
    els.textArea.value = '';
    if (els.historyList) els.historyList.innerHTML = '<div style="color:#888; padding:10px;">No history</div>';
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
        
        // Reload to update history list with the new version
        const prompts = await StorageService.getPrompts();
        const updatedPrompt = prompts.find(p => p.id === currentPromptId);
        if (updatedPrompt) selectPrompt(updatedPrompt); 
        
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

    // AI Features
    if (els.scoreBtn) {
        els.scoreBtn.addEventListener('click', handleScore);
    }
    
    if (els.refineBtns) {
        els.refineBtns.forEach(btn => {
            btn.addEventListener('click', () => handleRefine(btn.dataset.type));
        });
    }
}

/**
 * AI: Score the current prompt
 */
async function handleScore() {
    const text = els.textArea.value.trim();
    if (!text) return alert("Enter a prompt to score.");

    els.scoreBtn.textContent = "Analyzing...";
    els.scoreBtn.disabled = true;
    els.scoreResult.classList.add('hidden');

    try {
        const result = await AIService.scorePrompt(text);
        
        els.scoreValue.textContent = `${result.score}/10`;
        els.scoreFeedback.textContent = result.feedback;
        els.scoreResult.classList.remove('hidden');
        
        // Color coding
        if (result.score >= 8) els.scoreValue.style.color = '#188038'; // Green
        else if (result.score >= 5) els.scoreValue.style.color = '#f9ab00'; // Orange
        else els.scoreValue.style.color = '#d93025'; // Red

    } catch (err) {
        alert("AI Scoring failed. Make sure Gemini Nano is available.");
        console.error(err);
    } finally {
        els.scoreBtn.textContent = "✨ Score Prompt";
        els.scoreBtn.disabled = false;
    }
}

/**
 * AI: Refine the prompt (Magic Enhance, Formalize, etc)
 */
async function handleRefine(type) {
    const text = els.textArea.value.trim();
    if (!text) return alert("Enter a prompt to refine.");

    const originalText = els.saveBtn.textContent;
    els.saveBtn.textContent = "Refining...";
    document.body.style.cursor = 'wait';

    try {
        const refinedText = await AIService.refinePrompt(text, type);
        
        if (refinedText) {
            els.textArea.value = refinedText;
            // Automatically save as new version to allow easy revert
            await savePrompt();
            alert(`Prompt refined (${type}) and saved as new version!`);
        }
    } catch (err) {
        alert("Refinement failed. " + err.message);
    } finally {
        els.saveBtn.textContent = "Save";
        document.body.style.cursor = 'default';
        updateStats();
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);