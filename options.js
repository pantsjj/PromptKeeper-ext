import StorageService from './services/StorageService.js';
import AIService from './services/AIService.js';

console.log('Options Init: Script Loaded');

// State
let currentPromptId = null;
let currentProjectId = null; // null = 'all'
let searchFilter = '';
let isDragging = false;
let draggedPromptId = null;

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
    els.versionSelect = document.getElementById('version-history-select');
    els.wordCount = document.getElementById('word-count');
    els.charCount = document.getElementById('char-count');
    els.versionLabel = document.getElementById('version-label');
    els.projectLabel = document.getElementById('project-label');
    els.aiStatus = document.getElementById('ai-status');
    els.refineBtns = document.querySelectorAll('.refine-btn');

    setupEventListeners();

    try {
        await checkAIStatus();
    } catch (err) { console.warn("AI Status Check failed:", err); }

    try {
        await loadWorkspaces();
        await loadPrompts();
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
    els.textArea.addEventListener('input', updateStats);

    // Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            savePrompt();
        }
    });

    // AI
    if (els.refineBtns) {
        els.refineBtns.forEach(btn =>
            btn.addEventListener('click', () => handleRefine(btn.dataset.type))
        );
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

async function handleAddProject() {
    const name = prompt("Enter Workspace Name:");
    if (!name) return;
    const direction = prompt("Enter Direction/Context (Optional - helps AI understand this workspace):");

    await StorageService.addProject(name, direction || "");
    await loadWorkspaces();
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
        } catch (e) { }

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
        }
    }
}

/**
 * Drag and Drop Logic
 */
function setupDragSource(el, promptId) {
    el.addEventListener('dragstart', (e) => {
        isDragging = true;
        draggedPromptId = promptId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', promptId);
        el.style.opacity = '0.5';
    });

    el.addEventListener('dragend', (e) => {
        isDragging = false;
        draggedPromptId = null;
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

// Boot
document.addEventListener('DOMContentLoaded', init);