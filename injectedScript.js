// injectedScript.js

// Listen for messages from the content script
window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
  
    const message = event.data;
    if (message && message.action === 'rewritePrompt') {
      try {
        // Create a new text session
        const session = await window.ai.createTextSession();
  
        // Use the Rewriter API to rewrite the prompt
        const rewrittenPrompt = await session.rewrite(message.prompt);
  
        // Send the rewritten prompt back to the content script
        window.postMessage(
          {
            action: 'rewritePromptResponse',
            rewrittenPrompt: rewrittenPrompt,
            requestId: message.requestId,
          },
          '*'
        );
      } catch (error) {
        // Send error message back
        window.postMessage(
          {
            action: 'rewritePromptResponse',
            error: error.message,
            requestId: message.requestId,
          },
          '*'
        );
      }
    }
  });