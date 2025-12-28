# Phase 5: Google Drive Backup & Sync

**Status**: 🔜 Planned  
**Priority**: High  
**Estimated Effort**: 2-3 weeks  
**Target Version**: v2.1 or v3.0

## Overview

Enable users to backup and restore their prompts to their Google account, allowing seamless access across multiple devices (work laptop ↔ home computer).

## Problem Statement

**Current Limitation**: 
- Prompts are stored in `chrome.storage.local`, which is device-specific
- Users cannot access their prompt library on a different machine
- Manual export/import is cumbersome for regular cross-device workflows

**User Need**:
> "I want to sign in with my Google account and have my prompts automatically backed up to my Google Drive, so I can access them from any device."

## Goals

1. **Automatic Backup**: Prompts sync to user's Google Drive on every save
2. **Cross-Device Access**: Sign in on any device to restore prompt library
3. **Privacy Preserved**: Data stored in user's own Google Drive (not our servers)
4. **Conflict Resolution**: Handle edits made on multiple devices gracefully
5. **Optional Feature**: Users can opt-out and stay local-only

---

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────┐
│  PromptKeeper Extension                         │
│                                                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │ StorageService│─────▶│  SyncService │        │
│  └──────────────┘      └──────┬───────┘        │
│                                │                 │
│                                │ Chrome Identity │
│                                │ API             │
└────────────────────────────────┼─────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Google Drive API      │
                    │  (AppData Folder)      │
                    │                        │
                    │  /appDataFolder/       │
                    │    prompts.json        │
                    │    metadata.json       │
                    └────────────────────────┘
```

### Data Flow

1. **Initial Sign-In**:
   - User clicks "Sign in with Google"
   - `chrome.identity.getAuthToken()` → OAuth flow
   - Check Drive for existing `prompts.json`
   - If exists: Merge with local data
   - If not: Upload current local data

2. **Auto-Sync on Save**:
   - User saves/updates a prompt
   - `StorageService.updatePrompt()` triggers
   - `SyncService.syncToDrive()` uploads updated JSON
   - Background sync every 5 minutes (if changes detected)

3. **Conflict Resolution**:
   - Compare `lastModified` timestamps
   - Strategy: **Last Write Wins** (with user notification)
   - Future: Show diff UI and let user choose

---

## Implementation Plan

### Task 5.1: Manifest & Permissions

**File**: [`manifest.json`](file:///Users/jp/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/workspaces/PromptKeeper-ext/manifest.json)

Add OAuth and Identity permissions:

```json
{
  "permissions": [
    "activeTab",
    "storage",
    "scripting",
    "identity",
    "identity.email"
  ],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/drive.appdata"
    ]
  }
}
```

**Setup Steps**:
1. Create OAuth 2.0 Client ID in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Drive API
3. Configure authorized origins (Chrome Extension ID)

---

### Task 5.2: Create SyncService

**New File**: `services/SyncService.js`

**Responsibilities**:
- Authenticate with Google (Chrome Identity API)
- Upload/download JSON to Drive AppData folder
- Handle sync conflicts
- Manage sync state (last sync time, pending changes)

**Key Methods**:

```javascript
class SyncService {
  async signIn() {
    // Use chrome.identity.getAuthToken()
    // Return user email and auth token
  }

  async signOut() {
    // Revoke token, clear local auth state
  }

  async uploadToDrive(data) {
    // POST to Drive API: /upload/drive/v3/files
    // Use multipart upload for JSON
  }

  async downloadFromDrive() {
    // GET from Drive API: /drive/v3/files?spaces=appDataFolder
    // Parse and return prompts JSON
  }

  async syncNow() {
    // Compare local vs Drive timestamps
    // Merge or overwrite based on strategy
  }

  async enableAutoSync(intervalMinutes = 5) {
    // Set up background sync timer
  }
}
```

**Dependencies**:
- Chrome Identity API: `chrome.identity.getAuthToken()`
- Google Drive API v3: `https://www.googleapis.com/drive/v3/`

---

### Task 5.3: UI Changes

#### Options Page (Full Editor)

**Location**: [`options.html`](file:///Users/jp/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/workspaces/PromptKeeper-ext/options.html)

Add sync panel to right sidebar:

```html
<div class="panel-section">
  <h3>Google Drive Sync</h3>
  
  <!-- Signed Out State -->
  <div id="sync-signed-out">
    <button id="google-signin-btn" class="primary-btn">
      Sign in with Google
    </button>
    <p style="font-size:11px; color:var(--text-secondary);">
      Backup prompts to your Google Drive
    </p>
  </div>

  <!-- Signed In State -->
  <div id="sync-signed-in" class="hidden">
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="color:var(--primary-color);">✓</span>
      <span id="user-email" style="font-size:12px;"></span>
    </div>
    <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">
      Last sync: <span id="last-sync-time">Never</span>
    </div>
    <div style="display:flex; gap:8px; margin-top:8px;">
      <button id="sync-now-btn" class="secondary-btn">Sync Now</button>
      <button id="google-signout-btn" class="secondary-btn">Sign Out</button>
    </div>
  </div>
</div>
```

#### Popup (Quick Access)

**Location**: [`popup.html`](file:///Users/jp/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/workspaces/PromptKeeper-ext/popup.html)

Add sync status indicator to footer:

```html
<footer id="stats">
  <div style="display:flex; gap:12px;">
    <!-- Existing stats -->
    <span id="sync-status" title="Google Drive Sync">
      <span class="sync-icon">☁️</span>
      <span id="sync-label">Local Only</span>
    </span>
  </div>
</footer>
```

---

### Task 5.4: StorageService Integration

**File**: [`services/StorageService.js`](file:///Users/jp/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/workspaces/PromptKeeper-ext/services/StorageService.js)

Modify save methods to trigger sync:

```javascript
async updatePrompt(id, newContent) {
  // ... existing logic ...
  await this.saveAllPrompts(prompts);
  
  // NEW: Trigger sync if enabled
  if (SyncService.isEnabled()) {
    await SyncService.queueSync(); // Debounced upload
  }
  
  return prompt;
}
```

---

### Task 5.5: Conflict Resolution Strategy

**Scenario**: User edits prompts on Device A, then Device B (offline), then syncs.

**Strategy Options**:

1. **Last Write Wins** (Simple, v2.1):
   - Compare `updatedAt` timestamps
   - Newer version overwrites older
   - Show notification: "Synced from Drive (3 prompts updated)"

2. **Manual Merge** (Advanced, v3.0):
   - Detect conflicts (same prompt ID, different content)
   - Show diff UI: "Local version" vs "Drive version"
   - User chooses which to keep

**Implementation (v2.1)**:

```javascript
async syncNow() {
  const localPrompts = await StorageService.getPrompts();
  const drivePrompts = await this.downloadFromDrive();
  
  const merged = this._mergePrompts(localPrompts, drivePrompts);
  
  await StorageService.saveAllPrompts(merged);
  await this.uploadToDrive(merged);
}

_mergePrompts(local, remote) {
  const byId = new Map();
  
  // Add all prompts, preferring newer updatedAt
  [...local, ...remote].forEach(p => {
    const existing = byId.get(p.id);
    if (!existing || p.updatedAt > existing.updatedAt) {
      byId.set(p.id, p);
    }
  });
  
  return Array.from(byId.values());
}
```

---

### Task 5.6: Security & Privacy

**Considerations**:

1. **Scope Limitation**: Use `drive.appdata` scope (not full Drive access)
   - Data stored in hidden AppData folder
   - User cannot accidentally delete via Drive UI
   - Only this extension can access the folder

2. **Token Management**:
   - Use `chrome.identity.getAuthToken({ interactive: false })` for background sync
   - Handle token expiration gracefully
   - Clear token on sign-out

3. **Data Encryption** (Optional, v3.0):
   - Encrypt JSON before upload using user's passphrase
   - Adds extra privacy layer (even from Google)

---

## Testing Plan

### Unit Tests

**New File**: `tests/SyncService.test.js`

```javascript
describe('SyncService', () => {
  test('merges local and remote prompts correctly', () => {
    const local = [{ id: '1', updatedAt: 100 }];
    const remote = [{ id: '1', updatedAt: 200 }];
    const merged = SyncService._mergePrompts(local, remote);
    expect(merged[0].updatedAt).toBe(200); // Remote is newer
  });

  test('handles sign-in flow', async () => {
    // Mock chrome.identity.getAuthToken
    const user = await SyncService.signIn();
    expect(user.email).toBeDefined();
  });
});
```

### Manual Testing Checklist

- [ ] Sign in with Google account
- [ ] Create prompt on Device A → Verify uploaded to Drive
- [ ] Sign in on Device B → Verify prompts downloaded
- [ ] Edit prompt on Device B → Sync → Check Device A updates
- [ ] Test offline mode (graceful degradation)
- [ ] Sign out → Verify local data remains intact

---

## User Experience Flow

### First-Time Setup

1. User opens Options page
2. Sees "Sign in with Google" button in sync panel
3. Clicks → OAuth consent screen appears
4. Grants permission → Returns to extension
5. Extension uploads current prompts to Drive
6. Shows: "✓ Synced 12 prompts to Google Drive"

### Daily Usage

1. User edits prompts throughout the day
2. Auto-sync runs every 5 minutes in background
3. Footer shows: "☁️ Synced 2 min ago"
4. On new device: Sign in → Prompts auto-restore

### Opt-Out

1. User clicks "Sign Out"
2. Confirmation: "Your prompts will remain on this device. Continue?"
3. Revokes token, disables auto-sync
4. Extension continues working in local-only mode

---

## Success Metrics

- **Adoption Rate**: % of users who enable sync within 7 days
- **Sync Reliability**: % of successful sync operations (target: >99%)
- **Cross-Device Usage**: % of users signed in on 2+ devices
- **Support Tickets**: Reduction in "lost prompts" complaints

---

## Rollout Plan

### Phase 5a: MVP (v2.1)
- ✅ Basic sign-in/sign-out
- ✅ Manual "Sync Now" button
- ✅ Last Write Wins conflict resolution
- ✅ Auto-sync every 5 minutes

### Phase 5b: Enhanced (v2.2)
- ✅ Sync status notifications
- ✅ Bandwidth optimization (delta sync)
- ✅ Offline queue (sync when back online)

### Phase 5c: Advanced (v3.0)
- ✅ Manual conflict resolution UI
- ✅ End-to-end encryption option
- ✅ Sync history/audit log

---

## Dependencies

**External APIs**:
- Google Drive API v3
- Chrome Identity API

**Google Cloud Setup**:
1. Create project in Google Cloud Console
2. Enable Drive API
3. Create OAuth 2.0 credentials
4. Add Chrome Web Store item ID to authorized origins

**Estimated Setup Time**: 1-2 hours

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth setup complexity | High | Provide detailed setup guide with screenshots |
| Sync conflicts lose data | Critical | Implement backup before merge, allow rollback |
| Drive API quota limits | Medium | Cache aggressively, use delta sync |
| User confusion (2 data sources) | Medium | Clear UI indicating sync status |

---

## Future Enhancements

- **Selective Sync**: Choose which projects to sync
- **Collaboration**: Share prompts with team members
- **Version History in Drive**: Leverage Drive's revision history
- **Multi-Cloud**: Support Dropbox, OneDrive

---

## References

- [Chrome Identity API Documentation](https://developer.chrome.com/docs/extensions/reference/identity/)
- [Google Drive API v3 Guide](https://developers.google.com/drive/api/v3/about-sdk)
- [AppData Folder Best Practices](https://developers.google.com/drive/api/guides/appdata)
