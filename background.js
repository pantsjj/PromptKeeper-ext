/**
 * Background Service Worker
 * Manages the AI bridge tab for AI operations
 * Enables Side Panel for right-docked prompt access
 */

const OFFSCREEN_PATH = 'offscreen.html';

async function setupAIBridge() {
  console.log('[Background] Setting up AI bridge via Offscreen API');

  // Check if an offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_PATH)]
  });

  if (existingContexts.length > 0) {
    console.log('[Background] Offscreen document already exists');
    return;
  }

  // Create the offscreen document
  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_PATH,
      reasons: ['DOM_SCRAPING'], // Valid reason for accessing window/DOM APIs
      justification: 'Hosting Gemini Nano AI processing for PromptKeeper'
    });
    console.log('[Background] Offscreen document created successfully');
  } catch (err) {
    console.error('[Background] Failed to create offscreen document:', err);
  }
}

// Since offscreen docs don't have tab IDs like tabs, we adjust message passing 
// Enable Side Panel to open on action click
async function enableSidePanelOnClick() {
  if (chrome.sidePanel) {
    try {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
      console.log('[Background] Side panel opens on action click enabled');
    } catch (err) {
      console.log('[Background] SidePanel behavior error (ignorable):', err);
    }
  }
}

// Initial setup
chrome.runtime.onStartup.addListener(() => {
  setupAIBridge();
  enableSidePanelOnClick();
});

chrome.runtime.onInstalled.addListener(() => {
  setupAIBridge();
  enableSidePanelOnClick();
});

// Also ensure side panel is enabled immediately when service worker starts
enableSidePanelOnClick();

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-sidepanel') {
    // Get the current tab to open side panel
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && chrome.sidePanel) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
  }
});

// We no longer need 'getAIBridgeTabId' because we will use runtime.sendMessage
// But we should keep a listener to re-init if requested
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'reinitializeAIBridge') {
    console.log('[Background] Re-creating offscreen document...');
    chrome.offscreen.closeDocument()
      .catch(() => { }) // Ignore if none exists
      .then(() => setupAIBridge())
      .then(() => sendResponse({ success: true }));
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

        try {
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
        } catch (netErr) {
          console.warn('[Background] Auto-backup network error:', netErr.message);
        }
      });
    } catch (err) {
      console.error('[Background] Auto-backup error:', err);
    }
  }
});