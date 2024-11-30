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
          // Do not use alert here; send the error message back
          sendResponse({ status: 'failure', message: 'Please focus an input field or contentEditable element to paste the prompt.' });
      }
  }
  return true; // Will respond asynchronously.
});

// contentScript.js

// Inject the `injectedScript.js` into the page
(function () {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injectedScript.js');
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
})();

// Generate a unique ID for each request
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15);
}

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'rewritePrompt') {
    const requestId = generateRequestId();

    // Listen for the response from the injected script
    function handleMessage(event) {
      if (event.source !== window) return;
      const data = event.data;
      if (data && data.action === 'rewritePromptResponse' && data.requestId === requestId) {
        window.removeEventListener('message', handleMessage);

        if (data.error) {
          sendResponse({ status: 'error', error: data.error });
        } else {
          sendResponse({ status: 'success', rewrittenPrompt: data.rewrittenPrompt });
        }
      }
    }

    window.addEventListener('message', handleMessage);

    // Send the prompt to the injected script
    window.postMessage(
      {
        action: 'rewritePrompt',
        prompt: message.prompt,
        requestId: requestId,
      },
      '*'
    );

    // Indicate that we will respond asynchronously
    return true;
  }
});

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
      // Do not use alert here; send the error message back
      sendResponse({ status: 'failure', message: 'Please focus an input field or contentEditable element to paste the prompt.' });
    }
  }
  return true; // Will respond asynchronously.
});