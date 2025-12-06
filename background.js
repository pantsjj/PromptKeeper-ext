// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("PromptKeeper Installed");
});

// Keep alive?
chrome.runtime.onMessage.addListener((_message, _sender, _sendResponse) => {
    // Dummy listener
});