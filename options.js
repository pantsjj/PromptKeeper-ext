import StorageService from './services/StorageService.js';
import AIService from './services/AIService.js';
import GoogleDriveService from './services/GoogleDriveService.js';

console.log('Options Init: Script Loaded');

// ===========================================================================
// Custom Modal System (replaces native confirm/alert to prevent flickering)
// ===========================================================================

/**
 * Show a custom confirmation modal
 * @param {string} message - The message to display
 * @param {object} options - { title, confirmText, cancelText, isDanger, hideCancel }
 * @returns {Promise<boolean>} - true if confirmed, false if cancelled
 */
function pkConfirm(message, options = {}) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('pk-modal-overlay');
        const title = document.getElementById('pk-modal-title');
        const msg = document.getElementById('pk-modal-message');
        const confirmBtn = document.getElementById('pk-modal-confirm');
        const cancelBtn = document.getElementById('pk-modal-cancel');

        if (!overlay) {
            // Fallback to native if modal not found
            resolve(confirm(message));
            return;
        }

        title.textContent = options.title || 'Confirm';
        msg.textContent = message;
        confirmBtn.textContent = options.confirmText || 'OK';
        cancelBtn.textContent = options.cancelText || 'Cancel';
        cancelBtn.style.display = options.hideCancel ? 'none' : 'inline-block';

        // Reset button styling
        confirmBtn.className = 'pk-modal-btn pk-modal-btn-primary';
        if (options.isDanger) {
            confirmBtn.className = 'pk-modal-btn pk-modal-btn-danger';
        }

        overlay.classList.remove('hidden');

        // Handle clicks
        const handleConfirm = () => {
            overlay.classList.add('hidden');
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            overlay.classList.add('hidden');
            cleanup();
            resolve(false);
        };

        const handleOverlayClick = (e) => {
            if (e.target === overlay) {
                handleCancel();
            }
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            overlay.removeEventListener('click', handleOverlayClick);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        overlay.addEventListener('click', handleOverlayClick);
    });
}

/**
 * Show a custom alert modal (single OK button)
 * @param {string} message - The message to display
 * @param {string} title - Optional title
 * @returns {Promise<void>}
 */
async function pkAlert(message, title = 'Notice') {
    await pkConfirm(message, { title, confirmText: 'OK', hideCancel: true });
}

// State
let currentPromptId = null;
let currentProjectId = null; // null = 'all'
let searchFilter = '';
let currentSortOrder = 'newest'; // Default sort order

// Active AI Streams (promptId -> currentText)
// Prevents overwriting UI if user navigates away during stream
const activeStreams = new Map();

// Auto-save / editor state
let isEditorDirty = false;
let autoSaveEnabled = true;
let autoSaveIntervalMinutes = 5;
let autoSaveOnSwitch = false;
let autoSaveTimerId = null;

// DOM Elements - will be populated in init()
const els = {};

/**
 * Initialize
 */
async function init() {
    console.log('Options Init: Starting...');

    // Bind DOM elements after DOM is ready
    els.searchInput = document.getElementById('search-input');
    els.workspaceList = document.getElementById('workspace-list');
    els.workspaceSection = document.getElementById('workspace-section');
    els.workspaceChevron = document.getElementById('workspace-chevron');
    els.workspaceTitle = document.getElementById('workspace-section-title');
    els.moreProjectsContainer = document.getElementById('more-projects-container');
    els.moreProjectsList = document.getElementById('more-projects-list');
    els.expandProjectsBtn = document.getElementById('expand-projects-btn');
    els.addProjectBtn = document.getElementById('add-project-btn');
    els.workspaceAll = document.getElementById('workspace-all');
    els.promptList = document.getElementById('prompt-list');
    els.promptsSection = document.getElementById('prompts-section');
    els.promptsChevron = document.getElementById('prompts-chevron');
    els.promptsTitle = document.getElementById('prompts-section-title');
    els.newBtn = document.getElementById('new-prompt-btn');
    els.titleInput = document.getElementById('prompt-title-input');
    els.textArea = document.getElementById('prompt-text-area');
    els.saveBtn = document.getElementById('save-btn');
    els.deleteBtn = document.getElementById('delete-btn');
    els.versionSelect = document.getElementById('footer-version-selector');
    // Legacy right-sidebar stats (now hidden from UI but kept for compatibility)
    els.wordCount = document.getElementById('word-count');
    els.charCount = document.getElementById('char-count');
    els.versionLabel = document.getElementById('version-label');
    els.projectLabel = document.getElementById('project-label');
    els.aiStatus = document.getElementById('ai-status');
    els.refineBtns = document.querySelectorAll('.refine-btn');

    // Google Drive elements
    els.googleSigninBtn = document.getElementById('google-signin-btn');
    els.googleSignoutBtn = document.getElementById('google-signout-btn');
    els.backupBtn = document.getElementById('backup-btn');
    els.restoreBtn = document.getElementById('restore-btn');
    els.autoSyncCheckbox = document.getElementById('auto-sync-checkbox');
    els.confirmDeleteCheckbox = document.getElementById('confirm-deletion-checkbox');
    // Font size controls
    els.fontSizeDisplay = document.getElementById('font-size-display');
    els.fontSizeDecrease = document.getElementById('font-size-decrease');
    els.fontSizeIncrease = document.getElementById('font-size-increase');
    els.fontSizePreset = document.getElementById('font-size-preset');
    els.autoSaveEnabledCheckbox = document.getElementById('autosave-enabled-checkbox');
    els.autoSaveIntervalSelect = document.getElementById('autosave-interval-select');
    els.autoSaveOnSwitchCheckbox = document.getElementById('autosave-on-switch-checkbox');
    els.driveSignedOut = document.getElementById('drive-signed-out');
    els.driveSignedIn = document.getElementById('drive-signed-in');
    els.userEmail = document.getElementById('user-email');
    els.lastBackupTime = document.getElementById('last-backup-time');

    // Modal elements
    els.modalOverlay = document.getElementById('modal-overlay');
    els.modalTitle = document.getElementById('modal-title');
    els.modalInputName = document.getElementById('modal-input-name');
    els.modalInputDesc = document.getElementById('modal-input-desc');
    els.modalCancelBtn = document.getElementById('modal-cancel-btn');
    els.modalConfirmBtn = document.getElementById('modal-confirm-btn');

    // Footer status bar elements
    els.footerDocsLink = document.getElementById('footer-docs-link');
    els.footerWordCount = document.getElementById('footer-word-count');
    els.footerCharCount = document.getElementById('footer-char-count');
    els.footerVersionSelector = document.getElementById('footer-version-selector');
    els.footerStorageUsed = document.getElementById('footer-storage-used');
    els.footerExportLink = document.getElementById('footer-export-link');
    els.footerImportLink = document.getElementById('footer-import-link');
    els.footerImportFile = document.getElementById('footer-import-file');
    els.footerStatusDots = document.getElementById('footer-status-dots');

    // Markdown Preview
    els.previewDiv = document.getElementById('markdown-preview');
    els.togglePreviewBtn = document.getElementById('toggle-preview-btn');
    els.rightResizeHandle = document.getElementById('editor-right-resize-handle');
    els.localModelStats = document.getElementById('local-model-stats');

    // Sort Controls
    els.sortBtn = document.getElementById('sort-btn');
    els.sortDropdown = document.getElementById('sort-dropdown');

    // Prompt Coach Elements
    els.promptCoachContainer = document.getElementById('prompt-coach-container');
    els.promptCoachTags = document.getElementById('prompt-coach-tags');
    els.promptCoachWarning = document.getElementById('prompt-coach-warning');
    els.promptScore = document.getElementById('prompt-score');
    els.promptScoreLink = document.getElementById('prompt-score-link');

    // Theme Controls
    els.themeLightBtn = document.getElementById('theme-light');
    els.themeDarkBtn = document.getElementById('theme-dark');
    els.themeAutoBtn = document.getElementById('theme-auto');
    els.openShortcutsLink = document.getElementById('open-shortcuts-link');

    applyLanguageModelShims();
    setupEventListeners();

    await initGoogleDrive(); // Check Drive auth state

    // Load Settings
    chrome.storage.local.get(['confirmWorkspaceDeletion', 'editorFontSize', 'autoSaveEnabled', 'autoSaveIntervalMinutes', 'autoSaveOnSwitch', 'rightSidebarWidth', 'promptSortOrder', 'themePreference'], (result) => {
        const confirmDelete = result.confirmWorkspaceDeletion !== false; // Default true
        if (els.confirmDeleteCheckbox) els.confirmDeleteCheckbox.checked = confirmDelete;

        const size = typeof result.editorFontSize === 'number' ? result.editorFontSize : 14;
        applyEditorFontSize(size);
        autoSaveEnabled = result.autoSaveEnabled !== false; // default true
        autoSaveIntervalMinutes = typeof result.autoSaveIntervalMinutes === 'number' ? result.autoSaveIntervalMinutes : 5;
        autoSaveOnSwitch = result.autoSaveOnSwitch === true;

        // Load sort preference
        currentSortOrder = result.promptSortOrder || 'newest';
        updateSortDropdownUI();

        // Load theme preference
        const theme = result.themePreference || 'auto';
        applyTheme(theme);
        updateThemeButtons(theme);

        if (els.autoSaveEnabledCheckbox) els.autoSaveEnabledCheckbox.checked = autoSaveEnabled;
        if (els.autoSaveIntervalSelect) els.autoSaveIntervalSelect.value = String(autoSaveIntervalMinutes);
        if (els.autoSaveOnSwitchCheckbox) els.autoSaveOnSwitchCheckbox.checked = autoSaveOnSwitch;

        if (typeof result.rightSidebarWidth === 'number') {
            applyRightSidebarWidth(result.rightSidebarWidth);
        }

        scheduleAutoSave();
    });

    // Non-blocking AI Initialization
    // We wait for injection but let the UI load first
    waitForAIAPI().then(async () => {
        try {
            applyLanguageModelShims(); // Ensure shims are applied if late-injected
            await checkAIStatus();
            await updateFooterStatusDots();
            await initPromptCoach(); // Initialize Prompt Coach with AI availability detection
        } catch (err) { console.warn("AI Status Check failed:", err); }
    });

    try {
        await loadWorkspaces();
        await loadPrompts();
        updateLibraryStats();
    } catch (err) { console.error("Failed to load data:", err); }

    // Real-time updates
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes['prompts']) loadPrompts();
            if (changes['projects']) loadWorkspaces();
            if (changes['editorFontSize']) {
                const next = typeof changes.editorFontSize.newValue === 'number'
                    ? changes.editorFontSize.newValue
                    : 14;
                applyEditorFontSize(next);
            }
            if (changes['autoSaveEnabled']) {
                autoSaveEnabled = changes.autoSaveEnabled.newValue !== false;
                if (els.autoSaveEnabledCheckbox) els.autoSaveEnabledCheckbox.checked = autoSaveEnabled;
                scheduleAutoSave();
            }
            if (changes['autoSaveIntervalMinutes']) {
                const v = changes.autoSaveIntervalMinutes.newValue;
                if (typeof v === 'number') {
                    autoSaveIntervalMinutes = v;
                    if (els.autoSaveIntervalSelect) els.autoSaveIntervalSelect.value = String(v);
                    scheduleAutoSave();
                }
            }
            if (changes['autoSaveOnSwitch']) {
                autoSaveOnSwitch = changes.autoSaveOnSwitch.newValue === true;
                if (els.autoSaveOnSwitchCheckbox) els.autoSaveOnSwitchCheckbox.checked = autoSaveOnSwitch;
            }
            if (changes['rightSidebarWidth']) {
                const width = typeof changes.rightSidebarWidth.newValue === 'number'
                    ? changes.rightSidebarWidth.newValue
                    : undefined;
                if (width) applyRightSidebarWidth(width);
            }
        }
    });

    // Initial project label
    updateProjectLabel();
}

// Polling helper to wait for window.ai injection
async function waitForAIAPI(timeoutMs = 2000) {
    if (window.ai) return true;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (window.ai) return true;
        await new Promise(r => setTimeout(r, 20));
    }
    return false;
}

function applyLanguageModelShims() {
    // Local shim removed. We rely on language-model-shim.js loaded in <head>.
}

function applyEditorFontSize(size) {
    const clamped = Math.min(22, Math.max(11, size));
    document.documentElement.style.setProperty('--prompt-font-size', `${clamped}px`);
    if (els.fontSizeDisplay) {
        els.fontSizeDisplay.textContent = `${clamped}px`;
    }
    if (els.fontSizePreset) {
        const match = Array.from(els.fontSizePreset.options).find(o => parseInt(o.value, 10) === clamped);
        if (match) {
            els.fontSizePreset.value = String(clamped);
        }
    }
}

function applyRightSidebarWidth(width) {
    const clamped = Math.min(480, Math.max(220, width));
    document.documentElement.style.setProperty('--right-sidebar-width', `${clamped}px`);
}

/**
 * Apply theme to the document
 * @param {'light' | 'dark' | 'auto'} theme
 */
function applyTheme(theme) {
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark');

    if (theme === 'light') {
        html.classList.add('theme-light');
    } else if (theme === 'dark') {
        html.classList.add('theme-dark');
    }
    // 'auto' - no class, uses media query
}

/**
 * Update theme button active states
 * @param {'light' | 'dark' | 'auto'} theme
 */
function updateThemeButtons(theme) {
    [els.themeLightBtn, els.themeDarkBtn, els.themeAutoBtn].forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    if (theme === 'light' && els.themeLightBtn) {
        els.themeLightBtn.classList.add('active');
    } else if (theme === 'dark' && els.themeDarkBtn) {
        els.themeDarkBtn.classList.add('active');
    } else if (els.themeAutoBtn) {
        els.themeAutoBtn.classList.add('active');
    }
}

/**
 * Handle theme button click
 * @param {'light' | 'dark' | 'auto'} theme
 */
function setTheme(theme) {
    applyTheme(theme);
    updateThemeButtons(theme);
    chrome.storage.local.set({ themePreference: theme });
}

function markEditorDirty() {
    if (!els.textArea) return;
    isEditorDirty = true;
    els.textArea.classList.add('unsaved-glow');
}

function clearEditorDirty() {
    isEditorDirty = false;
    if (els.textArea) {
        els.textArea.classList.remove('unsaved-glow');
    }
}

function scheduleAutoSave() {
    if (autoSaveTimerId) {
        clearInterval(autoSaveTimerId);
        autoSaveTimerId = null;
    }
    if (!autoSaveEnabled || !autoSaveIntervalMinutes) return;

    autoSaveTimerId = setInterval(async () => {
        if (!isEditorDirty) return;
        await savePrompt();
        clearEditorDirty();
    }, autoSaveIntervalMinutes * 60 * 1000);
}

/**
 * Event Listeners
 */
function setupEventListeners() {
    // Search
    if (els.searchInput) {
        els.searchInput.addEventListener('input', (e) => {
            searchFilter = e.target.value.toLowerCase();
            loadPrompts();
        });
    }

    // Sort - Icon button with dropdown
    if (els.sortBtn && els.sortDropdown) {
        els.sortBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            els.sortDropdown.classList.toggle('hidden');
        });

        // Sort option click
        els.sortDropdown.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', (e) => {
                // Use currentTarget to ensure we get the element the listener is on
                const sortValue = e.currentTarget.dataset.value;
                if (!sortValue) {
                    console.warn('[Sort] No sort value found on clicked element');
                    return;
                }
                currentSortOrder = sortValue;
                chrome.storage.local.set({ promptSortOrder: currentSortOrder });
                updateSortDropdownUI();
                els.sortDropdown.classList.add('hidden');
                loadPrompts();
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!els.sortBtn.contains(e.target) && !els.sortDropdown.contains(e.target)) {
                els.sortDropdown.classList.add('hidden');
            }
        });
    }

    // Collapsible sections - Workspaces
    const toggleWorkspaceSection = () => {
        if (!els.workspaceSection || !els.workspaceChevron) return;
        const collapsed = els.workspaceSection.classList.toggle('collapsed');
        els.workspaceChevron.classList.toggle('collapsed', collapsed);
    };
    if (els.workspaceChevron) {
        els.workspaceChevron.addEventListener('click', toggleWorkspaceSection);
    }
    if (els.workspaceTitle) {
        els.workspaceTitle.addEventListener('click', toggleWorkspaceSection);
    }

    // Collapsible sections - Prompts
    const togglePromptsSection = () => {
        if (!els.promptsSection || !els.promptsChevron) return;
        const collapsed = els.promptsSection.classList.toggle('collapsed');
        els.promptsChevron.classList.toggle('collapsed', collapsed);
    };
    if (els.promptsChevron) {
        els.promptsChevron.addEventListener('click', togglePromptsSection);
    }
    if (els.promptsTitle) {
        els.promptsTitle.addEventListener('click', togglePromptsSection);
    }

    // Font size controls (editor + preview share --prompt-font-size)
    const changeFontSize = (delta) => {
        const currentCss = getComputedStyle(document.documentElement).getPropertyValue('--prompt-font-size') || '14px';
        const current = parseInt(currentCss, 10) || 14;
        const next = Math.min(22, Math.max(11, current + delta));
        applyEditorFontSize(next);
        chrome.storage.local.set({ editorFontSize: next });
    };

    if (els.fontSizeIncrease) {
        els.fontSizeIncrease.addEventListener('click', () => changeFontSize(1));
    }
    if (els.fontSizeDecrease) {
        els.fontSizeDecrease.addEventListener('click', () => changeFontSize(-1));
    }
    if (els.fontSizePreset) {
        els.fontSizePreset.addEventListener('change', (e) => {
            const value = parseInt(e.target.value, 10);
            if (!Number.isNaN(value)) {
                const next = Math.min(22, Math.max(11, value));
                applyEditorFontSize(next);
                chrome.storage.local.set({ editorFontSize: next });
            }
        });
    }

    // Auto-save controls
    if (els.autoSaveEnabledCheckbox) {
        els.autoSaveEnabledCheckbox.addEventListener('change', (e) => {
            autoSaveEnabled = e.target.checked;
            chrome.storage.local.set({ autoSaveEnabled });
            scheduleAutoSave();
        });
    }
    if (els.autoSaveIntervalSelect) {
        els.autoSaveIntervalSelect.addEventListener('change', (e) => {
            const value = parseInt(e.target.value, 10);
            if (!Number.isNaN(value)) {
                autoSaveIntervalMinutes = value;
                chrome.storage.local.set({ autoSaveIntervalMinutes: value });
                scheduleAutoSave();
            }
        });
    }
    if (els.autoSaveOnSwitchCheckbox) {
        els.autoSaveOnSwitchCheckbox.addEventListener('change', (e) => {
            autoSaveOnSwitch = e.target.checked;
            chrome.storage.local.set({ autoSaveOnSwitch });
        });
    }

    // Right sidebar resize
    if (els.rightResizeHandle) {
        let isDragging = false;

        const onMouseMove = (event) => {
            if (!isDragging) return;
            const rect = document.getElementById('main-layout')?.getBoundingClientRect();
            if (!rect) return;
            const totalWidth = rect.width;
            const offsetX = event.clientX - rect.left;
            const rightWidth = totalWidth - offsetX;
            applyRightSidebarWidth(rightWidth);
            chrome.storage.local.set({ rightSidebarWidth: rightWidth });
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        els.rightResizeHandle.addEventListener('mousedown', (event) => {
            event.preventDefault();
            isDragging = true;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // Workspaces
    if (els.addProjectBtn) els.addProjectBtn.addEventListener('click', handleAddProject);
    if (els.workspaceAll) {
        els.workspaceAll.addEventListener('click', () => switchProject(null));
        setupDropTarget(els.workspaceAll, null); // Allow dropping on "All" to remove from project
    }

    if (els.expandProjectsBtn) {
        els.expandProjectsBtn.addEventListener('click', () => {
            els.moreProjectsContainer.classList.toggle('hidden');
            els.expandProjectsBtn.textContent = els.moreProjectsContainer.classList.contains('hidden')
                ? 'Show more...'
                : 'Show less';
        });
    }

    // Editor
    els.newBtn.addEventListener('click', createNewPrompt);
    els.saveBtn.addEventListener('click', savePrompt);
    els.deleteBtn.addEventListener('click', deletePrompt);
    els.textArea.addEventListener('input', () => {
        updateStats();
        updateFooterStats();
        markEditorDirty();
    });

    // Formatting Shortcuts (Cmd+B, Cmd+I)
    els.textArea.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey) {
            const start = els.textArea.selectionStart;
            const end = els.textArea.selectionEnd;
            const text = els.textArea.value;
            let inserted = false;

            if (e.key === 'b') { // Bold
                e.preventDefault();
                const selection = text.substring(start, end);
                const replacement = `**${selection}**`;
                els.textArea.setRangeText(replacement, start, end, 'select');
                inserted = true;
            } else if (e.key === 'i') { // Italic
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
        }
    });

    // Markdown Preview Logic
    const togglePreviewBtn = document.getElementById('toggle-preview-btn');
    const previewDiv = document.getElementById('markdown-preview');

    // Helper: Show Editor
    function showEditor() {
        if (!previewDiv || !els.textArea) return;
        previewDiv.classList.add('hidden');
        els.textArea.classList.remove('hidden');
        if (togglePreviewBtn) {
            togglePreviewBtn.innerHTML = "👀"; // Icon to go to preview
            togglePreviewBtn.title = "View Preview";
            togglePreviewBtn.classList.remove('active');
        }
        els.textArea.focus();
    }

    // Helper: Show Preview
    function showPreview(content) {
        if (!previewDiv || !els.textArea) return;
        const text = content !== undefined ? content : els.textArea.value;

        // Reset first to avoid stale
        previewDiv.innerHTML = '';

        // Show container
        els.textArea.classList.add('hidden');
        previewDiv.classList.remove('hidden');

        if (window.marked) {
            try {
                previewDiv.innerHTML = window.marked.parse(text);
            } catch (err) {
                console.error('Markdown parse error:', err);
                previewDiv.textContent = text; // Fallback
            }
        } else {
            previewDiv.style.whiteSpace = 'pre-wrap';
            previewDiv.textContent = text;
        }

        if (togglePreviewBtn) {
            togglePreviewBtn.innerHTML = "👨‍💻"; // Icon to go to code/edit
            togglePreviewBtn.title = "Edit Raw Markdown";
            togglePreviewBtn.classList.add('active');
        }
    }

    if (previewDiv) {
        // Enable Click-to-Edit
        previewDiv.addEventListener('click', () => {
            // Only switch if currently visible
            if (!previewDiv.classList.contains('hidden')) {
                showEditor();
            }
        });
        // Improve cursor to indicate interactivity
        previewDiv.style.cursor = 'text';
    }

    if (togglePreviewBtn) {
        togglePreviewBtn.addEventListener('click', () => {
            const isEditing = !els.textArea.classList.contains('hidden');
            if (isEditing) {
                showPreview();
            } else {
                showEditor();
            }
        });
    }

    // Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            savePrompt();
        }
    });

    // Footer Export/Import
    if (els.footerExportLink) {
        els.footerExportLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const prompts = await StorageService.getPrompts();
            const projects = await StorageService.getProjects();
            const backup = {
                version: '2.0.0',
                timestamp: new Date().toISOString(),
                prompts,
                projects
            };
            const dataStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `promptkeeper_export_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    if (els.footerImportLink) {
        els.footerImportLink.addEventListener('click', (e) => {
            e.preventDefault();
            els.footerImportFile.click();
        });
    }
    if (els.footerImportFile) {
        els.footerImportFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    const imported = await StorageService.importPrompts(data);
                    await pkAlert(`Imported ${imported} prompts!`, 'Import Complete');
                    await loadPrompts();
                    updateLibraryStats();
                } catch (err) {
                    await pkAlert('Import failed: ' + err.message, 'Import Error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // Restore AI Panel State (or Auto-Enable)
    chrome.storage.local.get(['aiPanelVisible'], async (result) => {
        const aiPanel = document.getElementById('ai-tools-panel');
        if (!aiPanel) return;

        let shouldShow = result.aiPanelVisible;

        // Auto-Enable if undefined (first run) and AI is ready
        if (typeof shouldShow === 'undefined') {
            try {
                const status = await AIService.getAvailability();
                if (status === 'readily' || status === 'available' || status === 'after-download') {
                    console.log('[Auto-Toggle] AI Available, enabling panel by default.');
                    shouldShow = true;
                    chrome.storage.local.set({ aiPanelVisible: true });
                }
            } catch (e) {
                console.warn('[Auto-Toggle] Failed to check status:', e);
            }
        }

        if (shouldShow) {
            aiPanel.classList.remove('hidden');
        } else {
            aiPanel.classList.add('hidden');
        }
    });

    // Right-click context menu for prompts
    els.promptList.addEventListener('contextmenu', handlePromptContextMenu);
    // Workspace context menu is handled in renderProjectItem


    //Google Drive
    if (els.googleSigninBtn) {
        els.googleSigninBtn.addEventListener('click', handleGoogleSignIn);
    }
    if (els.googleSignoutBtn) {
        els.googleSignoutBtn.addEventListener('click', handleGoogleSignOut);
    }
    if (els.backupBtn) {
        els.backupBtn.addEventListener('click', handleBackup);
    }
    if (els.restoreBtn) {
        els.restoreBtn.addEventListener('click', handleRestore);
    }
    if (els.autoSyncCheckbox) {
        els.autoSyncCheckbox.addEventListener('change', handleAutoSyncToggle);
    }
    if (els.confirmDeleteCheckbox) {
        els.confirmDeleteCheckbox.addEventListener('change', (e) => {
            chrome.storage.local.set({ confirmWorkspaceDeletion: e.target.checked });
        });
    }

    // AI Refinement
    if (els.refineBtns) {
        els.refineBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const type = btn.dataset.type;
                await handleRefine(type, btn);
            });
        });
    }

    // Context Menu
    initContextMenu();

    // Footer Docs Link
    if (els.footerDocsLink) {
        els.footerDocsLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'how_to.html' });
        });
    }

    // Theme Controls
    if (els.themeLightBtn) {
        els.themeLightBtn.addEventListener('click', () => setTheme('light'));
    }
    if (els.themeDarkBtn) {
        els.themeDarkBtn.addEventListener('click', () => setTheme('dark'));
    }
    if (els.themeAutoBtn) {
        els.themeAutoBtn.addEventListener('click', () => setTheme('auto'));
    }

    // Keyboard Shortcut Settings Link
    if (els.openShortcutsLink) {
        els.openShortcutsLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
        });
    }
}

/**
 * Workspaces / Projects
 */
async function loadWorkspaces() {
    const projects = await StorageService.getProjects();

    // Clear dynamic lists (keep static 'All')
    //Actually, workspaceList contains 'All' hardcoded. We should only clean/re-render the dynamic parts or append.
    // simpler: clear everything after the first child (All)
    while (els.workspaceList.children.length > 1) {
        els.workspaceList.removeChild(els.workspaceList.lastChild);
    }
    els.moreProjectsList.innerHTML = '';

    // Sort projects? most recent? alphabetical?
    // Let's just use ID order for now, or alphabetical
    projects.sort((a, b) => a.name.localeCompare(b.name));

    // Top 3
    const topProjects = projects.slice(0, 3);
    const otherProjects = projects.slice(3);

    topProjects.forEach(p => renderProjectItem(p, els.workspaceList));

    if (otherProjects.length > 0) {
        otherProjects.forEach(p => renderProjectItem(p, els.moreProjectsList));
        els.expandProjectsBtn.classList.remove('hidden');
    } else {
        els.expandProjectsBtn.classList.add('hidden');
        els.moreProjectsContainer.classList.add('hidden');
    }

    updateActiveWorkspaceUI();
}

function renderProjectItem(project, container) {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.dataset.id = project.id;
    li.dataset.projectId = project.id; // For context menu and debugging
    li.innerHTML = `<span class="item-title">${project.name}</span>`;

    li.addEventListener('click', (e) => {
        // Prevent if clicking drag handle or something else explicitly
        if (e.target.closest('.drag-handle')) return;
        switchProject(project.id);
    });

    // Context Menu
    li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        switchProject(project.id);
        const menu = document.getElementById('context-menu');
        if (menu) {
            menu.style.top = `${e.pageY}px`;
            menu.style.left = `${e.pageX}px`;
            menu.dataset.targetId = project.id;
            menu.dataset.targetName = project.name;
            menu.classList.remove('hidden');
        }
    });

    setupDropTarget(li, project.id);

    container.appendChild(li);
}

function switchProject(projectId) {
    currentProjectId = projectId;
    updateActiveWorkspaceUI();
    updateProjectLabel();
    loadPrompts();
}

function updateActiveWorkspaceUI() {
    // Remove active class from all
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (currentProjectId === null) {
        els.workspaceAll.classList.add('active');
    } else {
        const item = document.querySelector(`.nav-item[data-id="${currentProjectId}"]`);
        if (item) item.classList.add('active');
    }
}

function updateProjectLabel() {
    if (!els.projectLabel) return;
    if (currentProjectId === null) {
        els.projectLabel.textContent = "Workspace: All Prompts";
    } else {
        // We need to fetch name, but optimally we have it. 
        // Sync fetch is fine if we loaded projects, but safe to just query DOM or storage
        StorageService.getProjects().then(projects => {
            const p = projects.find(x => x.id === currentProjectId);
            els.projectLabel.textContent = p ? `Workspace: ${p.name}` : "Workspace: Unknown";
        });
    }
}

// --- Project Management ---

/**
 * Handles adding a new project via inline input
 */
async function handleAddProject() {
    // 1. Check if input already exists
    if (document.getElementById('new-project-input')) {
        document.getElementById('new-project-input').focus();
        return;
    }

    // 2. Create LI with Input
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.style.padding = '0';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'new-project-input';
    input.placeholder = 'project_name';
    input.style.width = '100%';
    input.style.border = 'none';
    input.style.padding = '8px 10px';
    input.style.background = 'transparent';
    input.style.outline = 'none';
    input.style.fontSize = '13px';
    input.style.fontFamily = 'inherit';

    li.appendChild(input);

    // 3. Insert after 'All Prompts' or top of list
    if (els.workspaceList.children.length > 0) {
        els.workspaceList.insertBefore(li, els.workspaceList.children[1]);
    } else {
        els.workspaceList.appendChild(li);
    }

    input.focus();

    let isCommittingOrCancelling = false;

    // 4. Handle Commit / Cancel
    const commit = async () => {
        if (isCommittingOrCancelling) return;
        isCommittingOrCancelling = true;

        const rawName = input.value.trim();
        if (!rawName) {
            li.remove();
            return;
        }

        // Validation: snake_case, max 3 words
        const safeName = rawName.replace(/\s+/g, '_').toLowerCase();
        const wordCount = safeName.split('_').filter(w => w.length > 0).length;

        if (wordCount > 3) {
            await pkAlert('Max 3 words allowed (e.g. my_project_name)', 'Validation Error');
            input.focus();
            isCommittingOrCancelling = false; // Reset if invalid
            return;
        }

        if (safeName.length > 64) {
            await pkAlert('Max 64 characters exceeded', 'Validation Error');
            input.focus();
            isCommittingOrCancelling = false;
            return;
        }

        try {
            const project = await StorageService.addProject(safeName);
            li.remove();
            await loadWorkspaces();
            switchProject(project.id);
        } catch (err) {
            console.error('Failed to create project:', err);
            await pkAlert('Failed to create workspace', 'Error');
            li.remove();
        }
    };

    const cancel = () => {
        if (isCommittingOrCancelling) return;
        isCommittingOrCancelling = true;
        li.remove();
    };

    // Events
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
            // commit called by blur
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
        }
    });

    input.addEventListener('blur', () => {
        // Delay slightly to check if cancel happened
        setTimeout(() => {
            if (!isCommittingOrCancelling) {
                if (input.value.trim()) commit();
                else cancel();
            }
        }, 50);
    });
}

/**
 * Update sort dropdown UI to show active selection
 */
function updateSortDropdownUI() {
    if (!els.sortDropdown) return;
    els.sortDropdown.querySelectorAll('.sort-option').forEach(option => {
        if (option.dataset.value === currentSortOrder) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

/**
 * Sort prompts based on current sort order
 * @param {Array} prompts - Array of prompt objects
 * @returns {Array} - Sorted array
 */
function sortPrompts(prompts) {
    const sorted = [...prompts];

    switch (currentSortOrder) {
        case 'name-asc':
            sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
        case 'name-desc':
            sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
            break;
        case 'oldest':
            sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            break;
        case 'modified':
            sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            break;
        case 'newest':
        default:
            sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            break;
    }

    return sorted;
}

/**
 * Prompts
 */
async function loadPrompts() {
    const prompts = await StorageService.getPrompts();

    // 1. Filter by Workspace
    let filtered = currentProjectId
        ? prompts.filter(p => p.projectId === currentProjectId)
        : prompts;

    // 2. Filter by Search
    if (searchFilter) {
        const term = searchFilter;
        filtered = filtered.filter(p => {
            const titleMatch = p.title.toLowerCase().includes(term);
            const currentVer = p.versions.find(v => v.id === p.currentVersionId);
            const contentMatch = currentVer && currentVer.content.toLowerCase().includes(term);
            return titleMatch || contentMatch;
        });
    }

    // 3. Apply Sorting
    filtered = sortPrompts(filtered);

    renderPromptList(filtered);

    // Auto-select logic
    if (!currentPromptId || !filtered.find(p => p.id === currentPromptId)) {
        if (filtered.length > 0) {
            selectPrompt(filtered[0]);
        } else {
            createNewPrompt(); // Clears editor
        }
    } else {
        // If current prompt is still in list, re-highlight it
        const item = document.querySelector(`.nav-item-prompt[data-id="${currentPromptId}"]`);
        if (item) item.classList.add('active');
    }
}

function renderPromptList(prompts) {
    els.promptList.innerHTML = '';

    prompts.forEach(prompt => {
        const li = document.createElement('li');
        li.className = 'nav-item nav-item-prompt';
        li.dataset.id = prompt.id;
        li.draggable = true; // Enable Drag
        if (currentPromptId === prompt.id) li.classList.add('active');

        let dateStr = '';
        try {
            dateStr = new Date(prompt.updatedAt).toLocaleDateString();
        } catch {
            // Ignore date parsing errors
        }

        li.innerHTML = `
            <span class="item-title">${prompt.title || 'Untitled'}</span>
            <span class="item-subtitle">${dateStr}</span>
        `;

        li.addEventListener('click', () => selectPrompt(prompt));
        setupDragSource(li, prompt.id);

        els.promptList.appendChild(li);
    });
}

// Helper: Show Editor (Global)
// eslint-disable-next-line no-unused-vars
function showEditor() {
    if (!els.previewDiv || !els.textArea) return;
    els.previewDiv.classList.add('hidden');
    els.textArea.classList.remove('hidden');
    if (els.togglePreviewBtn) {
        els.togglePreviewBtn.innerHTML = "👀";
        els.togglePreviewBtn.title = "View Preview";
        els.togglePreviewBtn.classList.remove('active');
    }
    els.textArea.focus();
}

// Helper: Show Preview (Global)
function showPreview(content) {
    if (!els.previewDiv || !els.textArea) return;
    const text = content !== undefined ? content : els.textArea.value;

    els.previewDiv.innerHTML = '';

    els.textArea.classList.add('hidden');
    els.previewDiv.classList.remove('hidden');

    if (window.marked) {
        try {
            els.previewDiv.innerHTML = window.marked.parse(text);
        } catch (err) {
            console.error('Markdown parse error:', err);
            els.previewDiv.textContent = text;
        }
    } else {
        els.previewDiv.style.whiteSpace = 'pre-wrap';
        els.previewDiv.textContent = text;
    }

    if (els.togglePreviewBtn) {
        els.togglePreviewBtn.innerHTML = "👨‍💻";
        els.togglePreviewBtn.title = "Edit Raw Markdown";
        els.togglePreviewBtn.classList.add('active');
    }
}

function selectPrompt(prompt) {
    // Optional auto-save on switch
    if (autoSaveOnSwitch && isEditorDirty) {
        // Fire and forget; savePrompt already handles races
        savePrompt();
        clearEditorDirty();
    }
    currentPromptId = prompt.id;
    els.titleInput.value = prompt.title;

    const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId);
    let contentToShow = currentVersion ? currentVersion.content : '';

    // ID-Alive Concurrency: If this prompt is currently streaming, show the latest stream content
    if (activeStreams.has(prompt.id)) {
        contentToShow = activeStreams.get(prompt.id);
        // Optional: you could add a visual indicator here that it's "Live"
    }
    els.textArea.value = contentToShow;

    updateStats();
    updateFooterStats();
    renderHistoryDropdown(prompt);

    // Highlight
    document.querySelectorAll('.nav-item-prompt').forEach(el => el.classList.remove('active'));
    const item = document.querySelector(`.nav-item-prompt[data-id="${prompt.id}"]`);
    if (item) item.classList.add('active');

    // Default to Preview
    if (typeof showPreview === 'function') {
        showPreview(els.textArea.value);
    } else {
        // Fallback if unavailable
        els.textArea.classList.remove('hidden');
    }

    // Trigger Prompt Coach re-evaluation on prompt selection
    if (typeof analyzePromptQuality === 'function' && els.textArea.value) {
        analyzePromptQuality(els.textArea.value);
    }
}

/**
 * Editor & Logic
 */
async function savePrompt() {
    let title = els.titleInput.value.trim();
    const text = els.textArea.value.trim();

    if (!text) {
        await pkAlert('Prompt text cannot be empty', 'Validation Error');
        return;
    }
    if (!title) title = 'Untitled Prompt';

    try {
        if (currentPromptId) {
            await StorageService.updatePrompt(currentPromptId, text);
            await StorageService.renamePrompt(currentPromptId, title);
        } else {
            const newPrompt = await StorageService.addPrompt(text);
            if (currentProjectId) {
                await StorageService.setPromptProject(newPrompt.id, currentProjectId);
            }
            if (title !== 'Untitled Prompt') {
                await StorageService.renamePrompt(newPrompt.id, title);
            }
            currentPromptId = newPrompt.id;
        }

        clearEditorDirty();

        // Pulse
        els.textArea.classList.add('pulse-green');
        setTimeout(() => els.textArea.classList.remove('pulse-green'), 1000); // Assumes css class exists or just ignore

        await loadPrompts();
        updateLibraryStats();

        // Refresh current prompt details & history dropdown immediately
        if (currentPromptId) {
            const prompts = await StorageService.getPrompts();
            const updated = prompts.find(p => p.id === currentPromptId);
            if (updated) {
                selectPrompt(updated);
            }
        }

    } catch (err) {
        console.warn('Save operation failed (likely race condition):', err);
        // User requested to suppress this popup: alert('Failed to save.');
    }
}

function createNewPrompt() {
    currentPromptId = null;
    els.titleInput.value = '';
    els.textArea.value = '';
    // Default to Editor Mode depending on previous logic, but let's enforce it here
    const previewDiv = document.getElementById('markdown-preview');
    const togglePreviewBtn = document.getElementById('toggle-preview-btn');
    if (previewDiv && togglePreviewBtn) {
        previewDiv.classList.add('hidden');
        els.textArea.classList.remove('hidden');
        togglePreviewBtn.innerHTML = "👀";
        togglePreviewBtn.classList.remove('active');
    }
    updateStats();
    updateFooterStats();
}

async function deletePrompt() {
    if (!currentPromptId) return;
    const confirmed = await pkConfirm('Delete this prompt permanently?', { title: 'Delete Prompt', confirmText: 'Delete', isDanger: true });
    if (confirmed) {
        await StorageService.deletePrompt(currentPromptId);
        currentPromptId = null;
        loadPrompts();
        updateLibraryStats();
    }
}

// Stats & Dropdown
function updateStats() {
    const text = els.textArea?.value || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    if (els.wordCount) els.wordCount.textContent = `Words: ${words}`;
    if (els.charCount) els.charCount.textContent = `Chars: ${text.length}`;

    // Sync footer stats
    updateFooterStats();

    if (els.versionLabel) {
        if (currentPromptId) {
            StorageService.getPrompts().then(prompts => {
                const p = prompts.find(x => x.id === currentPromptId);
                if (p) {
                    els.versionLabel.textContent = `Rev: ${p.versions.length}`;
                }
            });
        } else {
            els.versionLabel.textContent = 'Rev: 0';
        }
    }
}

function initContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    const deleteOption = document.getElementById('ctx-delete-workspace');

    document.addEventListener('click', () => {
        if (contextMenu) contextMenu.classList.add('hidden');
    });

    if (deleteOption) {
        deleteOption.addEventListener('click', async (e) => {
            e.stopPropagation();
            const projectId = contextMenu.dataset.targetId;
            const projectName = contextMenu.dataset.targetName;

            if (projectId && projectName) {
                let confirmed = true;
                if (els.confirmDeleteCheckbox && els.confirmDeleteCheckbox.checked) {
                    confirmed = await pkConfirm(
                        `Delete workspace '${projectName}'?\n\nPrompts will NOT be deleted. They will be tagged '${projectName}' and moved to "All Prompts".`,
                        { title: 'Delete Workspace', confirmText: 'Delete', isDanger: true }
                    );
                }

                if (confirmed) {
                    try {
                        await StorageService.deleteProject(projectId);
                        currentProjectId = null; // Reset
                        await loadWorkspaces(); // Reload list
                        switchProject(null); // Go to all
                    } catch (err) {
                        console.error('Failed to delete', err);
                    }
                }
            }
            contextMenu.classList.add('hidden');
        });
    }
}

function renderHistoryDropdown(prompt) {
    if (!els.versionSelect) return;
    els.versionSelect.innerHTML = '';

    // Add placeholder if no prompt
    if (!prompt || !prompt.versions || prompt.versions.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'v1: 06/12/2025 (Current)';
        els.versionSelect.appendChild(option);
        return;
    }

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
        els.versionSelect.appendChild(option);
    });

    els.versionSelect.onchange = () => {
        const v = prompt.versions.find(x => x.id === els.versionSelect.value);
        if (v) {
            els.textArea.value = v.content;
            updateStats();
            updateFooterStats();
            // If preview is visible, re-render it so markdown matches selected revision
            const previewDiv = document.getElementById('markdown-preview');
            if (previewDiv && !previewDiv.classList.contains('hidden')) {
                if (window.marked) {
                    try {
                        previewDiv.innerHTML = window.marked.parse(v.content);
                    } catch {
                        previewDiv.textContent = v.content;
                    }
                } else {
                    previewDiv.textContent = v.content;
                }
            }
            // Selecting an older revision is a change that is not yet saved
            markEditorDirty();
            // Update Prompt Coach score for the selected revision
            debouncePromptAnalysis();
        }
    }
}

/**
 * Drag and Drop Logic
 */
function setupDragSource(el, promptId) {
    el.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', promptId);
        el.style.opacity = '0.5';
    });

    el.addEventListener('dragend', () => {
        el.style.opacity = '1';
        // Cleanup drag classes
        document.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
    });
}

function setupDropTarget(el, targetProjectId) {
    el.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
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
            console.log(`Dropping prompt ${promptId} onto project ${targetProjectId}`);
            await StorageService.setPromptProject(promptId, targetProjectId);
            // Refresh
            loadPrompts();
            // Optional: visual feedback
        }
    });
}


/**
 * AI
 */
async function handleRefine(type, sourceBtn) {
    const text = els.textArea.value.trim();
    if (!text) return pkAlert("Enter text.", "Required");

    const btn = sourceBtn || els.saveBtn;
    const originalLabel = btn ? btn.textContent : '';
    // Removed duplicate declarations here

    // Abort/cancel support (web-ai-demos pattern)
    // If the same button is clicked while an AI request is active, treat it as "Cancel".
    if (btn && btn.dataset.pkAiCancel === '1') {
        try { window.__pkAiAbortController?.abort(); } catch { /* ignore */ }
        return;
    }

    const abortController = new AbortController();
    window.__pkAiAbortController = abortController; // Assign the controller to the global variable
    const targetPromptId = currentPromptId; // Lock target ID
    let originalEditorText = els.textArea.value;
    let originalStatsText = els.localModelStats ? els.localModelStats.textContent : '';

    try {
        if (btn) {
            btn.dataset.pkAiCancel = "true";
            btn.textContent = "Stop";
            btn.classList.add('ai-busy');
            document.body.style.cursor = 'wait';
        }

        let inputCtx = text;
        if (currentProjectId) {
            const projects = await StorageService.getProjects();
            const p = projects.find(x => x.id === currentProjectId);
            if (p && p.systemPrompt) {
                inputCtx = `[Context: ${p.systemPrompt}] \n\n ${text}`;
            }
        }

        // Optional: surface download progress (monitor) to the AI status line
        const monitor = (m) => {
            m.addEventListener('downloadprogress', (e) => {
                if (!els.aiStatus) return;
                const pct = (typeof e.loaded === 'number' && typeof e.total === 'number' && e.total > 0)
                    ? Math.round((e.loaded / e.total) * 100)
                    : undefined;
                els.aiStatus.textContent = pct !== undefined ? `⬇️ Downloading model… ${pct}%` : '⬇️ Downloading model…';
                els.aiStatus.style.color = "var(--primary-color)";
            });
        };

        // Initialize active stream for this prompt
        activeStreams.set(targetPromptId, originalEditorText);

        const refined = await AIService.refinePrompt(inputCtx, type, {
            signal: abortController.signal,
            monitor,
            preferStreaming: true,
            promptId: targetPromptId,
            // Streaming: update editor progressively but do NOT mark unsaved until completion
            onChunk: (partial, chunkPromptId) => {
                // Update the background map first
                activeStreams.set(chunkPromptId, partial);

                // Update UI ONLY if we are still viewing this prompt
                if (chunkPromptId === currentPromptId) {
                    els.textArea.value = partial;
                    const previewDiv = document.getElementById('markdown-preview');
                    if (previewDiv && !previewDiv.classList.contains('hidden') && window.marked) {
                        previewDiv.innerHTML = window.marked.parse(partial);
                    }
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
            // Final update handling
            const completionPromptId = targetPromptId;

            // If we are still on that prompt, update UI final state
            if (completionPromptId === currentPromptId) {
                setPromptText(refined);
            } else {
                // We navigated away; the background map has the data. 
                // We MUST update the persistent storage now so 'loadPrompts' sees it next time?
                // OR we just rely on standard save? 
                // setPromptText handles saving. Since we are away, we must manually save the data model.
                // Assuming StorageService.updatePrompt works by ID:
                await StorageService.updatePrompt(completionPromptId, refined);
            }
        }
    } catch (e) {
        // On cancel, revert partial streamed content and exit quietly.
        if (e?.name === 'AbortError' || String(e?.message || '').toLowerCase().includes('aborted')) {
            // Restore ONLY if we are currently looking at it
            if (targetPromptId === currentPromptId) {
                els.textArea.value = originalEditorText;
                const previewDiv = document.getElementById('markdown-preview');
                if (previewDiv && !previewDiv.classList.contains('hidden') && window.marked) {
                    previewDiv.innerHTML = window.marked.parse(originalEditorText);
                }
                if (els.localModelStats && originalStatsText) els.localModelStats.textContent = originalStatsText;
            }
            return;
        }
        pkAlert("Refine failed: " + e.message, "AI Error");
    } finally {
        // Cleanup stream map
        activeStreams.delete(targetPromptId);

        if (btn) {
            delete btn.dataset.pkAiCancel;
            btn.textContent = originalLabel || "Save";
            btn.disabled = false;
            btn.classList.remove('ai-busy');
        }
        window.__pkAiAbortController = null;
        document.body.style.cursor = 'default';
        if (targetPromptId === currentPromptId) updateStats();
    }
}

function setPromptText(text) {
    els.textArea.value = text;

    // Sync Preview if visible
    const previewDiv = document.getElementById('markdown-preview');
    if (previewDiv && !previewDiv.classList.contains('hidden') && window.marked) {
        previewDiv.innerHTML = window.marked.parse(text);
    }

    // AI-generated or programmatic changes should mark the editor as dirty
    markEditorDirty();
}


async function checkAIStatus() {
    if (!els.aiStatus) return;

    try {
        const status = await AIService.getAvailability();

        if (status === 'readily' || status === 'available') {
            els.aiStatus.textContent = "✅ GEMINI ENABLED";
            els.aiStatus.style.color = "var(--primary-color)";
            els.refineBtns.forEach(b => b.disabled = false);
        } else if (status === 'after-download' || status === 'downloading') {
            els.aiStatus.textContent = "⬇️ Downloading Model...";
            els.aiStatus.style.color = "var(--primary-color)";
            els.refineBtns.forEach(b => b.disabled = true);
        } else {
            // ...
            const diag = await AIService.getDiagnostic();
            const helpUrl = chrome.runtime.getURL('gemini-help.html');
            const diagUrl = chrome.runtime.getURL('gemini-diagnostic.html');

            els.aiStatus.innerHTML = `
                <span style="font-weight:600;">⚠️ AI Not Available</span>
                <div>[${diag}]</div>
                <a href="${helpUrl}" target="_blank">Help</a> | <a href="${diagUrl}" target="_blank">Test</a>
            `;
            els.aiStatus.style.color = "#b06000";
            els.refineBtns.forEach(b => b.disabled = true);
        }
    } catch (err) {
        console.error("AI Check Error:", err);
    }
}

/**
 * Update Library Stats in sidebar
 */
async function updateLibraryStats() {
    try {
        const prompts = await StorageService.getPrompts();
        const projects = await StorageService.getProjects();

        document.getElementById('total-prompts-stat').textContent = prompts.length;
        document.getElementById('total-workspaces-stat').textContent = projects.length;

        chrome.storage.local.getBytesInUse(null, (bytes) => {
            const kb = (bytes / 1024).toFixed(2);
            document.getElementById('storage-used-stat').textContent = `${kb} KB`;
        });
    } catch (err) {
        console.error('Failed to update stats:', err);
    }
}

// ===========================================================================
// Context Menu Handlers
// ===========================================================================

function handlePromptContextMenu(e) {
    const promptItem = e.target.closest('.nav-item[data-prompt-id]');
    if (!promptItem) return;

    e.preventDefault();
    const promptId = promptItem.dataset.promptId;

    pkConfirm('Delete this prompt?', { title: 'Delete Prompt', confirmText: 'Delete' }).then(confirmed => {
        if (confirmed) deletePrompt(promptId);
    });
}



// Update footer stats
function updateFooterStats() {
    if (!els.textArea || !els.footerWordCount || !els.footerStorageUsed) return;

    const text = els.textArea.value || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;

    els.footerWordCount.textContent = `Words: ${words}`;
    if (els.footerCharCount) {
        els.footerCharCount.textContent = `Chars: ${chars}`;
    }

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        const kb = (bytes / 1024).toFixed(1);
        els.footerStorageUsed.textContent = `Size: ${kb} KB`;
    });
}

// Update footer status dots with AI availability
async function updateFooterStatusDots() {
    if (!els.footerStatusDots) return;

    els.footerStatusDots.innerHTML = '';

    const normalizeStatusClass = (s) => {
        if (!s) return 'no';
        if (s === 'available' || s === 'readily') return 'readily';
        if (s === 'after-download' || s === 'downloading') return 'after-download';
        return 'no';
    };

    try {
        const statuses = await AIService.getDetailedStatus();

        // Prompt API dot
        const dot1 = document.createElement('div');
        dot1.className = `status-dot ${normalizeStatusClass(statuses.prompt)}`;
        dot1.title = `Prompt API: ${statuses.prompt}`;
        dot1.style.cursor = 'help';
        els.footerStatusDots.appendChild(dot1);

        // Rewriter API dot
        const dot2 = document.createElement('div');
        dot2.className = `status-dot ${normalizeStatusClass(statuses.rewriter)}`;
        dot2.title = `Rewriter API: ${statuses.rewriter}`;
        dot2.style.cursor = 'help';
        els.footerStatusDots.appendChild(dot2);
    } catch {
        // Fallback to error dots if check fails
        const dot1 = document.createElement('div');
        dot1.className = 'status-dot no';
        dot1.title = 'Prompt API: unavailable';
        dot1.style.cursor = 'help';
        els.footerStatusDots.appendChild(dot1);

        const dot2 = document.createElement('div');
        dot2.className = 'status-dot no';
        dot2.title = 'Rewriter API: unavailable';
        dot2.style.cursor = 'help';
        els.footerStatusDots.appendChild(dot2);
    }
}

// ============================================================================
// Google Drive Functions
// ============================================================================

/**
 * Initialize Google Drive state
 */
async function initGoogleDrive() {
    try {
        const { driveConnected, userEmail, lastBackupTime, autoSyncEnabled } =
            await chrome.storage.local.get(['driveConnected', 'userEmail', 'lastBackupTime', 'autoSyncEnabled']);

        if (driveConnected && userEmail) {
            els.driveSignedOut.classList.add('hidden');
            els.driveSignedIn.classList.remove('hidden');
            els.userEmail.textContent = userEmail;

            if (lastBackupTime) {
                els.lastBackupTime.textContent = new Date(lastBackupTime).toLocaleString();
            }

            if (autoSyncEnabled) {
                els.autoSyncCheckbox.checked = true;
            }
        }
    } catch (err) {
        console.error('[GoogleDrive] Init error:', err);
    }
}

async function handleGoogleSignIn() {
    try {
        const token = await GoogleDriveService.authenticate();
        const userInfo = await GoogleDriveService.getUserInfo(token);

        els.userEmail.textContent = userInfo.email;
        els.driveSignedOut.classList.add('hidden');
        els.driveSignedIn.classList.remove('hidden');

        // Enable auto-backup by default
        els.autoSyncCheckbox.checked = true;
        chrome.alarms.create('auto-backup', { periodInMinutes: 30 });

        await chrome.storage.local.set({
            driveConnected: true,
            userEmail: userInfo.email,
            autoSyncEnabled: true  // Default ON
        });

        console.log('[GoogleDrive] Signed in with auto-backup enabled');
    } catch (err) {
        console.error('[GoogleDrive] Sign in failed:', err);
        pkAlert('Sign in failed: ' + err.message, 'Sign In Error');
    }
}

async function handleBackup() {
    try {
        const prompts = await StorageService.getPrompts();
        const projects = await StorageService.getProjects();

        await GoogleDriveService.backupToDrive(prompts, projects);

        const backupTime = new Date().toISOString();
        els.lastBackupTime.textContent = new Date(backupTime).toLocaleString();

        await chrome.storage.local.set({ lastBackupTime: backupTime });

        pkAlert(`Backed up ${prompts.length} prompts and ${projects.length} workspaces!`, 'Backup Complete');
    } catch (err) {
        console.error('[GoogleDrive] Backup failed:', err);
        pkAlert('Backup failed: ' + err.message, 'Backup Error');
    }
}

async function handleRestore() {
    const confirmed = await pkConfirm('Merge prompts from Google Drive with local library?', {
        title: 'Restore from Google Drive',
        confirmText: 'Restore'
    });
    if (!confirmed) return;

    try {
        const data = await GoogleDriveService.restoreFromDrive();
        const importedPrompts = await StorageService.importPrompts(data);

        pkAlert(`Restored ${importedPrompts} prompts from Google Drive!`, 'Restore Complete');

        await loadWorkspaces();
        await loadPrompts();
        updateLibraryStats();
    } catch (err) {
        console.error('[GoogleDrive] Restore failed:', err);
        pkAlert('Restore failed: ' + err.message, 'Restore Error');
    }
}

async function handleAutoSyncToggle(e) {
    const enabled = e.target.checked;
    await chrome.storage.local.set({ autoSyncEnabled: enabled });

    if (enabled) {
        chrome.alarms.create('auto-backup', { periodInMinutes: 30 });
    } else {
        chrome.alarms.clear('auto-backup');
    }
}

async function handleGoogleSignOut() {
    const confirmed = await pkConfirm('Sign out of Google Drive? Local prompts remain safe.', {
        title: 'Sign Out',
        confirmText: 'Sign Out'
    });
    if (!confirmed) return;

    try {
        await GoogleDriveService.signOut();

        els.driveSignedOut.classList.remove('hidden');
        els.driveSignedIn.classList.add('hidden');
        els.lastBackupTime.textContent = 'Never';
        els.autoSyncCheckbox.checked = false;

        await chrome.storage.local.set({ driveConnected: false, userEmail: null, autoSyncEnabled: false });
        chrome.alarms.clear('auto-backup');
    } catch (err) {
        console.error('[GoogleDrive] Sign out failed:', err);
        pkAlert('Sign out failed: ' + err.message, 'Sign Out Error');
    }
}

// ===========================================================================
// Prompt Coach - Real-time prompt analysis with AI
// ===========================================================================

let promptCoachAvailable = false;
let promptCoachDebounceTimer = null;

/**
 * Check if browser supports Gemini Nano (Chrome only feature)
 */
function isGeminiNanoSupported() {
    // Check if we're in Chrome (not Edge, Firefox, Safari, etc.)
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg|Edge|OPR|Opera/.test(navigator.userAgent);

    // Check for built-in AI APIs
    const hasAIAPI = typeof window !== 'undefined' && (
        window.LanguageModel ||
        window.PKBuiltinAI ||
        (window.ai && window.ai.languageModel)
    );

    return { isChrome, hasAIAPI };
}

/**
 * Initialize Prompt Coach with AI availability detection
 */
async function initPromptCoach() {
    console.log('[PromptCoach] Initializing...', { container: !!els.promptCoachContainer });
    if (!els.promptCoachContainer) {
        console.warn('[PromptCoach] Container not found!');
        return;
    }

    const { isChrome, hasAIAPI } = isGeminiNanoSupported();
    console.log('[PromptCoach] Browser check:', { isChrome, hasAIAPI });

    // Check AI availability
    let aiAvailable = false;
    try {
        const status = await AIService.getAvailability();
        aiAvailable = status === 'readily' || status === 'available';
    } catch (err) {
        console.warn('[PromptCoach] AI availability check failed:', err);
    }

    if (!isChrome || !aiAvailable) {
        // Show warning for non-Chrome browsers or unavailable AI
        els.promptCoachContainer.classList.remove('hidden');
        els.promptCoachTags.innerHTML = '';
        els.promptCoachWarning.classList.remove('hidden');

        if (!isChrome) {
            els.promptCoachWarning.querySelector('.warning-text').textContent =
                'Prompt Coach is ONLY available on Chrome with Gemini Nano built-in AI. Please use Chrome to access this feature.';
        } else {
            els.promptCoachWarning.querySelector('.warning-text').textContent =
                'Prompt Coach requires Gemini Nano built-in AI. Please enable Chrome\'s AI features in chrome://flags.';
        }

        promptCoachAvailable = false;
        return;
    }

    // AI is available - enable Prompt Coach
    promptCoachAvailable = true;
    els.promptCoachContainer.classList.remove('hidden');
    els.promptCoachWarning.classList.add('hidden');

    // Add click handler for score link to open guide
    if (els.promptScoreLink) {
        els.promptScoreLink.addEventListener('click', (e) => {
            e.preventDefault();
            const guideUrl = chrome.runtime.getURL('how_to.html#prompt-coach');
            window.open(guideUrl, '_blank');
        });
    }

    // Add real-time analysis on text changes
    if (els.textArea) {
        els.textArea.addEventListener('input', debouncePromptAnalysis);
    }

    // Run initial analysis if there's content
    if (els.textArea && els.textArea.value.trim()) {
        analyzePromptQuality(els.textArea.value);
    }
}

/**
 * Debounce prompt analysis to avoid excessive API calls
 */
function debouncePromptAnalysis() {
    if (!promptCoachAvailable) return;

    clearTimeout(promptCoachDebounceTimer);
    promptCoachDebounceTimer = setTimeout(() => {
        const text = els.textArea?.value || '';
        analyzePromptQuality(text);
    }, 500); // Wait 500ms after user stops typing
}

/**
 * Analyze prompt quality and update hashtag attributes
 */
function analyzePromptQuality(text) {
    if (!els.promptCoachTags || !els.promptScore) return;

    // Clear previous tags
    els.promptCoachTags.innerHTML = '';

    if (!text.trim()) {
        els.promptScore.textContent = '—';
        els.promptScore.className = 'prompt-score';
        return;
    }

    // Calculate quality metrics (rule-based heuristics)
    const metrics = calculatePromptMetrics(text);

    // Calculate overall score
    const score = calculateOverallScore(metrics);

    // Update score display
    els.promptScore.textContent = `${score}/100`;
    els.promptScore.className = 'prompt-score ' + getScoreClass(score);

    // Generate and display hashtag attributes
    const tags = generateHashtagAttributes(metrics);
    tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = `coach-tag ${tag.type}`;
        tagEl.textContent = tag.label;
        tagEl.title = tag.tooltip;
        els.promptCoachTags.appendChild(tagEl);
    });
}

/**
 * Calculate prompt quality metrics
 */
function calculatePromptMetrics(text) {
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const charCount = text.length;
    const sentenceCount = (text.match(/[.!?]+/g) || []).length;
    const hasQuestionMark = text.includes('?');
    const hasPlaceholders = /\[.*?\]|{.*?}|<.*?>/.test(text);
    const hasStructure = /^(#|\*|-|\d+\.)/m.test(text);
    const hasContext = /(context|background|scenario|situation)/i.test(text);
    const hasRole = /(you are|act as|imagine you|pretend to be|role)/i.test(text);
    const hasFormat = /(format|structure|output|response should|return as)/i.test(text);
    const hasExamples = /(example|for instance|e\.g\.|such as)/i.test(text);
    const hasConstraints = /(must|should|do not|don't|never|always|only)/i.test(text);
    const hasSpecificity = /(\d+|specific|exactly|precisely|detailed)/i.test(text);

    return {
        wordCount,
        charCount,
        sentenceCount,
        hasQuestionMark,
        hasPlaceholders,
        hasStructure,
        hasContext,
        hasRole,
        hasFormat,
        hasExamples,
        hasConstraints,
        hasSpecificity,
        // Calculated metrics
        isTooBrief: wordCount < 10,
        isTooLong: wordCount > 500,
        hasAdequateLength: wordCount >= 20 && wordCount <= 300
    };
}

/**
 * Calculate overall prompt quality score (0-100)
 */
function calculateOverallScore(metrics) {
    let score = 0;

    // Length scoring (up to 25 points)
    if (metrics.hasAdequateLength) score += 25;
    else if (metrics.isTooBrief) score += 5;
    else if (metrics.isTooLong) score += 15;
    else score += 10;

    // Structure and clarity (up to 25 points)
    if (metrics.hasStructure) score += 10;
    if (metrics.hasPlaceholders) score += 10;
    if (metrics.sentenceCount >= 2) score += 5;

    // Context and specificity (up to 25 points)
    if (metrics.hasContext) score += 10;
    if (metrics.hasSpecificity) score += 10;
    if (metrics.hasExamples) score += 5;

    // Instructions completeness (up to 25 points)
    if (metrics.hasRole) score += 10;
    if (metrics.hasFormat) score += 8;
    if (metrics.hasConstraints) score += 7;

    return Math.min(100, Math.max(0, score));
}

/**
 * Get CSS class based on score
 */
function getScoreClass(score) {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
}

/**
 * Generate hashtag attributes based on metrics
 */
function generateHashtagAttributes(metrics) {
    const tags = [];

    // Positive attributes
    if (metrics.hasRole) {
        tags.push({ label: '#persona', type: 'tag-positive', tooltip: 'Has a defined role/persona' });
    }
    if (metrics.hasContext) {
        tags.push({ label: '#context', type: 'tag-positive', tooltip: 'Provides context/background' });
    }
    if (metrics.hasFormat) {
        tags.push({ label: '#format', type: 'tag-positive', tooltip: 'Specifies output format' });
    }
    if (metrics.hasExamples) {
        tags.push({ label: '#examples', type: 'tag-positive', tooltip: 'Includes examples' });
    }
    if (metrics.hasConstraints) {
        tags.push({ label: '#constraints', type: 'tag-positive', tooltip: 'Has clear constraints' });
    }
    if (metrics.hasSpecificity) {
        tags.push({ label: '#specific', type: 'tag-positive', tooltip: 'Contains specific details' });
    }
    if (metrics.hasStructure) {
        tags.push({ label: '#structured', type: 'tag-positive', tooltip: 'Well-structured with formatting' });
    }
    if (metrics.hasPlaceholders) {
        tags.push({ label: '#templated', type: 'tag-positive', tooltip: 'Has variable placeholders' });
    }

    // Negative/warning attributes
    if (metrics.isTooBrief) {
        tags.push({ label: '#too-brief', type: 'tag-negative', tooltip: 'Prompt is too short. Add more detail.' });
    }
    if (metrics.isTooLong) {
        tags.push({ label: '#verbose', type: 'tag-neutral', tooltip: 'Prompt may be too long. Consider simplifying.' });
    }
    if (!metrics.hasRole && !metrics.hasContext && !metrics.hasFormat) {
        tags.push({ label: '#needs-structure', type: 'tag-negative', tooltip: 'Add persona, context, or format instructions' });
    }
    if (metrics.wordCount >= 10 && !metrics.hasSpecificity && !metrics.hasExamples) {
        tags.push({ label: '#vague', type: 'tag-neutral', tooltip: 'Could be more specific. Add details or examples.' });
    }

    return tags;
}

// Boot
document.addEventListener('DOMContentLoaded', init);