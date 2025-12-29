# Google Drive Backup & Restore - Implementation Guide
**Feature**: Manual Backup/Restore Prompts to Google Drive  
**Complexity**: Medium  
**Total Time**: 6-8 hours (2 hours manual setup + 4-6 hours coding)

---

## 🎯 What This Feature Does

**User Experience**:
1. User clicks **"Backup to Google Drive"** → Signs in with Google → Prompts uploaded as `promptkeeper_backup.json`
2. User clicks **"Restore from Google Drive"** → Downloads backup → Prompts merged into local library
3. **Optional**: Toggle "Auto-sync every 30 minutes" for automated backups

---

## 📋 Implementation Phases

### ✅ **Phase A: Manual Setup** (You must complete these steps)
**Time**: 1-2 hours  
**Required**: OAuth credentials from Google Cloud Console

### 🛠️ **Phase B: Code Implementation** (I will implement)
**Time**: 4-6 hours  
**Files**: New `GoogleDriveService.js` + UI updates

---

# 🔧 PHASE A: Manual Setup (YOU)

## Step 1: Create Google Cloud Project
**Time**: 15 minutes  
**Portal**: [Google Cloud Console](https://console.cloud.google.com/)

### Actions:
1. **Create New Project**:
   - Go to: https://console.cloud.google.com/projectcreate
   - Project Name: `PromptKeeper Extension`
   - Click **Create**

2. **Enable Google Drive API**:
   - Navigate to: **APIs & Services** → **Library**
   - Search: "Google Drive API"
   - Click **Enable**

---

## Step 2: Configure OAuth Consent Screen
**Time**: 10 minutes

### Actions:
1. Go to: **APIs & Services** → **OAuth consent screen**
2. Select: **External** (unless you have Google Workspace)
3. Fill in required fields:
   - **App name**: `PromptKeeper`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. **Scopes**: Click "Add or Remove Scopes"
   - Search and add: `https://www.googleapis.com/auth/drive.file`
   - This scope only allows access to files created by the app (secure)
5. **Test Users** (if not published):
   - Add your Gmail address
   - Add any beta testers' emails
6. Click **Save and Continue** through all steps

---

## Step 3: Create OAuth 2.0 Credentials
**Time**: 10 minutes  
**⚠️ CRITICAL**: You need your Chrome Extension ID first!

### Get Your Extension ID:
1. Load your extension in Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Find your extension and copy the **ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

### Create Credentials:
1. Go to: **APIs & Services** → **Credentials**
2. Click: **+ Create Credentials** → **OAuth Client ID**
3. Application type: **Chrome Extension**
4. Name: `PromptKeeper Chrome Extension`
5. **Item ID**: Paste your Extension ID (from chrome://extensions)
6. Click **Create**
7. **COPY THE CLIENT ID** → You'll need this for `manifest.json`
   - Format: `123456789-abc123def456.apps.googleusercontent.com`

---

## Step 4: Update Extension Manifest
**Time**: 5 minutes  
**File**: `manifest.json`

### YOU MUST ADD:
```json
{
  "permissions": [
    "storage",
    "identity",          // NEW: Required for OAuth
    "tabs"
  ],
  "oauth2": {            // NEW: OAuth configuration
    "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/drive.file"
    ]
  },
  "host_permissions": [  // NEW: Allow Drive API calls
    "https://www.googleapis.com/*"
  ]
}
```

**⚠️ REPLACE**: `YOUR_CLIENT_ID_HERE` with the Client ID from Step 3

---

## Step 5: Publish Extension (Optional but Recommended)
**Time**: 30 minutes  
**Why**: Chrome Identity API works best with published extensions

### Options:

#### Option A: Publish to Chrome Web Store (Public)
- Full OAuth capabilities
- No test user limitations
- Requires $5 one-time developer fee
- Guide: https://developer.chrome.com/docs/webstore/publish/

#### Option B: Keep Unpublished (Testing)
- Works, but limited to test users (Step 2)
- Must add each user's email to OAuth consent screen
- No developer fee

**Recommendation**: Start with Option B, publish later when ready

---

# 💻 PHASE B: Code Implementation (ME)

## Part 1: Create GoogleDriveService
**File**: `services/GoogleDriveService.js` (NEW)  
**Time**: 3-4 hours

### What I'll Build:

```javascript
class GoogleDriveService {
  
  /**
   * Authenticate user with Google
   */
  async authenticate() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
  }

  /**
   * Upload prompts to Google Drive
   */
  async backupToDrive(prompts) {
    const token = await this.authenticate();
    
    // 1. Check if backup file exists
    const fileId = await this.findBackupFile(token);
    
    // 2. Create or update file
    const metadata = {
      name: 'promptkeeper_backup.json',
      mimeType: 'application/json'
    };
    
    const blob = new Blob([JSON.stringify(prompts, null, 2)], 
      { type: 'application/json' });
    
    const formData = new FormData();
    formData.append('metadata', 
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);
    
    const url = fileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    
    const response = await fetch(url, {
      method: fileId ? 'PATCH' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    
    return response.json();
  }

  /**
   * Download prompts from Google Drive
   */
  async restoreFromDrive() {
    const token = await this.authenticate();
    const fileId = await this.findBackupFile(token);
    
    if (!fileId) {
      throw new Error('No backup found on Google Drive');
    }
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.json(); // Returns prompts array
  }

  /**
   * Find backup file in Drive
   */
  async findBackupFile(token) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='promptkeeper_backup.json'&spaces=drive`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { files } = await response.json();
    return files.length > 0 ? files[0].id : null;
  }

  /**
   * Sign out and revoke token
   */
  async signOut() {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (token) {
          chrome.identity.removeCachedAuthToken({ token }, () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }
}

export default new GoogleDriveService();
```

---

## Part 2: Update Options UI
**File**: `options.html`  
**Time**: 30 minutes

### Add to Right Sidebar (after AI Tools):

```html
<!-- Cloud Backup Section -->
<div class="panel-section">
    <div class="cloud-backup-card">
        <h3>☁️ Google Drive Backup</h3>
        
        <!-- Not Signed In -->
        <div id="drive-signed-out">
            <p style="font-size:11px; color:var(--text-secondary); margin-bottom:12px;">
                Backup your prompts to Google Drive for safe keeping and cross-device access.
            </p>
            <button id="google-signin-btn" class="primary-btn" style="width:100%;">
                Sign in with Google
            </button>
        </div>

        <!-- Signed In -->
        <div id="drive-signed-in" class="hidden">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                <span style="color:var(--primary-color);">✓</span>
                <span id="user-email" style="font-size:12px;"></span>
            </div>
            
            <div style="display:grid; gap:8px;">
                <button id="backup-btn" class="secondary-btn">
                    📤 Backup Now
                </button>
                <button id="restore-btn" class="secondary-btn">
                    📥 Restore from Drive
                </button>
            </div>

            <div style="font-size:10px; color:var(--text-secondary); margin-top:8px;">
                Last backup: <span id="last-backup-time">Never</span>
            </div>

            <label style="display:flex; align-items:center; gap:8px; margin-top:12px; font-size:12px;">
                <input type="checkbox" id="auto-sync-checkbox">
                Auto-backup every 30 minutes
            </label>

            <button id="google-signout-btn" class="secondary-btn" style="width:100%; margin-top:12px; font-size:11px;">
                Sign Out
            </button>
        </div>
    </div>
</div>
```

### Add Styling:

```css
.cloud-backup-card {
    background: var(--editor-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: 16px;
}
```

---

## Part 3: Update Options Logic
**File**: `options.js`  
**Time**: 2 hours

### Add Event Listeners:

```javascript
import GoogleDriveService from './services/GoogleDriveService.js';

// Sign In
document.getElementById('google-signin-btn').addEventListener('click', async () => {
  try {
    await GoogleDriveService.authenticate();
    
    // Get user email
    const token = await chrome.identity.getAuthToken({ interactive: false });
    const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userInfo = await response.json();
    
    document.getElementById('user-email').textContent = userInfo.email;
    document.getElementById('drive-signed-out').classList.add('hidden');
    document.getElementById('drive-signed-in').classList.remove('hidden');
    
    // Store auth state
    await chrome.storage.local.set({ 
      driveConnected: true,
      userEmail: userInfo.email 
    });
    
  } catch (err) {
    alert('Sign in failed: ' + err.message);
  }
});

// Backup
document.getElementById('backup-btn').addEventListener('click', async () => {
  try {
    const prompts = await StorageService.getPrompts();
    await GoogleDriveService.backupToDrive(prompts);
    
    const now = new Date().toLocaleString();
    document.getElementById('last-backup-time').textContent = now;
    await chrome.storage.local.set({ lastBackupTime: now });
    
    alert(`✅ Backed up ${prompts.length} prompts to Google Drive!`);
  } catch (err) {
    alert('Backup failed: ' + err.message);
  }
});

// Restore
document.getElementById('restore-btn').addEventListener('click', async () => {
  if (!confirm('This will merge prompts from Google Drive with your local library. Continue?')) {
    return;
  }
  
  try {
    const drivePrompts = await GoogleDriveService.restoreFromDrive();
    const imported = await StorageService.importPrompts(drivePrompts);
    
    alert(`✅ Restored ${imported} prompts from Google Drive!`);
    await loadPrompts(); // Refresh UI
  } catch (err) {
    alert('Restore failed: ' + err.message);
  }
});

// Auto-Sync
document.getElementById('auto-sync-checkbox').addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  await chrome.storage.local.set({ autoSyncEnabled: enabled });
  
  if (enabled) {
    // Set alarm for every 30 minutes
    chrome.alarms.create('auto-backup', { periodInMinutes: 30 });
  } else {
    chrome.alarms.clear('auto-backup');
  }
});

// Sign Out
document.getElementById('google-signout-btn').addEventListener('click', async () => {
  if (!confirm('Sign out of Google Drive? Your local prompts will remain safe.')) {
    return;
  }
  
  await GoogleDriveService.signOut();
  document.getElementById('drive-signed-out').classList.remove('hidden');
  document.getElementById('drive-signed-in').classList.add('hidden');
  await chrome.storage.local.set({ driveConnected: false });
  
  // Clear auto-sync
  chrome.alarms.clear('auto-backup');
});
```

---

## Part 4: Background Auto-Sync
**File**: `background.js`  
**Time**: 30 minutes

### Add Alarm Listener:

```javascript
import GoogleDriveService from './services/GoogleDriveService.js';
import StorageService from './services/StorageService.js';

// Listen for auto-backup alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'auto-backup') {
    console.log('[Background] Running auto-backup to Google Drive...');
    
    try {
      const { driveConnected, autoSyncEnabled } = await chrome.storage.local.get([
        'driveConnected', 
        'autoSyncEnabled'
      ]);
      
      if (driveConnected && autoSyncEnabled) {
        const prompts = await StorageService.getPrompts();
        await GoogleDriveService.backupToDrive(prompts);
        
        const now = new Date().toLocaleString();
        await chrome.storage.local.set({ lastBackupTime: now });
        
        console.log('[Background] Auto-backup completed');
      }
    } catch (err) {
      console.error('[Background] Auto-backup failed:', err);
    }
  }
});
```

---

# 📊 Implementation Progress Tracker

## Manual Setup Checklist (YOU)
- [ ] Create Google Cloud project
- [ ] Enable Google Drive API
- [ ] Configure OAuth consent screen
- [ ] Add test users (if unpublished)
- [ ] Create OAuth 2.0 credentials
- [ ] Copy Client ID to `manifest.json`
- [ ] Add permissions to `manifest.json`
- [ ] Reload extension to apply manifest changes
- [ ] (Optional) Publish to Chrome Web Store

## Code Implementation Checklist (ME)
- [ ] Create `services/GoogleDriveService.js`
- [ ] Add backup/restore UI to `options.html`
- [ ] Add event listeners to `options.js`
- [ ] Add background auto-sync to `background.js`
- [ ] Test: Sign in with Google
- [ ] Test: Backup prompts
- [ ] Test: Restore prompts
- [ ] Test: Auto-sync toggle
- [ ] Add error handling
- [ ] Update documentation

---

# 🧪 Testing Plan

## You Must Test:
1. **OAuth Flow**: Does Google sign-in popup appear?
2. **First Backup**: Check Google Drive for `promptkeeper_backup.json`
3. **Restore**: Delete local data, restore from Drive
4. **Auto-Sync**: Wait 30 minutes, verify backup updated
5. **Sign Out**: Confirm local data remains

## Common Issues:

### "OAuth client not found"
- **Fix**: Double-check Client ID in `manifest.json`
- **Fix**: Ensure extension ID matches OAuth credentials

### "Access denied"
- **Fix**: Add your email to test users in OAuth consent screen
- **Fix**: Check scopes include `drive.file`

### "Token expired"
- **Fix**: Normal behavior, click "Backup" again to refresh

---

# 💰 Cost

**FREE** ✅
- Google Drive API: 1 billion requests/day (free tier)
- Chrome Extension: Free
- OAuth: Free

---

# 🚀 Go-Live Plan

1. **YOU**: Complete Phase A (Manual Setup) → Share Client ID with me
2. **ME**: Implement Phase B (Code)
3. **YOU**: Test on your account
4. **YOU**: Add beta testers to OAuth consent screen
5. **BOTH**: Fix any bugs
6. **YOU**: (Optional) Submit for Chrome Web Store review
7. **LAUNCH** 🎉

---

# 📞 What You Need to Give Me

Once you complete Phase A, send me:
1. ✅ **OAuth Client ID** (string starting with numbers)
2. ✅ Confirmation that you added it to `manifest.json`
3. ✅ Your test Gmail address (so I know it's approved)

Then I'll implement Phase B!

---

**Ready to start?** Complete Phase A steps 1-4, then let me know when you have the Client ID. 🚀
