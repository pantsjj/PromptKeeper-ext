import StorageService from './services/StorageService.js';
// AIService will be used in future phases for the "Optimization" features
// import AIService from './services/AIService.js';

let currentPromptId = null;

// Expanded arrays for generating random titles
const adjectives = ['Quick', 'Lazy', 'Charming', 'Diligent', 'Mighty', 'Calm', 'Brave', 'Elegant', 'Fierce', 'Gentle', 'Happy', 'Jolly', 'Kind', 'Lively', 'Nice', 'Proud', 'Quirky', 'Rapid', 'Sharp', 'Vigorous'];
const animals = ['Fox', 'Horse', 'Lion', 'Panda', 'Eagle', 'Bear', 'Cat', 'Dog', 'Elephant', 'Giraffe', 'Kangaroo', 'Leopard', 'Monkey', 'Otter', 'Penguin', 'Quail', 'Rabbit', 'Snake', 'Tiger', 'Wolf'];
const objects = ['Pencil', 'Monitor', 'Chair', 'Tablet', 'Camera', 'Book', 'Clock', 'Desk', 'Guitar', 'Hat', 'Igloo', 'Jug', 'Kite', 'Lamp', 'Map', 'Notebook', 'Orange', 'Pillow', 'Quilt', 'Ruler'];

function generateRandomTitle() {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const object = objects[Math.floor(Math.random() * objects.length)];
    const num = Math.floor(Math.random() * 9000 + 1000);
    return `${adjective}-${animal}-${object}-${num}`;
}

/**
 * Loads and displays the list of prompts.
 */
async function loadPrompts() {
    try {
        const prompts = await StorageService.getPrompts();
        const promptList = document.getElementById('prompt-list');
        promptList.innerHTML = '';

        if (prompts.length === 0) {
            promptList.innerHTML = '<p>No prompts saved. Create a new one!</p>';
            clearStats();
            return;
        }

        prompts.forEach(prompt => {
            const entry = document.createElement('div');
            entry.className = 'prompt-entry';
            // Simple date formatting
            const dateStr = new Date(prompt.updatedAt).toLocaleString();
            
            entry.innerHTML = `
                <span class="prompt-title">${prompt.title}</span>
                <span class="date-stamp">${dateStr}</span>
            `;

            entry.addEventListener('click', () => selectPrompt(prompt));
            promptList.appendChild(entry);
        });

        // Auto-select logic
        if (currentPromptId) {
            const found = prompts.find(p => p.id === currentPromptId);
            if (found) selectPrompt(found);
            else if (prompts.length > 0) selectPrompt(prompts[0]);
        } else if (prompts.length > 0) {
            selectPrompt(prompts[0]);
        }

    } catch (err) {
        console.error('Failed to load prompts:', err);
    }
}

/**
 * Selects a prompt and populates the editor.
 * @param {Object} prompt 
 */
function selectPrompt(prompt) {
    currentPromptId = prompt.id;
    document.getElementById('prompt-title').value = prompt.title;
    
    // Get content from the head version
    const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId);
    document.getElementById('prompt-text').value = currentVersion ? currentVersion.content : '';
    
    updateStats();
}

/**
 * Updates the stats display (Word count, versions, etc)
 */
function updateStats() {
    const text = document.getElementById('prompt-text').value.trim();
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    document.getElementById('word-count').textContent = `Words: ${wordCount}`;

    if (currentPromptId) {
        StorageService.getPrompts().then(prompts => {
            const p = prompts.find(x => x.id === currentPromptId);
            if (p) {
                document.getElementById('version-count').textContent = `Versions: ${p.versions.length}`;
            }
        });
    } else {
        document.getElementById('version-count').textContent = `Versions: 0`;
    }
    
    updateStorageStats();
}

function updateStorageStats() {
    chrome.storage.local.getBytesInUse(null, (bytes) => {
        document.getElementById('storage-used').textContent = `Total Storage: ${(bytes / 1024).toFixed(2)} KB`;
    });
}

function clearStats() {
    document.getElementById('word-count').textContent = 'Words: 0';
    document.getElementById('version-count').textContent = 'Versions: 0';
    document.getElementById('storage-used').textContent = 'Total Storage: 0 KB';
}

// --- Event Listeners ---

// Save / Update
document.getElementById('save-button').addEventListener('click', async () => {
    let title = document.getElementById('prompt-title').value.trim();
    const text = document.getElementById('prompt-text').value.trim();

    if (!text) {
        alert('Please enter some text for the prompt.');
        return;
    }

    if (!title) title = generateRandomTitle();

    try {
        if (currentPromptId) {
            // Update existing
            await StorageService.updatePrompt(currentPromptId, text);
            await StorageService.renamePrompt(currentPromptId, title);
        } else {
            // Create new
            const newPrompt = await StorageService.addPrompt(text);
            if (title && title !== newPrompt.title) {
                 await StorageService.renamePrompt(newPrompt.id, title);
            }
            currentPromptId = newPrompt.id;
        }
        
        loadPrompts();
        alert('Saved!'); // Optional feedback
    } catch (err) {
        console.error('Save failed:', err);
        alert('Failed to save prompt.');
    }
});

// New Prompt
document.getElementById('new-prompt-button').addEventListener('click', () => {
    currentPromptId = null;
    document.getElementById('prompt-title').value = '';
    document.getElementById('prompt-text').value = '';
    clearStats();
});

// Delete
document.getElementById('delete-prompt-button').addEventListener('click', async () => {
    if (!currentPromptId) return;
    
    if (confirm('Are you sure you want to delete this prompt?')) {
        await StorageService.deletePrompt(currentPromptId);
        currentPromptId = null;
        document.getElementById('prompt-title').value = '';
        document.getElementById('prompt-text').value = '';
        loadPrompts();
    }
});

// Paste / Inject
document.getElementById('paste-prompt-button').addEventListener('click', () => {
    const text = document.getElementById('prompt-text').value.trim();
    if (!text) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || tabs[0].url.startsWith('chrome://')) {
            alert('Cannot paste into this page.');
            return;
        }
        
        const tabId = tabs[0].id;

        function sendMessage() {
            chrome.tabs.sendMessage(tabId, { action: "pastePrompt", text: text }, (response) => {
                if (chrome.runtime.lastError || (response && response.status !== 'success')) {
                    // Inject and retry
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['contentScript.js']
                    }, () => {
                        if (chrome.runtime.lastError) return;
                        chrome.tabs.sendMessage(tabId, { action: "pastePrompt", text: text });
                    });
                }
            });
        }
        
        sendMessage();
    });
});

// Export
document.getElementById('export-prompts').addEventListener('click', async () => {
    const prompts = await StorageService.getPrompts();
    const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptkeeper-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// Import
document.getElementById('import-prompts').addEventListener('click', () => {
    document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const imported = JSON.parse(ev.target.result);
            // This is a naive import. Realistically we should validate or merge.
            // For now, we assume standard format or rely on migration logic if it was a raw export.
            // Since `StorageService` manages the single source of truth, we need a method to bulk add.
            // For this specific task, we'll manually push via `addPrompt` for safety, 
            // or we need a `importPrompts` method in the Service.
            // Let's implement a simple loop for safety:
            if (Array.isArray(imported)) {
                // If it's the old string format
                if (imported.length && typeof imported[0] === 'string') {
                    for (const txt of imported) await StorageService.addPrompt(txt);
                } 
                // If it's the new object format
                else if (imported.length && imported[0].id) {
                    // We need a bulk save method in Service to preserve IDs/history, 
                    // or just add them as new copies. Let's add as new copies for safety to avoid ID collisions.
                    for (const p of imported) {
                        const content = p.versions ? p.versions.find(v => v.id === p.currentVersionId).content : '';
                        if (content) await StorageService.addPrompt(content);
                    }
                }
                loadPrompts();
                alert('Imported successfully (as new copies).');
            }
        } catch (err) {
            console.error(err);
            alert('Import failed. Invalid JSON.');
        }
    };
    reader.readAsText(file);
});

// Full Editor
document.getElementById('open-full-editor').addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options.html'));
    }
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadPrompts();
    updateStats();
    
    // Check if we are in the popup or standalone
    if (window.innerWidth > 600) {
        document.getElementById('full-editor-container').style.display = 'none';
    } else {
        document.getElementById('full-editor-container').style.display = 'block';
    }
});