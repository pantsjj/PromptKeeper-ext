// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log("PromptKeeper Installed");
});

// Keep alive?
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Dummy listener
});