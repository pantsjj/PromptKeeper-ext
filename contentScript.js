// contentScript.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "pastePrompt" && request.text) {
      const activeElement = document.activeElement;
      if (activeElement.tagName.toLowerCase() === 'input' || activeElement.tagName.toLowerCase() === 'textarea') {
        activeElement.value = request.text;
        // Trigger change event in case the website uses it to detect input
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (activeElement.isContentEditable) {
        // Insert text at the current cursor position in a contentEditable element
        document.execCommand('insertText', false, request.text);
      }
      sendResponse({status: 'success'});
    }
    return true;  // Will respond asynchronously.
  });
  

