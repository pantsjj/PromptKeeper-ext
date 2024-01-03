let currentPromptIndex = null;

// Expanded arrays with 20 entries each
const adjectives = [
    'Quick', 'Lazy', 'Charming', 'Diligent', 'Mighty',
    'Calm', 'Brave', 'Elegant', 'Fierce', 'Gentle',
    'Happy', 'Jolly', 'Kind', 'Lively', 'Nice',
    'Proud', 'Quirky', 'Rapid', 'Sharp', 'Vigorous'
];

const animals = [
    'Fox', 'Horse', 'Lion', 'Panda', 'Eagle',
    'Bear', 'Cat', 'Dog', 'Elephant', 'Giraffe',
    'Kangaroo', 'Leopard', 'Monkey', 'Otter', 'Penguin',
    'Quail', 'Rabbit', 'Snake', 'Tiger', 'Wolf'
];

const objects = [
    'Pencil', 'Monitor', 'Chair', 'Tablet', 'Camera',
    'Book', 'Clock', 'Desk', 'Guitar', 'Hat',
    'Igloo', 'Jug', 'Kite', 'Lamp', 'Map',
    'Notebook', 'Orange', 'Pillow', 'Quilt', 'Ruler'
];

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


document.getElementById('save-button').addEventListener('click', function() {
    let title = document.getElementById('prompt-title').value.trim();
    let text = document.getElementById('prompt-text').value.trim();

    // If title is empty, generate a random title
    if (title === '') {
        title = generateRandomTitle();
    }

    if (text === '') {
        alert('Please enter some text for the prompt.');
        return;
    }

    chrome.storage.local.get({prompts: []}, function(data) {
        let prompts = data.prompts;
        prompts.push({ title: title, text: text });

        chrome.storage.local.set({prompts: prompts}, function() {
            document.getElementById('prompt-title').value = title; // Keep the generated title for reference
            document.getElementById('prompt-text').value = '';
            displayPrompts();
            updateCurrentTextStats();
            updateTotalStorageUsed();
        });
    });
});

document.getElementById('delete-prompt-button').addEventListener('click', function() {
    if (currentPromptIndex !== null) {
        chrome.storage.local.get({prompts: []}, function(data) {
            let prompts = data.prompts;
            prompts.splice(currentPromptIndex, 1);

            chrome.storage.local.set({prompts: prompts}, function() {
                currentPromptIndex = null;
                document.getElementById('prompt-title').value = '';
                document.getElementById('prompt-text').value = '';
                displayPrompts();
                updateCurrentTextStats();
                updateTotalStorageUsed();
            });
        });
    } else {
        alert('No prompt selected to delete.');
    }
});

function displayPrompts() {
    chrome.storage.local.get({prompts: []}, function(data) {
        let prompts = data.prompts;
        let promptListElement = document.getElementById('prompt-list');
        promptListElement.innerHTML = '';

        prompts.forEach(function(prompt, index) {
            let entry = document.createElement('div');
            entry.className = 'prompt-entry';
            entry.textContent = prompt.title;
            entry.addEventListener('click', function() {
                document.getElementById('prompt-title').value = prompt.title;
                document.getElementById('prompt-text').value = prompt.text;
                currentPromptIndex = index;
                updateCurrentTextStats();
            });
            promptListElement.appendChild(entry);
        });

        if (prompts.length === 0) {
            currentPromptIndex = null; // Reset if no prompts are available
        }
    });
}

function updateCurrentTextStats() {
    let currentText = document.getElementById('prompt-text').value;
    let wordCount = currentText.split(/\s+/).filter(Boolean).length;
    document.getElementById('word-count').textContent = 'Words: ' + wordCount;
    document.getElementById('version-count').textContent = 'Versions: 0';
}

function updateTotalStorageUsed() {
    chrome.storage.local.getBytesInUse(null, function(bytesInUse) {
        let sizeInKB = bytesInUse / 1024;
        document.getElementById('storage-used').textContent = 'Storage: ' + sizeInKB.toFixed(2) + ' KB';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    displayPrompts();
    updateCurrentTextStats();
    updateTotalStorageUsed();
});


// popup.js
document.getElementById('paste-prompt-button').addEventListener('click', function() {
    let text = document.getElementById('prompt-text').value;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // Check if the tab's URL is not a chrome:// URL
        if (!tabs[0].url.startsWith('chrome://')) {
            // First, inject the content script into the active tab
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                files: ['contentScript.js']
            }, () => {
                // Now that the content script is injected, send the message
                if (chrome.runtime.lastError) {
                    console.error(`Error injecting script: ${chrome.runtime.lastError.message}`);
                } else {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "pastePrompt", text: text}, response => {
                        if (chrome.runtime.lastError) {
                            console.error(`Error sending message: ${chrome.runtime.lastError.message}`);
                        } else if (response) {
                            console.log('Paste prompt success:', response.status);
                        }
                    });
                }
            });
        } else {
            alert('Cannot paste into a chrome:// page.');
        }
    });
});




function pasteText(text) {
    // This function gets injected into the tab's page context
    const activeElement = document.activeElement;
    if (activeElement.tagName.toLowerCase() === 'input' || activeElement.tagName.toLowerCase() === 'textarea') {
        activeElement.value = text;
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        activeElement.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (activeElement.isContentEditable) {
        document.execCommand('insertText', false, text);
    }
}

// Add a click event listener to the "Tunables" button
document.getElementById('toggle-tunables').addEventListener('click', function() {
    let tunablesDiv = document.getElementById('tunables');
    if (tunablesDiv.style.display === "none") {
        tunablesDiv.style.display = "block";
    } else {
        tunablesDiv.style.display = "none";
    }
});


document.getElementById('import-prompts').addEventListener('click', function() {
    document.getElementById('import-file').click(); // Triggers the file selection
});

document.getElementById('import-prompts').addEventListener('click', function() {
    document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', function(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                let importedData = JSON.parse(e.target.result);

                // Validate the structure of the data
                if (!Array.isArray(importedData)) {
                    throw new Error('Invalid format: Expected an array of prompts.');
                }
                // Additional validation can be done here

                chrome.storage.local.set({prompts: importedData}, function() {
                    if (chrome.runtime.lastError) {
                        throw new Error(`Error setting prompts: ${chrome.runtime.lastError.message}`);
                    }
                    displayPrompts();
                    updateTotalStorageUsed();
                    alert('Prompts imported successfully.');
                });
            } catch (error) {
                alert(`Failed to import prompts: ${error.message}`);
                console.error('Import Error:', error);
            }
        };
        reader.onerror = function() {
            alert('Failed to read the file.');
        };
        reader.readAsText(file);
    }
    event.target.value = ''; // Reset the input
});



document.getElementById('export-prompts').addEventListener('click', function() {
    const version = chrome.runtime.getManifest().version;
    const dateStamp = new Date().toISOString().replace(/[-:.T]/g, '').slice(0, 12); // YYMMDDHHMMSS
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const filename = `PromptKeeper_backup_${version}_${dateStamp}_${randomAnimal}.json`;

    chrome.storage.local.get({prompts: []}, function(data) {
        const json = JSON.stringify(data.prompts, null, 2);
        const blob = new Blob([json], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, function(downloadId) {
            if (chrome.runtime.lastError) {
                console.error(`Error exporting prompts: ${chrome.runtime.lastError.message}`);
                alert('There was an error exporting your prompts.');
            } else {
                URL.revokeObjectURL(url);
                // We can't provide the exact path, but we can confirm the download started.
                alert(`Export: Please choose a save location for the file "${filename}"`);
            }
        });
    });
});
