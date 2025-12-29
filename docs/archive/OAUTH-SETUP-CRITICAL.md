# OAuth Setup: Local Testing vs Published Extension

**Current Status**: ✅ OAuth Configured for LOCAL TESTING  
**Client ID**: `804678258987-e841cbt90rcba2pn5lgti5tn5cfm2t0t.apps.googleusercontent.com`

---

## 🚨 CRITICAL UNDERSTANDING

Chrome extensions have **TWO DIFFERENT EXTENSION IDs**:

1. **Local/Unpublished ID**: Random ID Chrome generates when you load extension in developer mode
   - Changes every time you reinstall or load from different folder
   - Example: `abcdefghijklmnopqrstuvwxyz123456`
   
2. **Published Store ID**: Permanent ID assigned by Chrome Web Store
   - Only received AFTER publishing to Chrome Web Store
   - Example: `kjacobojnmghlbobmnbmkfmakdeofjho` (Grammarly's actual ID)
   - **This is what you'll use for PRODUCTION**

---

## 📋 Current Setup (LOCAL TESTING)

### What You Have Now:

**OAuth Client Configuration**:
- Project: Created in Google Cloud Console
- Client ID: `804678258987-e841cbt90rcba2pn5lgti5tn5cfm2t0t.apps.googleusercontent.com`
- Authorized for: Your current **LOCAL extension ID**
- Test Users: Your Gmail account(s)

**How to Find Your Current Local Extension ID**:
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Find "PromptKeeper" in the list
4. Copy the ID below the extension name

---

## 🛠️ Testing with Current Setup

### Step 1: Update `manifest.json`

Add this to your `manifest.json`:

```json
{
  "permissions": [
    "storage",
    "identity",
    "tabs"
  ],
  "oauth2": {
    "client_id": "804678258987-e841cbt90rcba2pn5lgti5tn5cfm2t0t.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/drive.file"
    ]
  },
  "host_permissions": [
    "https://www.googleapis.com/*"
  ]
}
```

### Step 2: Reload Extension
1. Go to `chrome://extensions/`
2. Click "Reload" icon for PromptKeeper
3. **VERIFY**: No errors in console

### Step 3: Test OAuth Flow
1. Open PromptKeeper options page
2. Click "Sign in with Google" (when implemented)
3. Should see Google OAuth popup
4. Grant permissions
5. Should see your email displayed

---

## 🚀 CRITICAL TODO: Before Publishing to Chrome Web Store

### ⚠️ WARNING: You MUST Update OAuth After Publishing

When you publish PromptKeeper to the Chrome Web Store, you will receive a **NEW PERMANENT EXTENSION ID**. The current OAuth client will NOT work because it's tied to your local ID.

### Pre-Publishing Checklist:

- [ ] Publish extension to Chrome Web Store (first time)
- [ ] Wait for Chrome Web Store to assign permanent extension ID
- [ ] Copy the new **published extension ID** from Web Store dashboard
- [ ] Go to Google Cloud Console → Credentials
- [ ] **EITHER**:
  - [ ] Option A: Update existing OAuth client with new extension ID
  - [ ] Option B: Create NEW OAuth client for published version
- [ ] Update `manifest.json` with new Client ID (if creating new client)
- [ ] Test published extension with new OAuth
- [ ] Update this documentation with published Client ID

---

## 📝 Detailed Migration Steps (When Publishing)

### Step 1: Get Published Extension ID

1. Submit extension to Chrome Web Store: https://chrome.google.com/webstore/devconsole
2. After approval, go to your extension's listing
3. Copy extension ID from URL:
   ```
   https://chrome.google.com/webstore/detail/YOUR_EXTENSION_NAME/[EXTENSION_ID_HERE]
                                                            ^^^^^^^^^^^^^^^^^^^^
   ```
4. **Save this ID** - it's permanent and won't change

### Step 2: Update Google Cloud OAuth Client

**Go to**: https://console.cloud.google.com/apis/credentials

**Option A: Update Existing Client** (Recommended)
1. Click on existing OAuth client: `804678258987-e841cbt90rcba2pn5lgti5tn5cfm2t0t`
2. Under "Authorized redirect URIs" or "Application restrictions"
3. **REPLACE** local extension ID with published extension ID
4. Click "Save"

**Option B: Create New Client** (Cleaner separation)
1. Click "+ Create Credentials" → "OAuth client ID"
2. Application type: Chrome Extension
3. Name: `PromptKeeper (Published)`
4. Item ID: Paste your published extension ID
5. Click "Create"
6. Copy new Client ID
7. Update `manifest.json` with new Client ID

### Step 3: Update Extension Code

**File**: `manifest.json`

```json
{
  "oauth2": {
    "client_id": "NEW_CLIENT_ID_HERE.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/drive.file"
    ]
  }
}
```

### Step 4: Submit Update to Chrome Web Store

1. Increment version in `manifest.json` (e.g., `2.0.0` → `2.0.1`)
2. Package extension as ZIP
3. Upload to Chrome Web Store
4. Wait for review (~1-3 days)

### Step 5: Test Published Version

1. Install from Chrome Web Store (not local)
2. Test OAuth flow
3. Verify Google Drive backup/restore works
4. Check no console errors

---

## 🔐 Security Notes

### Local Client (Current)
- ✅ Safe for testing with your own account
- ✅ Limited to test users you add
- ⚠️ Will BREAK when you publish (different extension ID)

### Published Client (Future)
- ✅ Works for all users who install from Chrome Web Store
- ✅ No test user restrictions
- ✅ Permanent extension ID (won't change)
- ⚠️ Requires OAuth consent screen verification by Google (if >100 users)

---

## 📂 File Locations

**OAuth Configuration**:
- Local JSON: `/Users/jp/Library/Mobile Documents/com~apple~CloudDocs/Documents/workspaces/PromptKeeper-ext/[FILENAME].json`
- ⚠️ **DO NOT COMMIT** OAuth client secret JSON to Git (add to `.gitignore`)

**Extension**:
- Manifest: `manifest.json`
- Drive Service: `services/GoogleDriveService.js` (to be created)

---

## 🧪 Testing Checklist

### Local Testing (Now)
- [x] OAuth client created
- [x] Client ID: `804678258987-e841cbt90rcba2pn5lgti5tn5cfm2t0t`
- [ ] Client ID added to `manifest.json`
- [ ] Extension reloaded
- [ ] Test user (your Gmail) added to OAuth consent screen
- [ ] Google Drive API enabled
- [ ] `GoogleDriveService.js` implemented
- [ ] Backup button works
- [ ] Restore button works
- [ ] OAuth popup appears
- [ ] Can see backup file in Google Drive

### Published Testing (Future)
- [ ] Extension published to Chrome Web Store
- [ ] Published extension ID copied
- [ ] OAuth client updated with published ID
- [ ] New version uploaded with updated Client ID
- [ ] Installed from Chrome Web Store (not local)
- [ ] OAuth flow tested on published version
- [ ] Backup/restore verified on published version

---

## ❓ FAQ

**Q: Why do I need two different OAuth clients?**  
A: You don't NEED two. You can update the same client when publishing. Having two is optional but helps separate testing from production.

**Q: What if I forget to update OAuth before publishing?**  
A: Users who install your extension won't be able to sign in with Google. You'll see OAuth errors. Fix: Update OAuth client, increment version, resubmit.

**Q: Can I test with the published Client ID before publishing?**  
A: No. The published extension ID doesn't exist until Chrome Web Store assigns it.

**Q: Will my local testing break when I publish?**  
A: Only if you update the same OAuth client. If you keep the local client unchanged, local testing continues working.

---

## 🎯 Summary

**RIGHT NOW** (Local Testing):
```
Local Extension ID → OAuth Client (804678...) → Your Test Gmail → ✅ Works
```

**AFTER PUBLISHING** (Production):
```
Published Extension ID → OAuth Client (NEW or updated) → All Users → ✅ Works
```

**IMPORTANT**: The current OAuth setup is **temporary** for testing. When you publish, you MUST update the OAuth configuration with the new published extension ID.

---

**Last Updated**: December 8, 2024  
**Current Client ID**: `804678258987-e841cbt90rcba2pn5lgti5tn5cfm2t0t.apps.googleusercontent.com`  
**Status**: LOCAL TESTING ONLY
