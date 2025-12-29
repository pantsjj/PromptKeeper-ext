import StorageService from './services/StorageService.js';
import GoogleDriveService from './services/GoogleDriveService.js';
import AIService from './services/AIService.js';

let currentPromptId = null;

// DOM Elements Cache
const els = {};

function init() {
    bindElements();
    applyLanguageModelShims();
    setupListeners();
    initFontSize();
    setupUI(); // Initialize UI interactions (toggles, resize)
    loadWorkspaces(); // Load workspace list
    loadPrompts();
    initGoogleDrive(); // Check Drive auth state
    checkAIAvailability(); // Check if AI buttons should be shown

    // Real-time updates when storage changes (e.g., after restore from Google Drive)
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes['prompts']) {
                console.log('[Popup] Prompts changed, reloading...');
                loadPrompts();
            }
            if (changes['projects']) {
                console.log('[Popup] Projects changed, reloading workspaces...');
                loadWorkspaces();
            }
            if (changes['editorFontSize']) {
                const next = typeof changes.editorFontSize.newValue === 'number'
                    ? changes.editorFontSize.newValue
                    : 13;
                document.documentElement.style.setProperty('--prompt-font-size', `${next}px`);
            }
        }
    });
}

function initFontSize() {
    // Apply shared editor font size from options to sidepanel
    chrome.storage.local.get(['editorFontSize'], (result) => {
        const size = typeof result.editorFontSize === 'number' ? result.editorFontSize : 13;
        document.documentElement.style.setProperty('--prompt-font-size', `${size}px`);
    });
}

function applyLanguageModelShims() {
    // Default language options to prevent Chrome's "No output language was specified" warning
    const defaultLangOpts = { expectedInputLanguages: ['en'], expectedOutputLanguages: ['en'] };

    try {
        // If the page already loaded `language-model-shim.js`, do nothing (failsafe only)
        if (window.LanguageModel?.__pkShimmed || window.LanguageModel?.__pkWrapped) return;
        if (window.ai?.languageModel?.__pkShimmed || window.ai?.languageModel?.__pkWrapped) return;

        // Wrap window.LanguageModel
        if (window.LanguageModel && !window.LanguageModel.__pkWrapped) {
            // Wrap create()
            if (typeof window.LanguageModel.create === 'function') {
                const origCreate = window.LanguageModel.create.bind(window.LanguageModel);
                window.LanguageModel.create = (options = {}) => {
                    const merged = { expectedContext: 'en', outputLanguage: 'en', ...options };
                    return origCreate(merged);
                };
            }
            // Wrap availability()
            if (typeof window.LanguageModel.availability === 'function') {
                const origAvail = window.LanguageModel.availability.bind(window.LanguageModel);
                window.LanguageModel.availability = (options = {}) => {
                    const merged = { ...defaultLangOpts, ...options };
                    return origAvail(merged);
                };
            }
            // Wrap capabilities()
            if (typeof window.LanguageModel.capabilities === 'function') {
                const origCaps = window.LanguageModel.capabilities.bind(window.LanguageModel);
                window.LanguageModel.capabilities = (options = {}) => {
                    const merged = { ...defaultLangOpts, ...options };
                    return origCaps(merged);
                };
            }
            window.LanguageModel.__pkWrapped = true;
        }

        // Wrap window.ai.languageModel
        if (window.ai && window.ai.languageModel && !window.ai.languageModel.__pkWrapped) {
            // Wrap create()
            if (typeof window.ai.languageModel.create === 'function') {
                const origCreate = window.ai.languageModel.create.bind(window.ai.languageModel);
                window.ai.languageModel.create = (options = {}) => {
                    const merged = { expectedContext: 'en', outputLanguage: 'en', ...options };
                    return origCreate(merged);
                };
            }
            // Wrap capabilities()
            if (typeof window.ai.languageModel.capabilities === 'function') {
                const origCaps = window.ai.languageModel.capabilities.bind(window.ai.languageModel);
                window.ai.languageModel.capabilities = (options = {}) => {
                    const merged = { ...defaultLangOpts, ...options };
                    return origCaps(merged);
                };
            }
            window.ai.languageModel.__pkWrapped = true;
        }
    } catch (e) {
        console.warn('[Popup] Failed to install LanguageModel shims', e);
    }
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

    // Links (Backup/Restore for side panel)
    els.backupLink = document.getElementById('backup-link');
    els.restoreLink = document.getElementById('restore-link');
    els.openFullEditorLink = document.getElementById('open-full-editor-link');

    // Inputs/Selectors
    els.importFile = document.getElementById('import-file');
    els.versionSelect = document.getElementById('version-selector');

    // Stats/Status
    els.wordCount = document.getElementById('word-count');
    els.storageUsed = document.getElementById('storage-used');
    els.aiProgress = document.getElementById('ai-progress');
    els.localModelStats = document.getElementById('local-model-stats');

    // Google Drive elements
    els.googleSigninBtn = document.getElementById('google-signin-btn');
    els.googleSignoutBtn = document.getElementById('google-signout-btn');
    els.driveSignedOut = document.getElementById('drive-signed-out');
    els.driveSignedIn = document.getElementById('drive-signed-in');
    els.userEmail = document.getElementById('user-email');

    // Workspace elements
    els.addProjectBtn = document.getElementById('add-project-btn');
    els.addPromptBtnSidebar = document.getElementById('add-prompt-btn-sidebar');
    els.workspaceList = document.getElementById('workspace-list');

    // AI Elements
    els.aiRow = document.getElementById('ai-buttons-row');
    els.magicBtn = document.getElementById('magic-btn');
    els.clarityBtn = document.getElementById('clarity-btn');
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

            // Reload list and re-select the updated prompt so history dropdown refreshes immediately
            await loadPrompts();
            if (currentPromptId) {
                const prompts = await StorageService.getPrompts();
                const updated = prompts.find(p => p.id === currentPromptId);
                if (updated) selectPrompt(updated);
            }
            // Clear unsaved state + pulse
            els.textArea.classList.remove('unsaved-glow');
            els.textArea.classList.add('pulse-green');
            setTimeout(() => els.textArea.classList.remove('pulse-green'), 1000);
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save prompt.');
        }
    });

    // Mark editor dirty on changes
    els.textArea.addEventListener('input', () => {
        els.textArea.classList.add('unsaved-glow');
    });

    // New
    const handleNewPrompt = () => {
        currentPromptId = null;
        els.titleInput.value = '';
        els.textArea.value = '';
        clearStats();
        els.textArea.classList.remove('unsaved-glow');

        // Force Edit Mode
        const previewDiv = document.getElementById('markdown-preview');
        const toggleBtn = document.getElementById('toggle-preview-btn');
        if (previewDiv && toggleBtn) {
            els.textArea.classList.remove('hidden');
            previewDiv.classList.add('hidden');
            toggleBtn.classList.remove('active');
            toggleBtn.innerHTML = "👀";
            toggleBtn.title = "View Preview";
        }

        // Also scroll to top of editor if needed or focus title
        if (els.titleInput) els.titleInput.focus();
    };

    els.newBtn.addEventListener('click', handleNewPrompt);
    if (els.addPromptBtnSidebar) {
        els.addPromptBtnSidebar.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent toggling the section
            handleNewPrompt();
        });
    }

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

    // Formatting & Save Shortcuts (Cmd+B, Cmd+I, Cmd+S)
    els.textArea.addEventListener('keydown', (e) => {
        if (!(e.metaKey || e.ctrlKey)) return;

        // Save (Cmd/Ctrl+S) should save the current prompt instead of page save
        if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            els.saveBtn?.click();
            return;
        }

        const start = els.textArea.selectionStart;
        const end = els.textArea.selectionEnd;
        const text = els.textArea.value;
        let inserted = false;

        if (e.key === 'b' || e.key === 'B') { // Bold
            e.preventDefault();
            const selection = text.substring(start, end);
            const replacement = `**${selection}**`;
            els.textArea.setRangeText(replacement, start, end, 'select');
            inserted = true;
        } else if (e.key === 'i' || e.key === 'I') { // Italic
            e.preventDefault();
            const selection = text.substring(start, end);
            const replacement = `*${selection}*`;
            els.textArea.setRangeText(replacement, start, end, 'select');
            inserted = true;
        }

        if (inserted) {
            // Sync preview immediately
            if (typeof setPromptText === 'function') {
                setPromptText(els.textArea.value);
            }
            updateStats();
        }
    });

    // Paste (Strip Markdown)
    els.pasteBtn.addEventListener('click', () => {
        const rawText = els.textArea.value.trim();
        if (!rawText) return;

        // Strip Markdown
        let cleanText = rawText;
        try {
            if (window.marked) {
                // Parse to HTML
                const html = window.marked.parse(rawText);
                // Create temp element to extract textContent
                const tempDir = document.createElement('div');
                tempDir.innerHTML = html;
                cleanText = tempDir.textContent || tempDir.innerText || "";
            }
        } catch (e) {
            console.warn("Markdown stripping failed, using raw text", e);
        }

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0] || tabs[0].url.startsWith('chrome://')) {
                alert('Cannot paste into this page.');
                return;
            }

            const tabId = tabs[0].id;

            chrome.tabs.sendMessage(tabId, { action: "pastePrompt", text: cleanText }, (response) => {
                if (chrome.runtime.lastError || (response && response.status !== 'success')) {
                    // Inject and retry
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['contentScript.js']
                    }, () => {
                        if (chrome.runtime.lastError) return;
                        chrome.tabs.sendMessage(tabId, { action: "pastePrompt", text: cleanText });
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
        // Close just this side panel window so the icon can still reopen it later
        try {
            window.close();
        } catch (err) {
            console.warn('[Popup] Failed to close side panel window:', err);
        }
    });

    // Markdown Preview Toggle
    const togglePreviewBtn = document.getElementById('toggle-preview-btn');
    const previewDiv = document.getElementById('markdown-preview');

    if (togglePreviewBtn && previewDiv) {
        // Enable Click-to-Edit
        previewDiv.addEventListener('click', () => {
            if (!previewDiv.classList.contains('hidden')) {
                // Switch to Edit Mode
                previewDiv.classList.add('hidden');
                els.textArea.classList.remove('hidden');

                togglePreviewBtn.classList.remove('active');
                togglePreviewBtn.innerHTML = "👀";
                togglePreviewBtn.title = "View Preview";

                els.textArea.focus();
            }
        });
        previewDiv.style.cursor = 'text'; // Visual cue

        togglePreviewBtn.addEventListener('click', () => {
            const isEditing = !els.textArea.classList.contains('hidden');

            if (isEditing) {
                // Switch to Preview
                els.textArea.classList.add('hidden');
                previewDiv.classList.remove('hidden');

                // Render Markdown
                const raw = els.textArea.value;
                previewDiv.innerHTML = window.marked ? window.marked.parse(raw) : raw;

                togglePreviewBtn.classList.add('active');
                togglePreviewBtn.innerHTML = "👨‍💻"; // Code icon
                togglePreviewBtn.title = "Edit Raw Markdown";
            } else {
                // Switch to Edit
                previewDiv.classList.add('hidden');
                els.textArea.classList.remove('hidden');

                togglePreviewBtn.classList.remove('active');
                togglePreviewBtn.innerHTML = "👀";
                togglePreviewBtn.title = "View Preview";

                els.textArea.focus();
            }
        });
    }

    // Backup/Restore (Google Drive)
    if (els.backupLink) {
        els.backupLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleBackupToDrive();
        });
    }

    if (els.restoreLink) {
        els.restoreLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await handleRestoreFromDrive();
        });
    }

    // Add Workspace (inline creation)
    if (els.addProjectBtn && els.workspaceList) {
        els.addProjectBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent section toggle
            showInlineWorkspaceInput();
        });
    }

    // Context Menu Logic
    initContextMenu();
}



/**
 * Initialize Context Menu interactions
 */
function initContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    const deleteOption = document.getElementById('ctx-delete-workspace');

    // Hide menu on any click outside
    document.addEventListener('click', () => {
        if (contextMenu) contextMenu.classList.add('hidden');
    });

    // Handle Delete Option Click
    if (deleteOption) {
        deleteOption.addEventListener('click', async (e) => {
            e.stopPropagation();
            const projectId = contextMenu.dataset.targetId;
            const projectName = contextMenu.dataset.targetName;

            if (projectId && projectName) {
                // Confirm Smart Delete
                const confirmed = confirm(
                    `Delete workspace '${projectName}'?\n\n` +
                    `Prompts will NOT be deleted. They will be tagged '${projectName}' ` +
                    `and moved to "All Prompts".`
                );

                if (confirmed) {
                    try {
                        await StorageService.deleteProject(projectId);
                        await refreshUI();
                        // Reset to all prompts if we deleted the current project
                        const allLi = els.workspaceList.querySelector('[data-id="all"]');
                        if (allLi) allLi.click();
                    } catch (err) {
                        console.error('Failed to delete workspace:', err);
                        alert('Failed to delete workspace.');
                    }
                }
            }
            contextMenu.classList.add('hidden');
        });
    }
}
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
 * Show inline input for new workspace creation
 */
function showInlineWorkspaceInput() {
    // Remove existing input if any
    const existing = document.getElementById('inline-workspace-input');
    if (existing) existing.remove();

    // Create input element
    const li = document.createElement('li');
    li.id = 'inline-workspace-input';
    li.innerHTML = `
        <input type="text" placeholder="Workspace name..." 
               style="width: 100%; padding: 6px 8px; border: 1px solid var(--primary-color); 
                      border-radius: 4px; font-size: 12px; outline: none;">
    `;

    // Insert after "All Prompts"
    const allPromptsItem = els.workspaceList.querySelector('[data-id="all"]');
    if (allPromptsItem) {
        allPromptsItem.after(li);
    } else {
        els.workspaceList.appendChild(li);
    }

    const input = li.querySelector('input');
    input.focus();

    // Handle Enter key
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const name = input.value.trim();
            if (name) {
                try {
                    await StorageService.addProject(name);
                    li.remove();
                    loadWorkspaces(); // Refresh workspace list
                } catch (err) {
                    console.error('Failed to add workspace:', err);
                    alert('Failed to add workspace: ' + err.message);
                }
            }
        } else if (e.key === 'Escape') {
            li.remove();
        }
    });

    // Handle blur
    input.addEventListener('blur', () => {
        setTimeout(() => li.remove(), 200);
    });
}

/**
 * Load and render workspaces list
 */
async function loadWorkspaces() {
    const projects = await StorageService.getProjects();

    // Clear all except "All Prompts"
    // const allPromptsItem = els.workspaceList.querySelector('[data-id="all"]'); // Removed unused
    els.workspaceList.innerHTML = '';

    // Re-add "All Prompts" at top
    const allLi = document.createElement('li');
    allLi.className = 'nav-item active';
    allLi.dataset.id = 'all';
    allLi.textContent = 'All Prompts';
    allLi.addEventListener('click', () => {
        document.querySelectorAll('#workspace-list .nav-item').forEach(item => item.classList.remove('active'));
        allLi.classList.add('active');
        loadPrompts(); // Show all prompts
    });
    els.workspaceList.appendChild(allLi);

    // Add each project
    projects.sort((a, b) => a.name.localeCompare(b.name));
    projects.forEach(project => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.dataset.id = project.id;
        li.textContent = project.name;
        li.addEventListener('click', () => {
            document.querySelectorAll('#workspace-list .nav-item').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            loadPrompts(project.id); // Filter prompts by project
        });

        // Context Menu (Right Click)
        li.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            // Select item visually
            document.querySelectorAll('#workspace-list .nav-item').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            loadPrompts(project.id);

            // Position and show menu
            const menu = document.getElementById('context-menu');
            if (menu) {
                menu.style.top = `${e.pageY}px`;
                menu.style.left = `${e.pageX}px`;
                menu.dataset.targetId = project.id;
                menu.dataset.targetName = project.name;
                menu.classList.remove('hidden');
            }
        });

        // Make workspace a drop target
        setupDropTarget(li, project.id);
        els.workspaceList.appendChild(li);
    });
}

/**
 * Drag and Drop - Make prompt draggable
 */
function setupDragSource(el, promptId) {
    el.draggable = true;
    el.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', promptId);
        el.style.opacity = '0.5';
    });
    el.addEventListener('dragend', () => {
        el.style.opacity = '1';
        document.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
    });
}

/**
 * Drag and Drop - Make workspace a drop target
 */
function setupDropTarget(el, targetProjectId) {
    el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        el.classList.add('drag-over');
    });
    el.addEventListener('dragleave', () => {
        el.classList.remove('drag-over');
    });
    el.addEventListener('drop', async (e) => {
        e.preventDefault();
        el.classList.remove('drag-over');
        const promptId = e.dataTransfer.getData('text/plain');
        if (promptId) {
            console.log(`[Popup] Moving prompt ${promptId} to project ${targetProjectId}`);
            await StorageService.setPromptProject(promptId, targetProjectId);
            loadPrompts(); // Refresh
        }
    });
}

/**
 * Refresh both workspaces and prompts
 */
async function refreshUI() {
    await loadWorkspaces();
    await loadPrompts();
}

async function loadPrompts(filterProjectId = null) {
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
            // Filter by project if specified
            if (filterProjectId && prompt.projectId !== filterProjectId) {
                return; // Skip prompts not in this project
            }

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

            entry.dataset.id = prompt.id; // Store ID

            // Active state
            if (currentPromptId === prompt.id) {
                entry.classList.add('active');
            }

            entry.addEventListener('click', () => selectPrompt(prompt));
            // Make prompt draggable
            setupDragSource(entry, prompt.id);
            els.promptList.appendChild(entry);
        });

        // Auto-select logic
        if (!currentPromptId && prompts.length > 0 && !searchTerm) {
            selectPrompt(prompts[0]);
        } else if (currentPromptId && prompts.length > 0) {
            // keep selection
            const found = prompts.find(p => p.id === currentPromptId);
            if (found) {
                // Ensure visual state is correct if we reloaded but kept ID
                const item = els.promptList.querySelector(`.prompt-entry[data-id="${currentPromptId}"]`);
                if (item) item.classList.add('active');
            }
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

    // Highlight in list
    const items = els.promptList.querySelectorAll('.prompt-entry');
    items.forEach(i => {
        i.classList.remove('active');
        if (i.dataset.id === prompt.id) {
            i.classList.add('active');
        }
    });

    // Default to Preview Mode
    const previewDiv = document.getElementById('markdown-preview');
    const toggleBtn = document.getElementById('toggle-preview-btn');
    if (previewDiv && toggleBtn) {
        els.textArea.classList.add('hidden');
        previewDiv.classList.remove('hidden');
        const raw = els.textArea.value;
        previewDiv.innerHTML = window.marked ? window.marked.parse(raw) : raw;

        toggleBtn.innerHTML = "👨‍💻";
        toggleBtn.classList.add('active');
    }
}

function renderVersionSelector(prompt) {
    const selector = els.versionSelect;
    if (!selector) return;

    selector.innerHTML = '';
    // Show the most recent 50 versions in the dropdown (full history kept in storage)
    const sorted = [...prompt.versions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);

    sorted.forEach((v, idx) => {
        const option = document.createElement('option');
        option.value = v.id;
        const verNum = prompt.versions.length - idx;
        const isCurrent = v.id === prompt.currentVersionId;
        const dateStr = new Date(v.timestamp).toLocaleDateString();

        option.textContent = `v${verNum}: ${dateStr} ${isCurrent ? '(Current)' : ''}`;
        if (isCurrent) option.selected = true;
        selector.appendChild(option);
    });

    selector.onchange = (e) => {
        const vId = e.target.value;
        const version = prompt.versions.find(v => v.id === vId);
        if (version) {
            els.textArea.value = version.content;
            updateStats(false);
            // If preview is visible, re-render markdown so it matches selected revision
            const previewDiv = document.getElementById('markdown-preview');
            if (previewDiv && !previewDiv.classList.contains('hidden')) {
                if (window.marked) {
                    try {
                        previewDiv.innerHTML = window.marked.parse(version.content);
                    } catch {
                        previewDiv.textContent = version.content;
                    }
                } else {
                    previewDiv.textContent = version.content;
                }
            }
            // Selecting a past revision is unsaved until user clicks Save
            els.textArea.classList.add('unsaved-glow');
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

// ============================================================================
// Google Drive Functions
// ============================================================================

/**
 * Setup UI interactions (Toggles, Resize)
 */
function setupUI() {
    // Collapsible section toggle functionality
    const toggleHeaders = document.querySelectorAll('#workspace-toggle, #prompts-toggle');
    toggleHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            // Prevent toggling when clicking buttons inside header
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            e.stopPropagation();
            header.classList.toggle('collapsed');
            const content = header.nextElementSibling;
            if (content && content.classList.contains('section-content')) {
                content.classList.toggle('collapsed');
            }
        });
    });

    // Resize handle functionality
    const resizeHandle = document.getElementById('resize-handle');
    const sidebar = document.getElementById('sidebar');
    if (resizeHandle && sidebar) {
        let isResizing = false;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            resizeHandle.classList.add('dragging');
            sidebar.style.transition = 'none';
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth >= 100 && newWidth <= 400) { // Increased max width slightly
                sidebar.style.width = newWidth + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizeHandle.classList.remove('dragging');
                sidebar.style.transition = '';
                document.body.style.cursor = '';
            }
        });
    }
}

/**
 * Initialize Google Drive state on load
 */
async function initGoogleDrive() {
    if (!els.googleSigninBtn) return;

    // Set up event listeners
    els.googleSigninBtn.addEventListener('click', handleGoogleSignIn);
    if (els.googleSignoutBtn) {
        els.googleSignoutBtn.addEventListener('click', handleGoogleSignOut);
    }

    try {
        const { driveConnected, userEmail } =
            await chrome.storage.local.get(['driveConnected', 'userEmail']);

        if (driveConnected && userEmail && els.driveSignedOut && els.driveSignedIn) {
            els.driveSignedOut.classList.add('hidden');
            els.driveSignedIn.classList.remove('hidden');
            if (els.userEmail) els.userEmail.textContent = userEmail;
        }
    } catch (err) {
        console.error('[GoogleDrive] Init error:', err);
    }
}

async function handleGoogleSignIn() {
    try {
        const token = await GoogleDriveService.authenticate();
        const userInfo = await GoogleDriveService.getUserInfo(token);

        if (els.userEmail) els.userEmail.textContent = userInfo.email;
        if (els.driveSignedOut) els.driveSignedOut.classList.add('hidden');
        if (els.driveSignedIn) els.driveSignedIn.classList.remove('hidden');

        // Set up 5-minute auto-backup alarm
        chrome.alarms.create('auto-backup', { periodInMinutes: 5 });

        await chrome.storage.local.set({
            driveConnected: true,
            userEmail: userInfo.email,
            autoSyncEnabled: true
        });

        console.log('[GoogleDrive] Signed in with 5-min auto-backup:', userInfo.email);
    } catch (err) {
        console.error('[GoogleDrive] Sign in failed:', err);
        alert('Sign in failed: ' + err.message);
    }
}

async function handleGoogleSignOut() {
    if (!confirm('Sign out of Google Drive?')) return;

    try {
        await GoogleDriveService.signOut();

        if (els.driveSignedOut) els.driveSignedOut.classList.remove('hidden');
        if (els.driveSignedIn) els.driveSignedIn.classList.add('hidden');

        // Clear auto-backup alarm
        chrome.alarms.clear('auto-backup');

        await chrome.storage.local.set({ driveConnected: false, userEmail: null, autoSyncEnabled: false });
        console.log('[GoogleDrive] Signed out');
    } catch (err) {
        console.error('[GoogleDrive] Sign out failed:', err);
        alert('Sign out failed: ' + err.message);
    }
}

/**
 * Backup prompts to Google Drive
 */
async function handleBackupToDrive() {
    try {
        const { driveConnected } = await chrome.storage.local.get(['driveConnected']);
        if (!driveConnected) {
            alert('Please sign in with Google first.');
            return;
        }

        const prompts = await StorageService.getPrompts();
        const projects = await StorageService.getProjects ? await StorageService.getProjects() : [];

        const result = await GoogleDriveService.backupToDrive(prompts, projects);

        await chrome.storage.local.set({ lastBackupTime: result.timestamp });

        alert(`✅ Backed up ${prompts.length} prompts to Google Drive!`);
        console.log('[GoogleDrive] Backup complete:', result);
    } catch (err) {
        console.error('[GoogleDrive] Backup failed:', err);
        alert('Backup failed: ' + err.message);
    }
}

/**
 * Restore prompts from Google Drive
 */
async function handleRestoreFromDrive() {
    try {
        const { driveConnected } = await chrome.storage.local.get(['driveConnected']);
        if (!driveConnected) {
            alert('Please sign in with Google first.');
            return;
        }

        if (!confirm('Merge prompts from Google Drive with local library?')) return;

        const data = await GoogleDriveService.restoreFromDrive();
        const importedCount = await StorageService.importPrompts(data);

        alert(`✅ Restored ${importedCount} prompts from Google Drive!`);
        await refreshUI();
        console.log('[GoogleDrive] Restore complete');
    } catch (err) {
        console.error('[GoogleDrive] Restore failed:', err);
        alert('Restore failed: ' + err.message);
    }
}

document.addEventListener('DOMContentLoaded', init);

/**
 * AI Logic
 */
async function checkAIAvailability() {
    if (!els.aiRow) return;

    try {
        const status = await AIService.getAvailability();
        // User requested: "only if built in AI API is Green and available"
        if (status === 'readily' || status === 'available') {
            els.aiRow.classList.remove('hidden');
            setupAIListeners();
        } else {
            els.aiRow.classList.add('hidden');
        }
    } catch (e) {
        console.warn('[Popup] AI check failed:', e);
        els.aiRow.classList.add('hidden');
    }
}

function setupAIListeners() {
    // Avoid double binding
    if (els.magicBtn.dataset.bound) return;

    // Magic Enhance
    els.magicBtn.addEventListener('click', () => handleAI('magic_enhance'));
    // Improve Clarity
    els.clarityBtn.addEventListener('click', () => handleAI('clarify'));

    els.magicBtn.dataset.bound = true;
}

async function handleAI(type) {
    const text = els.textArea.value.trim();
    if (!text) return alert("Please enter some text to optimize.");

    // Visual feedback
    const btn = type === 'magic_enhance' ? els.magicBtn : els.clarityBtn;
    const originalText = btn.textContent;
    const originalEditorText = els.textArea.value;
    const originalStatsText = els.localModelStats ? els.localModelStats.textContent : null;
    // Abort/cancel support (web-ai-demos pattern)
    if (btn.dataset.pkAiCancel === '1') {
        try { window.__pkAiAbortController?.abort(); } catch { /* ignore */ }
        return;
    }

    const abortController = new AbortController();
    window.__pkAiAbortController = abortController;

    btn.dataset.pkAiCancel = '1';
    btn.textContent = "Cancel";
    btn.disabled = false; // allow click again to cancel
    btn.classList.add('ai-busy');
    document.body.style.cursor = 'wait';

    try {
        // Download progress (monitor) – best-effort, only for API surfaces that support it.
        const monitor = (m) => {
            m.addEventListener('downloadprogress', (e) => {
                if (!els.aiProgress) return;
                const pct = (typeof e.loaded === 'number' && typeof e.total === 'number' && e.total > 0)
                    ? Math.round((e.loaded / e.total) * 100)
                    : undefined;
                els.aiProgress.textContent = pct !== undefined ? `⬇️ Downloading… ${pct}%` : '⬇️ Downloading…';
                els.aiProgress.classList.remove('hidden');
            });
        };

        const refined = await AIService.refinePrompt(text, type, {
            signal: abortController.signal,
            monitor,
            preferStreaming: true,
            // Streaming: update progressively but do NOT mark unsaved until completion
            onChunk: (partial) => {
                els.textArea.value = partial;
                const previewDiv = document.getElementById('markdown-preview');
                if (previewDiv && !previewDiv.classList.contains('hidden') && window.marked) {
                    previewDiv.innerHTML = window.marked.parse(partial);
                }
            },
            onStats: (stats) => {
                if (!els.localModelStats) return;
                if (!stats) {
                    els.localModelStats.textContent = 'Local Model Stats: —';
                    return;
                }
                const usage = typeof stats.inputUsage === 'number' ? stats.inputUsage : undefined;
                const quota = typeof stats.inputQuota === 'number' ? stats.inputQuota : undefined;
                if (usage !== undefined && quota !== undefined) {
                    els.localModelStats.textContent = `Local Model Stats: tokens ${usage}/${quota}`;
                } else if (usage !== undefined) {
                    els.localModelStats.textContent = `Local Model Stats: tokens ${usage}`;
                } else {
                    els.localModelStats.textContent = 'Local Model Stats: —';
                }
            }
        });
        if (refined) {
            setPromptText(refined);
            // Pulse effect to show change
            els.textArea.classList.add('unsaved-glow');
            els.textArea.classList.add('pulse-green');
            setTimeout(() => els.textArea.classList.remove('pulse-green'), 1000);
            updateStats();
        }
    } catch (e) {
        // On cancel, revert partial streamed content and exit quietly.
        if (e?.name === 'AbortError' || String(e?.message || '').toLowerCase().includes('aborted')) {
            els.textArea.value = originalEditorText;
            const previewDiv = document.getElementById('markdown-preview');
            if (previewDiv && !previewDiv.classList.contains('hidden') && window.marked) {
                previewDiv.innerHTML = window.marked.parse(originalEditorText);
            }
            // Restore stats if we had any
            if (els.localModelStats && originalStatsText) els.localModelStats.textContent = originalStatsText;
            return;
        }
        console.error("AI Refine Error:", e);
        alert("Optimization failed: " + e.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
        delete btn.dataset.pkAiCancel;
        btn.classList.remove('ai-busy');
        window.__pkAiAbortController = null;
        document.body.style.cursor = 'default';
        if (els.aiProgress) els.aiProgress.classList.add('hidden');
    }
}

function setPromptText(text) {
    els.textArea.value = text;

    // Sync Preview if visible
    const previewDiv = document.getElementById('markdown-preview');
    if (previewDiv && !previewDiv.classList.contains('hidden') && window.marked) {
        previewDiv.innerHTML = window.marked.parse(text);
    }
}