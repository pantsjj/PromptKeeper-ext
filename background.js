/**
 * Background Service Worker
 * Manages the AI bridge tab for AI operations
 */

let aiBridgeTabId = null;

// Create AI bridge tab on extension startup
chrome.runtime.onStartup.addListener(setupAIBridge);
chrome.runtime.onInstalled.addListener(setupAIBridge);

async function setupAIBridge() {
  console.log('[Background] Setting up AI bridge tab');

  // Check if tab already exists
  if (aiBridgeTabId) {
    try {
      await chrome.tabs.get(aiBridgeTabId);
      console.log('[Background] AI bridge tab already exists');
      return;
    } catch (_e) {
      // Tab doesn't exist, create new one
      aiBridgeTabId = null;
    }
  }

  // Create hidden tab
  try {
    const tab = await chrome.tabs.create({
      url: chrome.runtime.getURL('ai-bridge.html'),
      active: false,
      pinned: true
    });

    aiBridgeTabId = tab.id;
    console.log('[Background] AI bridge tab created:', aiBridgeTabId);

    // Try to minimize/hide the tab
    setTimeout(async () => {
      try {
        await chrome.tabs.update(aiBridgeTabId, { active: false });
      } catch (_e) {
        // Ignore errors
      }
    }, 500);
  } catch (err) {
    console.error('[Background] Failed to create AI bridge tab:', err);
  }
}

// Clean up if tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === aiBridgeTabId) {
    console.log('[Background] AI bridge tab closed, will recreate');
    aiBridgeTabId = null;
    setupAIBridge();
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getAIBridgeTabId') {
    console.log('[Background] Tab ID requested, current ID:', aiBridgeTabId);

    // Ensure tab exists and is ready before responding
    if (!aiBridgeTabId) {
      console.log('[Background] Tab not ready, creating now...');
      setupAIBridge().then(() => {
        // Wait a bit for tab to fully load
        setTimeout(() => {
          console.log('[Background] Tab created, sending ID:', aiBridgeTabId);
          sendResponse({ tabId: aiBridgeTabId });
        }, 1000); // Give tab time to load
      }).catch((err) => {
        console.error('[Background] Failed to create tab:', err);
        sendResponse({ tabId: null });
      });
    } else {
      // Verify tab still exists
      chrome.tabs.get(aiBridgeTabId).then(() => {
        console.log('[Background] Tab verified, sending ID:', aiBridgeTabId);
        sendResponse({ tabId: aiBridgeTabId });
      }).catch(() => {
        console.log('[Background] Tab lost, recreating...');
        aiBridgeTabId = null;
        setupAIBridge().then(() => {
          setTimeout(() => {
            sendResponse({ tabId: aiBridgeTabId });
          }, 1000);
        });
      });
    }
    return true; // Async response
  }

  if (request.action === 'reinitializeAIBridge') {
    console.log('[Background] Reinitialization requested');
    // Close existing if any
    if (aiBridgeTabId) {
      chrome.tabs.remove(aiBridgeTabId).catch(() => { });
      aiBridgeTabId = null;
    }
    setupAIBridge().then(() => {
      sendResponse({ success: true, tabId: aiBridgeTabId });
    });
    return true;
  }
});