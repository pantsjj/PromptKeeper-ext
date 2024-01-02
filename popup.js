document.getElementById('save-button').addEventListener('click', function() {
    let title = document.getElementById('prompt-title').value;
    let text = document.getElementById('prompt-text').value;

    // Save the title and text to storage
    chrome.storage.local.set({'title': title, 'text': text}, function() {
        console.log('Prompt is saved.');
    });
});

// Function to load saved data
function loadData() {
    chrome.storage.local.get(['title', 'text'], function(result) {
        if (result.title && result.text) {
            document.getElementById('prompt-title').value = result.title;
            document.getElementById('prompt-text').value = result.text;
        }
    });
}

// Load data when the document is loaded
document.addEventListener('DOMContentLoaded', loadData);
