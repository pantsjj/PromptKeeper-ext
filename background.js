/**
 * Background Service Worker
 * Manages the AI bridge tab for AI operations
 * Enables Side Panel for right-docked prompt access
 */

let aiBridgeTabId = null;

// Create AI bridge tab on extension startup
chrome.runtime.onStartup.addListener(setupAIBridge);
chrome.runtime.onInstalled.addListener(() => {
  setupAIBridge();
  // Enable side panel to open when clicking extension icon
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => { });
  }
});

async function setupAIBridge() {
  console.log('[Background] Setting up AI bridge tab');

  // Check if tab already exists
  if (aiBridgeTabId) {
    try {
      await chrome.tabs.get(aiBridgeTabId);
      console.log('[Background] AI bridge tab already exists');
      return;
    } catch {
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
      } catch {
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

// Auto-backup alarm listener (5-minute interval)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'auto-backup') {
    console.log('[Background] Auto-backup triggered');

    try {
      const { driveConnected, autoSyncEnabled } = await chrome.storage.local.get(['driveConnected', 'autoSyncEnabled']);

      if (!driveConnected || !autoSyncEnabled) {
        console.log('[Background] Auto-backup skipped: not connected or disabled');
        return;
      }

      // Import services dynamically for background context
      const { prompts } = await chrome.storage.local.get(['prompts']);
      const { projects } = await chrome.storage.local.get(['projects']);

      if (!prompts || prompts.length === 0) {
        console.log('[Background] Auto-backup skipped: no prompts');
        return;
      }

      // Get auth token and backup
      chrome.identity.getAuthToken({ interactive: false }, async (token) => {
        if (!token || chrome.runtime.lastError) {
          console.log('[Background] Auto-backup skipped: no valid token');
          return;
        }

        // Perform backup via fetch API
        const backupData = {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          prompts: prompts || [],
          projects: projects || []
        };

        const BACKUP_FILENAME = 'promptkeeper_backup.json';

        // Find existing file
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}'&spaces=drive&fields=files(id)`;
        const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
        const searchData = await searchRes.json();
        const fileId = searchData.files?.[0]?.id;

        // Upload
        const boundary = '-------314159265358979323846';
        const metadata = { name: BACKUP_FILENAME, mimeType: 'application/json' };
        const body = `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(backupData)}\r\n--${boundary}--`;

        const uploadUrl = fileId
          ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
          : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

        const uploadRes = await fetch(uploadUrl, {
          method: fileId ? 'PATCH' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: body
        });

        if (uploadRes.ok) {
          await chrome.storage.local.set({ lastBackupTime: backupData.timestamp });
          console.log('[Background] Auto-backup completed at', backupData.timestamp);
        } else {
          console.error('[Background] Auto-backup failed:', uploadRes.statusText);
        }
      });
    } catch (err) {
      console.error('[Background] Auto-backup error:', err);
    }
  }
});