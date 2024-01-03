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
    let baseTitle = document.getElementById('prompt-title').value.trim();
    let text = document.getElementById('prompt-text').value.trim();
    let datetime = new Date().toISOString();

    if (baseTitle === '') {
        baseTitle = generateRandomTitle();
    }

    if (text === '') {
        alert('Please enter some text for the prompt.');
        return;
    }

    chrome.storage.local.get({prompts: []}, function(data) {
        let prompts = data.prompts;
        // Initialize the new title with the base title
        let newTitle = baseTitle;

        // Create an array of titles that start with the base title
        let relatedTitles = prompts.filter(prompt => prompt.title.startsWith(baseTitle)).map(prompt => prompt.title);

        if (relatedTitles.length > 0) {
            // Extract the numeric version suffixes and find the max
            let versionNumbers = relatedTitles.map(title => {
                let versionMatch = title.match(new RegExp('^' + baseTitle + ' - (\\d+)$'));
                return versionMatch ? parseInt(versionMatch[1], 10) : 0;
            });
            let maxVersion = Math.max(...versionNumbers);
            // Create the new title with the incremented version number
            newTitle = `${baseTitle} - ${maxVersion + 1}`;
        }

        // Add the new prompt to the beginning of the prompts array
        prompts.unshift({ title: newTitle, text: text, saved: datetime });

        // Save the updated array of prompts
        chrome.storage.local.set({prompts: prompts}, function() {
            document.getElementById('prompt-title').value = newTitle;
            document.getElementById('prompt-text').value = '';
            displayPrompts();
            updateCurrentTextStats();
            updateTotalStorageUsed();
        });
    });
});






// Function to display prompts in the list
function displayPrompts() {
    chrome.storage.local.get({prompts: []}, function(data) {
        let prompts = data.prompts;
        let promptListElement = document.getElementById('prompt-list');
        promptListElement.innerHTML = '';

        prompts.forEach(function(prompt, index) {
            let entry = document.createElement('div');
            entry.className = 'prompt-entry';

            let titleSpan = document.createElement('span');
            titleSpan.textContent = prompt.title;
            entry.appendChild(titleSpan);

            let dateSpan = document.createElement('span');
            dateSpan.textContent = new Date(prompt.saved).toLocaleString();
            dateSpan.className = 'date-stamp';
            entry.appendChild(dateSpan);

            entry.addEventListener('click', function() {
                currentPromptIndex = index; // Update the current index
                document.getElementById('prompt-title').value = prompt.title;
                document.getElementById('prompt-text').value = prompt.text;
                updateCurrentTextStats(prompt.title.split(' - ')[0]); // Update stats based on the base title
            });

            promptListElement.appendChild(entry);
        });

        if(prompts.length > 0) {
            // Select the first prompt by default
            promptListElement.firstChild.click();
        } else {
            // No prompts to display, clear the stats
            clearStats();
        }
    });
}

// Function to clear the stats
function clearStats() {
    document.getElementById('word-count').textContent = 'Words: 0';
    document.getElementById('version-count').textContent = 'Versions: 0';
    updateTotalStorageUsed(); // Update the storage usage
}

// Function to update the stats for the selected prompt
function updateCurrentTextStats(baseTitle) {
    let currentText = document.getElementById('prompt-text').value;
    let wordCount = currentText.split(/\s+/).filter(Boolean).length;
    document.getElementById('word-count').textContent = 'Words: ' + wordCount;

    // Get the version count for the base title
    chrome.storage.local.get({prompts: []}, function(data) {
        let versionCount = data.prompts.filter(prompt => prompt.title.startsWith(baseTitle)).length;
        document.getElementById('version-count').textContent = 'Versions: ' + versionCount;
        updateTotalStorageUsed();
    });
}

document.getElementById('delete-prompt-button').addEventListener('click', function() {
    // Retrieve the title of the prompt that is currently being displayed.
    let titleToDelete = document.getElementById('prompt-title').value;

    // Get the existing prompts from storage.
    chrome.storage.local.get({prompts: []}, function(data) {
        let prompts = data.prompts;
        
        // Find the index of the prompt with the matching title.
        let indexToDelete = prompts.findIndex(prompt => prompt.title === titleToDelete);

        // If the prompt is found, delete it.
        if (indexToDelete !== -1) {
            prompts.splice(indexToDelete, 1);
            
            // Save the updated prompts list back to storage.
            chrome.storage.local.set({prompts: prompts}, function() {
                // Clear the input fields and reset the current prompt index.
                document.getElementById('prompt-title').value = '';
                document.getElementById('prompt-text').value = '';
                
                // Refresh the display of prompts.
                displayPrompts();
            });
        } else {
            // If no prompt is selected or the prompt was not found, alert the user.
            alert('No prompt selected to delete or prompt not found.');
        }
    });
});




function updateTotalStorageUsed() {
    chrome.storage.local.getBytesInUse(null, function(bytesInUse) {
        let sizeInKB = bytesInUse / 1024;
        document.getElementById('storage-used').textContent = 'Total Storage: ' + sizeInKB.toFixed(2) + ' KB';
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

document.getElementById('toggle-tunables').addEventListener('click', function() {
    let tunablesDiv = document.getElementById('tunables');
    let toggleButton = document.getElementById('toggle-tunables');
    
    if (tunablesDiv.style.display === "none") {
        tunablesDiv.style.display = "block";
        toggleButton.textContent = "Less";  // Change the button text to "Less"
    } else {
        tunablesDiv.style.display = "none";
        toggleButton.textContent = "More";  // Change back the button text to "More"
    }
});


document.getElementById('import-prompts').addEventListener('click', function() {
    document.getElementById('import-file').click(); // Triggers the file selection
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

        // Create a temporary anchor element and trigger a download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        alert(`Export: Your Prompt Exporting will start shortly. If it does not, please check your browser settings.`);
    });
});

document.getElementById('new-prompt-button').addEventListener('click', function() {
    document.getElementById('prompt-title').value = ''; // Clear the title input
    document.getElementById('prompt-text').value = '';  // Clear the text area
    currentPromptIndex = null; // Reset the current prompt index
    // Optionally, you can also clear the stats if you have functionality to display stats for the current prompt
    updateCurrentTextStats();
});
