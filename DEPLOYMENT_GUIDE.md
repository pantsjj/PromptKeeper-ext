# PromptKeeper Deployment Guide

## 1. Fixing "Bad Client ID" Error

The error `bad client id` occurs when your extension ID is not registered in Google Cloud Console.

### Step-by-Step: Add Extension ID to OAuth Client

#### Step 1: Get Your Extension ID
1. Open `chrome://extensions` in Chrome
2. Find **PromptKeeper** in the list
3. Copy the **ID** shown below the extension name (e.g., `japfbbfmkjpmiiaabdlfjbijgaffmmdc`)

#### Step 2: Open Google Cloud Console
1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Sign in with the Google account that owns the project

#### Step 3: Edit Your OAuth Client
1. Under **OAuth 2.0 Client IDs**, find your client (named something like "Chrome Extension")
2. Click the **pencil icon** (Edit) on the right side
3. Scroll down to the **Application ID** field

#### Step 4: Add the Extension ID
1. In the **Application ID** field, paste your extension ID:
   - For local dev: `japfbbfmkjpmiiaabdlfjbijgaffmmdc`
   - For production (Web Store): `donmkahapkohncialmknoofangooemjb`
2. You can add **multiple IDs** (one per line) to support both local and production
3. Click **Save**

#### Step 5: Test
1. Close and reopen Chrome
2. Try signing in with Google in PromptKeeper
3. The error should be resolved

> [!TIP]
> If you still see the error, wait 5 minutes—Google sometimes takes a moment to propagate changes.


## 2. Deploying to Chrome Web Store (Production)

### A. Prepare the Package
Since your project uses vanilla JavaScript (ES Modules), no build step is required. However, you should verify the codebase first.

1.  **Run Pre-flight Checks**:
    ```bash
    npm run lint
    npm run test
    npm run test:e2e
    ```
2.  **Create a ZIP file** of your project root.
3.  **Exclude** the following files/folders to keep the package clean and secure:
    *   `.git/`
    *   `.vscode/`
    *   `node_modules/`
    *   `tests/`
    *   `coverage/`
    *   `test-results/`
    *   `playwright-report/`
    *   `ChromeStore/` (marketing assets, not needed in extension)
    *   `docs/`
    *   `*.md` (README, CHANGELOG, etc.)
    *   `playwright.config.js`
    *   `jest.config.js`
    *   `babel.config.json`
    *   `eslint.config.js`
    *   `.ignore`
    *   `.gitignore`
    *   **`key.pem`** ⚠️ CRITICAL: Never include your signing key!
    *   **`pubkey.txt`**
    *   `*.code-workspace`

### B. Upload to Web Store
1.  Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2.  Click **+ New Item** and upload your ZIP.
3.  The Store will assign a permanent **Item ID** to your extension. **Copy this ID.**

### C. Configure Production OAuth
1.  Go back to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2.  Add the **Store Item ID** to your OAuth Client configuration.
    *   *Note: You can have multiple IDs allowed (Local ID + Production ID).*

### D. Finalize
1.  Fill in the Store listing details (Description, Screenshots, etc.).
2.  Click **Submit for Review**.

> [!NOTE]
> You do **not** need to update `manifest.json` for production if the `client_id` string itself hasn't changed. The Google Cloud configuration effectively "whitelists" the new Store ID to use that existing Client ID.
