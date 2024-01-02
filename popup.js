document.getElementById('save-button').addEventListener('click', function() {
    let title = document.getElementById('prompt-title').value;
    let text = document.getElementById('prompt-text').value;

    // Check if both title and text are not empty
    if (title.trim() === '' || text.trim() === '') {
        alert('Please enter both a title and some text for the prompt.');
        return;
    }

    // Retrieve the existing prompts (if any)
    chrome.storage.local.get({prompts: []}, function(data) {
        let prompts = data.prompts;
        prompts.push({ title: title, text: text });

        // Save the updated prompts array
        chrome.storage.local.set({prompts: prompts}, function() {
            console.log('Prompt saved.');
            // Clear the input fields
            document.getElementById('prompt-title').value = '';
            document.getElementById('prompt-text').value = '';
            // Update the display
            displayPrompts();
        });
    });
});

function displayPrompts() {
    chrome.storage.local.get({prompts: []}, function(data) {
        let prompts = data.prompts;
        let promptListElement = document.getElementById('prompt-list');
        promptListElement.innerHTML = ''; // Clear existing list

        prompts.forEach(function(prompt) {
            let entry = document.createElement('div');
            entry.className = 'prompt-entry';
            entry.textContent = prompt.title;
            entry.addEventListener('click', function() {
                document.getElementById('prompt-title').value = prompt.title;
                document.getElementById('prompt-text').value = prompt.text;
            });
            promptListElement.appendChild(entry);
        });
    });
}

// Load data when the document is loaded
document.addEventListener('DOMContentLoaded', displayPrompts);
