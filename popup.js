import StorageService from './services/StorageService.js';
// Note: AI features removed from popup - Gemini Nano doesn't work in extension popups
// AI features are available in the full-page Manage Prompts screen (options.html)

let currentPromptId = null;

// DOM Elements Cache
const els = {};

function init() {
    bindElements();
    setupListeners();
    loadPrompts();
    // Note: AI status check removed - use full page for AI features
}

function bindElements() {
    els.promptList = document.getElementById('prompt-list');
    els.titleInput = document.getElementById('prompt-title');
    els.textArea = document.getElementById('prompt-text');
    els.searchInput = document.getElementById('popup-search');

    // Buttons
    els.saveBtn = document.getElementById('save-button');
    els.newBtn = document.getElementById('new-prompt-button');
    els.deleteBtn = document.getElementById('delete-prompt-button');
    els.pasteBtn = document.getElementById('paste-prompt-button');

    // Links
    els.exportLink = document.getElementById('export-link');
    els.importLink = document.getElementById('import-link');
    els.openFullEditorLink = document.getElementById('open-full-editor-link');

    // Inputs/Selectors
    els.importFile = document.getElementById('import-file');
    els.versionSelect = document.getElementById('version-selector');

    // Stats/Status
    els.wordCount = document.getElementById('word-count');
    els.storageUsed = document.getElementById('storage-used');
}

function setupListeners() {
    // Search Filter
    if (els.searchInput) {
        els.searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const items = els.promptList.querySelectorAll('.prompt-item');
            items.forEach(item => {
                const title = item.querySelector('.prompt-title').textContent.toLowerCase();
                // We could also search content if we had it in DOM, but title is usually sufficient for popup
                if (title.includes(term)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Save
    els.saveBtn.addEventListener('click', async () => {
        let title = els.titleInput.value.trim();
        const text = els.textArea.value.trim();

        if (!text) {
            alert('Please enter some text for the prompt.');
            return;
        }

        if (!title) title = generateRandomTitle();

        try {
            if (currentPromptId) {
                await StorageService.updatePrompt(currentPromptId, text);
                await StorageService.renamePrompt(currentPromptId, title);
            } else {
                const newPrompt = await StorageService.addPrompt(text);
                if (title && title !== newPrompt.title) {
                    await StorageService.renamePrompt(newPrompt.id, title);
                }
                currentPromptId = newPrompt.id;
            }

            await loadPrompts();
            // Pulse
            els.textArea.classList.add('pulse-green');
            setTimeout(() => els.textArea.classList.remove('pulse-green'), 1000);
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save prompt.');
        }
    });

    // New
    els.newBtn.addEventListener('click', () => {
        currentPromptId = null;
        els.titleInput.value = '';
        els.textArea.value = '';
        clearStats();
    });

    // Delete
    els.deleteBtn.addEventListener('click', async () => {
        if (!currentPromptId) return;
        if (confirm('Are you sure you want to delete this prompt?')) {
            await StorageService.deletePrompt(currentPromptId);
            currentPromptId = null;
            els.titleInput.value = '';
            els.textArea.value = '';
            clearStats();
            await loadPrompts();
        }
    });

    // Paste
    els.pasteBtn.addEventListener('click', () => {
        const text = els.textArea.value.trim();
        if (!text) return;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0] || tabs[0].url.startsWith('chrome://')) {
                alert('Cannot paste into this page.');
                return;
            }

            const tabId = tabs[0].id;

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
        });
    });

    // Manage Prompts Link
    els.openFullEditorLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });

    // Import/Export
    els.exportLink.addEventListener('click', async (e) => {
        e.preventDefault();
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

    els.importLink.addEventListener('click', (e) => {
        e.preventDefault();
        els.importFile.click();
    });

    els.importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const count = await StorageService.importPrompts(json);
                alert(`Successfully imported ${count} prompts.`);
                loadPrompts();
            } catch (err) {
                console.error('Import failed:', err);
                alert('Failed to import prompts. Invalid JSON file.');
            } finally {
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    });
}

// Helpers
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

async function loadPrompts() {
    try {
        const prompts = await StorageService.getPrompts();
        els.promptList.innerHTML = ''; // Clear

        if (prompts.length === 0) {
            els.promptList.innerHTML = '<p style="padding:10px; color:#999; text-align:center;">No prompts saved.</p>';
            clearStats();
            return;
        }

        // Apply Search Filter if any
        const searchTerm = els.searchInput ? els.searchInput.value.toLowerCase() : '';

        prompts.forEach(prompt => {
            const entry = document.createElement('div');
            entry.className = 'prompt-item'; // Match CSS class we expect
            // Can add styling class 'prompt-entry' if that's what styles.css uses, let's use prompt-item to be generic or prompt-entry
            // In the previous file it was 'prompt-entry'.
            entry.classList.add('prompt-entry');

            const dateStr = new Date(prompt.updatedAt).toLocaleDateString();

            entry.innerHTML = `
                <span class="prompt-title">${prompt.title}</span>
                <span class="date-stamp">${dateStr}</span>
            `;

            // Filter
            if (searchTerm && !prompt.title.toLowerCase().includes(searchTerm)) {
                entry.style.display = 'none';
            }

            entry.addEventListener('click', () => selectPrompt(prompt));
            els.promptList.appendChild(entry);
        });

        // Auto-select logic
        if (!currentPromptId && prompts.length > 0 && !searchTerm) {
            selectPrompt(prompts[0]);
        } else if (currentPromptId) {
            // keep selection
            const found = prompts.find(p => p.id === currentPromptId);
            if (found) selectPrompt(found);
        }

    } catch (err) {
        console.error('Failed to load prompts:', err);
    }
}

function selectPrompt(prompt) {
    currentPromptId = prompt.id;
    els.titleInput.value = prompt.title;

    // Get content from the head version
    const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId);
    els.textArea.value = currentVersion ? currentVersion.content : '';

    updateStats();
    renderVersionSelector(prompt);
}

function renderVersionSelector(prompt) {
    const selector = els.versionSelect;
    if (!selector) return;

    selector.innerHTML = '';
    const sorted = [...prompt.versions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

    sorted.forEach((v, idx) => {
        const option = document.createElement('option');
        option.value = v.id;
        const verNum = prompt.versions.length - idx;
        const isCurrent = v.id === prompt.currentVersionId;
        const dateStr = new Date(v.timestamp).toLocaleDateString();

        option.textContent = `v${verNum}: ${dateStr} ${isCurrent ? '(Curr)' : ''}`;
        if (isCurrent) option.selected = true;
        selector.appendChild(option);
    });

    selector.onchange = (e) => {
        const vId = e.target.value;
        const version = prompt.versions.find(v => v.id === vId);
        if (version) {
            els.textArea.value = version.content;
            updateStats(false);
        }
    };
}

function updateStats(renderSelector = true) {
    const text = els.textArea.value.trim();
    const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
    els.wordCount.textContent = `Words: ${wordCount}`;

    if (currentPromptId && renderSelector) {
        StorageService.getPrompts().then(prompts => {
            const p = prompts.find(x => x.id === currentPromptId);
            if (p) {
                renderVersionSelector(p);
            }
        });
    } else if (!currentPromptId) {
        if (els.versionSelect) els.versionSelect.innerHTML = '<option>New</option>';
    }

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        els.storageUsed.textContent = `Size: ${(bytes / 1024).toFixed(2)} KB`;
    });
}

function clearStats() {
    els.wordCount.textContent = 'Words: 0';
    if (els.versionSelect) els.versionSelect.innerHTML = '<option>Rev: 0</option>';
    els.storageUsed.textContent = 'Size: 0 KB';
}

document.addEventListener('DOMContentLoaded', init);