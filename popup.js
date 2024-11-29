let currentPromptIndex = null;

// Expanded arrays for generating random titles
const adjectives = ['Quick', 'Lazy', 'Charming', 'Diligent', 'Mighty', 'Calm', 'Brave', 'Elegant', 'Fierce', 'Gentle', 'Happy', 'Jolly', 'Kind', 'Lively', 'Nice', 'Proud', 'Quirky', 'Rapid', 'Sharp', 'Vigorous'];
const animals = ['Fox', 'Horse', 'Lion', 'Panda', 'Eagle', 'Bear', 'Cat', 'Dog', 'Elephant', 'Giraffe', 'Kangaroo', 'Leopard', 'Monkey', 'Otter', 'Penguin', 'Quail', 'Rabbit', 'Snake', 'Tiger', 'Wolf'];
const objects = ['Pencil', 'Monitor', 'Chair', 'Tablet', 'Camera', 'Book', 'Clock', 'Desk', 'Guitar', 'Hat', 'Igloo', 'Jug', 'Kite', 'Lamp', 'Map', 'Notebook', 'Orange', 'Pillow', 'Quilt', 'Ruler'];

// Function to generate a four-digit number
function generateFourDigitNumber() {
    return Math.floor(Math.random() * 9000 + 1000); // Generates a number from 1000 to 9999
}

// Function to generate a random title
function generateRandomTitle() {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const object = objects[Math.floor(Math.random() * objects.length)];
    const fourDigitNumber = generateFourDigitNumber();
    return `${adjective}-${animal}-${object}-${fourDigitNumber}`;
}

// Save a new prompt
document.getElementById('save-button').addEventListener('click', function () {
    let baseTitle = document.getElementById('prompt-title').value.trim();
    let text = document.getElementById('prompt-text').value.trim();
    let datetime = new Date().toISOString();

    if (!baseTitle) baseTitle = generateRandomTitle();
    if (!text) {
        alert('Please enter some text for the prompt.');
        return;
    }

    chrome.storage.local.get({ prompts: [] }, function (data) {
        let prompts = data.prompts;
        let newTitle = baseTitle;

        // Handle title versioning
        let relatedTitles = prompts.filter(prompt => prompt.title.startsWith(baseTitle)).map(prompt => prompt.title);
        if (relatedTitles.length > 0) {
            let maxVersion = Math.max(...relatedTitles.map(title => parseInt(title.split(' - ')[1] || 0, 10)));
            newTitle = `${baseTitle} - ${maxVersion + 1}`;
        }

        prompts.unshift({ title: newTitle, text, saved: datetime });

        chrome.storage.local.set({ prompts }, function () {
            document.getElementById('prompt-title').value = newTitle;
            document.getElementById('prompt-text').value = '';
            currentPromptIndex = 0; // The new prompt is added at the beginning
            displayPrompts();
            updateStats();
        });
    });
});

// Display prompts in the list
function displayPrompts() {
    chrome.storage.local.get({ prompts: [] }, function (data) {
        const promptList = document.getElementById('prompt-list');
        promptList.innerHTML = '';

        if (data.prompts.length === 0) {
            promptList.innerHTML = '<p>No prompts saved. Create a new one!</p>';
            clearStats();
            return;
        }

        data.prompts.forEach((prompt, index) => {
            const entry = document.createElement('div');
            entry.className = 'prompt-entry';
            entry.innerHTML = `
                <span class="prompt-title">${prompt.title}</span>
                <span class="date-stamp">${new Date(prompt.saved).toLocaleString()}</span>
            `;

            entry.addEventListener('click', () => {
                currentPromptIndex = index;
                document.getElementById('prompt-title').value = prompt.title;
                document.getElementById('prompt-text').value = prompt.text;
                updateStats();
            });

            promptList.appendChild(entry);
        });

        // Automatically select the prompt at currentPromptIndex if available
        if (currentPromptIndex !== null && data.prompts[currentPromptIndex]) {
            const entries = promptList.getElementsByClassName('prompt-entry');
            entries[currentPromptIndex].click();
        } else {
            currentPromptIndex = 0;
            promptList.firstChild.click();
        }
    });
}

// Clear stats display
function clearStats() {
    document.getElementById('word-count').textContent = 'Words: 0';
    document.getElementById('version-count').textContent = 'Versions: 0';
    document.getElementById('storage-used').textContent = 'Total Storage: 0 KB';
}

// Update stats (word count, versions, storage)
function updateStats() {
    const promptText = document.getElementById('prompt-text').value.trim();
    const wordCount = promptText ? promptText.split(/\s+/).filter(Boolean).length : 0;
    document.getElementById('word-count').textContent = `Words: ${wordCount}`;

    chrome.storage.local.get({ prompts: [] }, function (data) {
        const baseTitle = document.getElementById('prompt-title').value.split(' - ')[0];
        const versionCount = data.prompts.filter(prompt => prompt.title.startsWith(baseTitle)).length;
        document.getElementById('version-count').textContent = `Versions: ${versionCount}`;
    });

    updateStorageStats();
}

// Display storage usage
function updateStorageStats() {
    chrome.storage.local.getBytesInUse(null, function (bytes) {
        document.getElementById('storage-used').textContent = `Total Storage: ${(bytes / 1024).toFixed(2)} KB`;
    });
}

// New Prompt Button: Clear inputs and reset the state
document.getElementById('new-prompt-button').addEventListener('click', function () {
    document.getElementById('prompt-title').value = '';
    document.getElementById('prompt-text').value = '';
    currentPromptIndex = null; // Reset index to indicate a new unsaved prompt
    clearStats(); // Clear stats for the new unsaved prompt
});

// Paste Prompt Button: Inject text into an active webpage
document.getElementById('paste-prompt-button').addEventListener('click', function () {
    const text = document.getElementById('prompt-text').value.trim();

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && !tabs[0].url.startsWith('chrome://')) {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabs[0].id },
                    files: ['contentScript.js'],
                },
                () => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "pastePrompt", text: text }, function(response) {
                        if (chrome.runtime.lastError || (response && response.status !== 'success')) {
                            console.error(chrome.runtime.lastError);
                            alert('Error: Unable to paste the prompt. Please make sure the content script is properly loaded and an input field is focused.');
                        } else {
                            console.log('Text pasted successfully.');
                        }
                    });
                }
            );
        } else {
            alert('Cannot paste into a chrome:// page.');
        }
    });
});

// Delete a prompt
document.getElementById('delete-prompt-button').addEventListener('click', function () {
    if (currentPromptIndex === null) {
        alert('No prompt selected to delete.');
        return;
    }

    chrome.storage.local.get({ prompts: [] }, function (data) {
        const prompts = data.prompts;

        // Remove the prompt at currentPromptIndex
        prompts.splice(currentPromptIndex, 1);

        chrome.storage.local.set({ prompts }, function () {
            document.getElementById('prompt-title').value = '';
            document.getElementById('prompt-text').value = '';
            currentPromptIndex = null;
            displayPrompts();
            clearStats();
        });
    });
});

// AI-Improve Button (Placeholder)
document.getElementById('ai-improve-button').addEventListener('click', function () {
    alert('AI-Improve functionality is not yet implemented.');
});

// Export Prompts Button
document.getElementById('export-prompts').addEventListener('click', function () {
    chrome.storage.local.get({ prompts: [] }, function (data) {
        const prompts = data.prompts;
        const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create a temporary link to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prompts.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});

// Import Prompts Button
document.getElementById('import-prompts').addEventListener('click', function () {
    document.getElementById('import-file').click();
});

// Handle File Selection
document.getElementById('import-file').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedPrompts = JSON.parse(e.target.result);
            chrome.storage.local.get({ prompts: [] }, function (data) {
                const existingPrompts = data.prompts;
                const combinedPrompts = importedPrompts.concat(existingPrompts);
                chrome.storage.local.set({ prompts: combinedPrompts }, function () {
                    displayPrompts();
                    alert('Prompts imported successfully.');
                });
            });
        } catch (error) {
            alert('Error importing prompts. Please ensure the file is a valid JSON.');
        }
    };
    reader.readAsText(file);
});

// Initialize the extension when the popup is opened
document.addEventListener('DOMContentLoaded', function () {
    displayPrompts(); // Display the list of saved prompts
    updateStats();
    updateStorageStats();
});