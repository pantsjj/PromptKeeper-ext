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
    historyList: null,
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
    try {
        await checkAIStatus();
        await loadProjects();
        await loadPrompts();
        
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

        setupEventListeners();
    } catch (err) {
        console.error("Init failed:", err);
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
    currentProjectId = els.projectSelect.value || null;
    await loadPrompts();
}

/**
 * Loads prompts from StorageService and renders the list
 */
async function loadPrompts() {
    const prompts = await StorageService.getPrompts();
    
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

// ... (renderPromptList, selectPrompt, renderHistory, previewVersion remain same) ...

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
        
        const prompts = await StorageService.getPrompts();
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