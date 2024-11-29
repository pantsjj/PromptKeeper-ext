// contentScript.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "pastePrompt" && request.text) {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName.toLowerCase() === 'input' || activeElement.tagName.toLowerCase() === 'textarea')) {
          activeElement.value = request.text;
          // Trigger input event in case the website uses it to detect input
          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
          sendResponse({ status: 'success' });
      } else if (activeElement && activeElement.isContentEditable) {
          // Insert text at the current cursor position in a contentEditable element
          document.execCommand('insertText', false, request.text);
          sendResponse({ status: 'success' });
      } else {
          alert('Please focus an input field or contentEditable element to paste the prompt.');
          sendResponse({ status: 'failure', message: 'No editable element focused.' });
      }
  }
  return true; // Will respond asynchronously.
});