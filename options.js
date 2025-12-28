import StorageService from './services/StorageService.js';
import AIService from './services/AIService.js';
import GoogleDriveService from './services/GoogleDriveService.js';

console.log('Options Init: Script Loaded');

// State
let currentPromptId = null;
let currentProjectId = null; // null = 'all'
let searchFilter = '';

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
    els.moreProjectsContainer = document.getElementById('more-projects-container');
    els.moreProjectsList = document.getElementById('more-projects-list');
    els.expandProjectsBtn = document.getElementById('expand-projects-btn');
    els.addProjectBtn = document.getElementById('add-project-btn');
    els.workspaceAll = document.getElementById('workspace-all');
    els.promptList = document.getElementById('prompt-list');
    els.newBtn = document.getElementById('new-prompt-btn');
    els.titleInput = document.getElementById('prompt-title-input');
    els.textArea = document.getElementById('prompt-text-area');
    els.saveBtn = document.getElementById('save-btn');
    els.deleteBtn = document.getElementById('delete-btn');
    els.versionSelect = document.getElementById('footer-version-selector');
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
    els.footerWordCount = document.getElementById('footer-word-count');
    els.footerVersionSelector = document.getElementById('footer-version-selector');
    els.footerStorageUsed = document.getElementById('footer-storage-used');
    els.footerExportLink = document.getElementById('footer-export-link');
    els.footerImportLink = document.getElementById('footer-import-link');
    els.footerImportFile = document.getElementById('footer-import-file');
    els.footerStatusDots = document.getElementById('footer-status-dots');

    setupEventListeners();
    await initGoogleDrive(); // Check Drive auth state

    try {
        await checkAIStatus();
        await updateFooterStatusDots();
    } catch (err) { console.warn("AI Status Check failed:", err); }

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
        }
    });

    // Initial project label
    updateProjectLabel();
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

    // Workspaces
    if (els.addProjectBtn) els.addProjectBtn.addEventListener('click', handleAddProject);
    if (els.workspaceAll) {
        els.workspaceAll.addEventListener('click', () => switchProject(null));
        setupDropTarget(els.workspaceAll, null); // Allow dropping on "All" to remove from project? Or just ignore.
        // Let's say dropping on "All" removes it from any project (unassigned)
        setupDropTarget(els.workspaceAll, null);
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
    });

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
            const dataStr = JSON.stringify(prompts, null, 2);
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
                    alert(`✅ Imported ${imported} prompts!`);
                    await loadPrompts();
                    updateLibraryStats();
                } catch (err) {
                    alert('Import failed: ' + err.message);
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // Right-click context menu for prompts and workspaces
    els.promptList.addEventListener('contextmenu', handlePromptContextMenu);
    els.workspaceList.addEventListener('contextmenu', handleWorkspaceContextMenu);

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

    // AI Refinement
    if (els.refineBtns) {
        els.refineBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                const type = btn.dataset.type;
                await handleRefine(type);
            });
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

    li.addEventListener('click', () => switchProject(project.id));
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

    // 4. Handle Commit / Cancel
    const commit = async () => {
        const rawName = input.value.trim();
        if (!rawName) {
            li.remove();
            return;
        }

        // Validation: snake_case, max 3 words
        const safeName = rawName.replace(/\s+/g, '_').toLowerCase();
        const wordCount = safeName.split('_').filter(w => w.length > 0).length;

        if (wordCount > 3) {
            alert('Max 3 words allowed (e.g. my_project_name)');
            input.focus();
            return;
        }

        if (safeName.length > 64) {
            alert('Max 64 characters exceeded');
            input.focus();
            return;
        }

        try {
            const project = await StorageService.addProject(safeName);
            li.remove();
            await loadWorkspaces();
            switchProject(project.id);
        } catch (err) {
            console.error('Failed to create project:', err);
            alert('Failed to create workspace');
            li.remove();
        }
    };

    const cancel = () => {
        li.remove();
    };

    // Events
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur();
            commit();
        }
        if (e.key === 'Escape') cancel();
    });

    input.addEventListener('blur', () => {
        if (input.value.trim()) commit();
        else cancel();
    });
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

function selectPrompt(prompt) {
    currentPromptId = prompt.id;
    els.titleInput.value = prompt.title;

    const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId);
    els.textArea.value = currentVersion ? currentVersion.content : '';

    updateStats();
    renderHistoryDropdown(prompt);

    // Highlight
    document.querySelectorAll('.nav-item-prompt').forEach(el => el.classList.remove('active'));
    const item = document.querySelector(`.nav-item-prompt[data-id="${prompt.id}"]`);
    if (item) item.classList.add('active');
}

/**
 * Editor & Logic
 */
async function savePrompt() {
    let title = els.titleInput.value.trim();
    const text = els.textArea.value.trim();

    if (!text) return alert('Prompt text cannot be empty');
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

        // Pulse
        els.textArea.classList.add('pulse-green');
        setTimeout(() => els.textArea.classList.remove('pulse-green'), 1000); // Assumes css class exists or just ignore

        loadPrompts();
        updateLibraryStats();

    } catch (err) {
        console.error('Save error:', err);
        alert('Failed to save.');
    }
}

function createNewPrompt() {
    currentPromptId = null;
    els.titleInput.value = '';
    els.textArea.value = '';
    if (els.versionSelect) els.versionSelect.innerHTML = '';
    updateStats();

    document.querySelectorAll('.nav-item-prompt').forEach(el => el.classList.remove('active'));
    els.titleInput.focus();
}

async function deletePrompt() {
    if (!currentPromptId) return;
    if (confirm('Delete this prompt permanently?')) {
        await StorageService.deletePrompt(currentPromptId);
        currentPromptId = null;
        loadPrompts();
        updateLibraryStats();
    }
}

// Stats & Dropdown
function updateStats() {
    const text = els.textArea.value || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    els.wordCount.textContent = `Words: ${words}`;
    els.charCount.textContent = `Chars: ${text.length}`;

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

function renderHistoryDropdown(prompt) {
    if (!els.versionSelect) return;
    els.versionSelect.innerHTML = '';

    // Add placeholder if no prompt
    if (!prompt || !prompt.versions || prompt.versions.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'v1: 06/12/2025 (Curr)';
        els.versionSelect.appendChild(option);
        return;
    }

    const sorted = [...prompt.versions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

    sorted.forEach((v, idx) => {
        const option = document.createElement('option');
        option.value = v.id;
        const verNum = prompt.versions.length - idx;
        const isCurrent = v.id === prompt.currentVersionId;
        const dateStr = new Date(v.timestamp).toLocaleDateString();

        option.textContent = `v${verNum}: ${dateStr} ${isCurrent ? '(Curr)' : ''}`;
        if (isCurrent) option.selected = true;
        els.versionSelect.appendChild(option);
    });

    els.versionSelect.onchange = () => {
        const v = prompt.versions.find(x => x.id === els.versionSelect.value);
        if (v) {
            els.textArea.value = v.content;
            updateStats();
            updateFooterStats();
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
async function handleRefine(type) {
    const text = els.textArea.value.trim();
    if (!text) return alert("Enter text.");

    els.saveBtn.textContent = "...";
    document.body.style.cursor = 'wait';

    try {
        let inputCtx = text;
        if (currentProjectId) {
            const projects = await StorageService.getProjects();
            const p = projects.find(x => x.id === currentProjectId);
            if (p && p.systemPrompt) {
                inputCtx = `[Context: ${p.systemPrompt}] \n\n ${text}`;
            }
        }

        const refined = await AIService.refinePrompt(inputCtx, type);
        if (refined) {
            els.textArea.value = refined;
            await savePrompt(); // Save as new version
        }
    } catch (e) {
        alert("Refine failed: " + e.message);
    } finally {
        els.saveBtn.textContent = "Save";
        document.body.style.cursor = 'default';
        updateStats();
    }
}


async function checkAIStatus() {
    if (!els.aiStatus) return;

    try {
        const status = await AIService.getAvailability();

        if (status === 'readily') {
            els.aiStatus.textContent = "✅ GEMINI ENABLED";
            els.aiStatus.style.color = "var(--primary-color)";
        } else if (status === 'after-download') {
            els.aiStatus.textContent = "⬇️ Downloading Model...";
            els.aiStatus.style.color = "#f9ab00";
        } else {
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

    if (confirm('Delete this prompt?')) {
        deletePrompt(promptId);
    }
}

function handleWorkspaceContextMenu(e) {
    const workspaceItem = e.target.closest('.nav-item[data-project-id]');
    if (!workspaceItem) return;

    e.preventDefault();
    const projectId = workspaceItem.dataset.projectId;

    if (confirm('Delete this workspace? Prompts will not be deleted.')) {
        StorageService.deleteProject(projectId).then(() => {
            loadWorkspaces();
            if (currentProjectId === projectId) {
                currentProjectId = null;
                loadPrompts();
            }
        });
    }
}

// Update footer stats
function updateFooterStats() {
    if (!els.textArea || !els.footerWordCount || !els.footerStorageUsed) return;

    const text = els.textArea.value || '';
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;

    els.footerWordCount.textContent = `Words: ${words}`;

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        const kb = (bytes / 1024).toFixed(1);
        els.footerStorageUsed.textContent = `Size: ${kb} KB`;
    });
}

// Update footer status dots with AI availability
async function updateFooterStatusDots() {
    if (!els.footerStatusDots) return;

    els.footerStatusDots.innerHTML = '';

    try {
        const statuses = await AIService.getDetailedStatus();

        // Prompt API dot
        const dot1 = document.createElement('div');
        dot1.className = `status-dot ${statuses.prompt === 'readily' ? '' : statuses.prompt === 'after-download' ? 'warning' : 'error'}`;
        dot1.title = `Prompt API: ${statuses.prompt}`;
        dot1.style.cursor = 'help';
        els.footerStatusDots.appendChild(dot1);

        // Rewriter API dot
        const dot2 = document.createElement('div');
        dot2.className = `status-dot ${statuses.rewriter === 'readily' ? '' : statuses.rewriter === 'after-download' ? 'warning' : 'error'}`;
        dot2.title = `Rewriter API: ${statuses.rewriter}`;
        dot2.style.cursor = 'help';
        els.footerStatusDots.appendChild(dot2);
    } catch {
        // Fallback to error dots if check fails
        const dot1 = document.createElement('div');
        dot1.className = 'status-dot error';
        dot1.title = 'Prompt API: unavailable';
        dot1.style.cursor = 'help';
        els.footerStatusDots.appendChild(dot1);

        const dot2 = document.createElement('div');
        dot2.className = 'status-dot error';
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
        alert('Sign in failed: ' + err.message);
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

        alert(`✅ Backed up ${prompts.length} prompts and ${projects.length} workspaces!`);
    } catch (err) {
        console.error('[GoogleDrive] Backup failed:', err);
        alert('Backup failed: ' + err.message);
    }
}

async function handleRestore() {
    if (!confirm('Merge prompts from Google Drive with local library?')) return;

    try {
        const data = await GoogleDriveService.restoreFromDrive();
        const importedPrompts = await StorageService.importPrompts(data.prompts);

        alert(`✅ Restored ${importedPrompts} prompts from Google Drive!`);

        await loadWorkspaces();
        await loadPrompts();
        updateLibraryStats();
    } catch (err) {
        console.error('[GoogleDrive] Restore failed:', err);
        alert('Restore failed: ' + err.message);
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
    if (!confirm('Sign out of Google Drive? Local prompts remain safe.')) return;

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
        alert('Sign out failed: ' + err.message);
    }
}

// Boot
document.addEventListener('DOMContentLoaded', init);