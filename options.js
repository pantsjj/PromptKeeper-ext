import StorageService from './services/StorageService.js';
import AIService from './services/AIService.js';

console.log('Options Init: Script Loaded');

let currentPromptId = null;
let currentProjectId = null;

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
    versionSelect: document.getElementById('version-history-select'), // New Dropdown
    scoreBtn: document.getElementById('score-btn'),
    scoreResult: document.getElementById('score-result'),
    scoreValue: document.getElementById('score-value'),
    scoreFeedback: document.getElementById('score-feedback'),
    refineBtns: document.querySelectorAll('.refine-btn'),
    projectSelect: document.getElementById('project-select'),
    addProjectBtn: document.getElementById('add-project-btn'),
    aiStatus: document.getElementById('ai-status')
};

/**
 * Initialize the Options Page
 */
async function init() {
    console.log('Options Init: Starting...');
    
    // 1. Setup listeners first so UI is responsive
    setupEventListeners();

    // 2. AI Check
    try {
        await checkAIStatus();
    } catch (err) {
        console.warn("AI Status Check failed:", err);
    }

    // 3. Load Data
    try {
        await loadProjects();
    } catch (err) {
        console.error("Failed to load projects:", err);
    }

    try {
        await loadPrompts();
    } catch (err) {
        console.error("Failed to load prompts:", err);
    }
}

async function checkAIStatus() {
    if (!els.aiStatus) return;
    
    try {
        const status = await AIService.getAvailability();
        console.log("AI Status:", status);
        
        if (status === 'readily') {
            els.aiStatus.textContent = "✅ AI Ready (Gemini Nano)";
            els.aiStatus.style.color = "var(--primary-color)";
        } else if (status === 'after-download') {
            els.aiStatus.textContent = "⬇️ AI Model needs download (will start on first use)";
            els.aiStatus.style.color = "#f9ab00";
        } else {
            els.aiStatus.textContent = "❌ AI Not Supported on this device/browser";
            els.aiStatus.style.color = "#d93025";
            // Disable buttons
            if (els.scoreBtn) els.scoreBtn.disabled = true;
            els.refineBtns.forEach(b => b.disabled = true);
        }
    } catch (err) {
        console.error("AI Check Error:", err);
        els.aiStatus.textContent = "❓ AI Status Unknown";
    }
}

/**
 * Loads projects into the dropdown
 */
async function loadProjects() {
    const projects = await StorageService.getProjects();
    els.projectSelect.innerHTML = '<option value="">All Prompts</option>';
    
    projects.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        els.projectSelect.appendChild(option);
    });
    
    // Restore selection if refreshing
    if (currentProjectId) {
        els.projectSelect.value = currentProjectId;
    }
}

async function handleAddProject() {
    const name = prompt("Enter Project Name:");
    if (!name) return;
    const systemPrompt = prompt("Enter System Context (Optional - applied to AI tasks):");
    
    await StorageService.addProject(name, systemPrompt || "");
    await loadProjects();
}

async function handleProjectChange() {
    const val = els.projectSelect.value;
    currentProjectId = val === "" ? null : val; // Ensure empty string becomes null
    await loadPrompts();
}

/**
 * Loads prompts from StorageService and renders the list
 */
async function loadPrompts() {
    const prompts = await StorageService.getPrompts();
    console.log(`Loaded ${prompts.length} prompts. Current Project: ${currentProjectId}`);
    
    // Filter by Project
    const filteredPrompts = currentProjectId 
        ? prompts.filter(p => p.projectId === currentProjectId)
        : prompts;

    renderPromptList(filteredPrompts);

    // Auto-select logic if none selected or invalid
    if (!currentPromptId || !filteredPrompts.find(p => p.id === currentPromptId)) {
        if (filteredPrompts.length > 0) {
            selectPrompt(filteredPrompts[0]);
        } else {
            createNewPrompt();
        }
    }
}

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

function selectPrompt(prompt) {
    currentPromptId = prompt.id;
    els.titleInput.value = prompt.title;
    
    // Get content from current version
    const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId);
    els.textArea.value = currentVersion ? currentVersion.content : '';
    
    updateStats();
    renderHistoryDropdown(prompt);
    
    // Refresh list highlight logic without full re-render to avoid flicker
    const items = els.promptList.querySelectorAll('.prompt-item');
    items.forEach((item) => {
        item.classList.remove('active');
        if (item.querySelector('.prompt-item-title').textContent === prompt.title) {
           item.classList.add('active');
        }
    });
}

/**
 * Populates the version dropdown with up to 20 items.
 */
function renderHistoryDropdown(prompt) {
    if (!els.versionSelect) return;
    els.versionSelect.innerHTML = '';
    
    // Sort desc (newest first)
    const sortedVersions = [...prompt.versions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);
    
    sortedVersions.forEach((version, index) => {
        const isCurrent = version.id === prompt.currentVersionId;
        const option = document.createElement('option');
        option.value = version.id;
        
        const date = new Date(version.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Label format: "Current (Time)" or "Revision {N} (Time)"
        const verNum = prompt.versions.length - index; // rough version number
        const prefix = isCurrent ? "Current" : `Revision ${verNum}`;
        
        option.textContent = `${prefix} - ${dateStr} ${timeStr}`;
        if (isCurrent) option.selected = true;
        
        els.versionSelect.appendChild(option);
    });
    
    // Handle selection change
    els.versionSelect.onchange = () => {
        const selectedId = els.versionSelect.value;
        const version = prompt.versions.find(v => v.id === selectedId);
        if (version) {
            els.textArea.value = version.content;
            updateStats();
            
            // If viewing old version, maybe show visual cue?
            // For now, the dropdown showing "vX" is the cue.
        }
    };
}

function createNewPrompt() {
    currentPromptId = null;
    els.titleInput.value = '';
    els.textArea.value = '';
    if (els.versionSelect) els.versionSelect.innerHTML = '<option>New Draft</option>';
    els.titleInput.focus();
    updateStats();
    
    const items = els.promptList.querySelectorAll('.prompt-item');
    items.forEach(item => item.classList.remove('active'));
}

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

async function deletePrompt() {
    if (!currentPromptId) return;
    if (confirm('Delete this prompt permanently?')) {
        await StorageService.deletePrompt(currentPromptId);
        currentPromptId = null;
        await loadPrompts();
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
            // Update existing
            await Promise.all([
                StorageService.updatePrompt(currentPromptId, text),
                StorageService.renamePrompt(currentPromptId, title)
            ]);
        } else {
            // Create new
            const newPrompt = await StorageService.addPrompt(text);
            // Assign to current project if one is selected
            if (currentProjectId) {
                await StorageService.setPromptProject(newPrompt.id, currentProjectId);
            }
            if (title !== 'Untitled Prompt') {
                await StorageService.renamePrompt(newPrompt.id, title);
            }
            currentPromptId = newPrompt.id;
        }
        
        // UX Feedback: Pulse Glow
        els.textArea.classList.add('pulse-green');
        setTimeout(() => els.textArea.classList.remove('pulse-green'), 1000);
        
        // Just reload prompts to handle filtering correctly
        await loadPrompts();
        
    } catch (err) {
        console.error('Save error:', err);
        alert('Failed to save.');
    }
}

// ... (deletePrompt) ...

function setupEventListeners() {
    els.newBtn.addEventListener('click', createNewPrompt);
    els.saveBtn.addEventListener('click', savePrompt);
    els.deleteBtn.addEventListener('click', deletePrompt);
    els.textArea.addEventListener('input', updateStats);
    els.addProjectBtn.addEventListener('click', handleAddProject);
    els.projectSelect.addEventListener('change', handleProjectChange);
    
    // ... (shortcuts and AI listeners) ...
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            savePrompt();
        }
    });

    if (els.scoreBtn) els.scoreBtn.addEventListener('click', handleScore);
    if (els.refineBtns) els.refineBtns.forEach(btn => btn.addEventListener('click', () => handleRefine(btn.dataset.type)));
}

// ... (AI Handlers) ...
// Note: In handleRefine/handleScore, we should ideally inject the Project System Prompt.
// Task 4.2 System Grounding:
// We need to fetch the project context if currentProjectId is set.

async function handleScore() {
    const text = els.textArea.value.trim();
    if (!text) return alert("Enter a prompt to score.");

    els.scoreBtn.textContent = "Analyzing...";
    els.scoreBtn.disabled = true;
    els.scoreResult.classList.add('hidden');

    try {
        // Phase 4.2: Inject System Grounding if Project Selected
        let promptToScore = text;
        if (currentProjectId) {
            const projects = await StorageService.getProjects();
            const project = projects.find(p => p.id === currentProjectId);
            if (project && project.systemPrompt) {
                // We append context for the AI to consider
                promptToScore = `[System Context: ${project.systemPrompt}]\n\n${text}`;
            }
        }

        const result = await AIService.scorePrompt(promptToScore);
        
        els.scoreValue.textContent = `${result.score}/10`;
        els.scoreFeedback.textContent = result.feedback;
        els.scoreResult.classList.remove('hidden');
        
        if (result.score >= 8) els.scoreValue.style.color = '#188038';
        else if (result.score >= 5) els.scoreValue.style.color = '#f9ab00';
        else els.scoreValue.style.color = '#d93025';

    } catch (err) {
        console.error(err);
        alert("AI Scoring failed.");
    } finally {
        els.scoreBtn.textContent = "✨ Score Prompt";
        els.scoreBtn.disabled = false;
    }
}

async function handleRefine(type) {
    const text = els.textArea.value.trim();
    if (!text) return alert("Enter a prompt to refine.");

    els.saveBtn.textContent = "Refining...";
    document.body.style.cursor = 'wait';

    try {
        let inputToRefine = text;
        // Phase 4.2: Inject System Grounding
        if (currentProjectId) {
            const projects = await StorageService.getProjects();
            const project = projects.find(p => p.id === currentProjectId);
            if (project && project.systemPrompt) {
                inputToRefine = `[System Context: ${project.systemPrompt}]\n\n${text}`;
            }
        }

        const refinedText = await AIService.refinePrompt(inputToRefine, type);
        
        if (refinedText) {
            els.textArea.value = refinedText;
            await savePrompt();
            alert(`Prompt refined (${type}) and saved as new version!`);
        }
    } catch (err) {
        alert("Refinement failed: " + err.message);
    }
 finally {
        els.saveBtn.textContent = "Save";
        document.body.style.cursor = 'default';
        updateStats();
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);