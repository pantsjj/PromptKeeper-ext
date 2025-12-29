# Debugging Steps for Offscreen Document

## Current Error
```
Error: Could not establish connection. Receiving end does not exist.
```

This means the offscreen document isn't receiving messages from AIService.

## Step-by-Step Debug

### 1. Check Service Worker Console

1. Go to `chrome://extensions`
2. Enable "Developer mode" (top right toggle)
3. Find **PromptKeeper**
4. Click **"service worker"** (blue link under the extension)
5. Look for these messages:
   ```
   [Background] Setting up offscreen document
   [Background] Offscreen document created successfully
   ```

**If you see an error instead**, copy the exact error message.

### 2. Check Offscreen Document Console

1. In `chrome://extensions`, under PromptKeeper
2. Look for **"Inspect views offscreen.html"** (should appear after reload)
3. Click it
4. Look for:
   ```
   [Offscreen] Document loaded
   [Offscreen] window.ai available: true
   [Offscreen] Ready to handle AI requests
   ```

5. In the DevTools Console for `offscreen.html`, you can also manually verify:

   ```javascript
   typeof window.ai !== 'undefined'
   ```

   - If this returns `true`, Chrome is exposing the built‑in AI APIs to the offscreen context.
   - If it returns `false`, follow `docs/snag-gemini-nano-remediation.md` to debug why `window.ai` is missing.

**If you don't see "Inspect views offscreen.html"**, the offscreen document wasn't created.

### 3. Check Options Page Console

1. Open PromptKeeper options page
2. Press F12 to open DevTools
3. Try clicking an AI button (e.g., "🪄 Enhance")
4. Look for:
   ```
   [AIService] Sending message to offscreen: checkAIAvailability
   [AIService] Received response: {available: 'readily'}
   ```

**If you see the error**, it means messages aren't reaching the offscreen document.

### 4. Manual Test

In the **service worker console**, run this:

```javascript
// Test 1: Check if offscreen API exists
console.log('Offscreen API:', typeof chrome.offscreen);

// Test 2: Check existing contexts
chrome.runtime.getContexts({contextTypes: ['OFFSCREEN_DOCUMENT']}).then(contexts => {
  console.log('Offscreen contexts:', contexts.length);
});

// Test 3: Try to create offscreen document manually
chrome.offscreen.createDocument({
  url: 'offscreen.html',
  reasons: ['DOM_SCRAPING'],
  justification: 'Test'
}).then(() => {
  console.log('✅ Created successfully');
}).catch(err => {
  console.error('❌ Failed:', err);
});
```

### 5. Check Manifest

Verify `manifest.json` has:
```json
"permissions": ["offscreen"],
"background": {
  "service_worker": "background.js"
}
```

## Common Issues

### Issue 1: Chrome Version Too Old
- **Offscreen API requires Chrome 109+**
- Check: `chrome://version`
- You're on Chrome 143, so this is fine ✅

### Issue 2: Extension Not Reloaded
- Click the reload button in `chrome://extensions`
- Service worker must restart to create offscreen document

### Issue 3: Offscreen Document Fails to Create
- Check service worker console for errors
- Common error: "Only a single offscreen document may be created"
  - Solution: Close and reopen Chrome

### Issue 4: Message Not Reaching Offscreen
- Offscreen document must be created BEFORE sending messages
- background.js should create it on startup
- Check if `ensureOffscreenDocument()` is being called

## What to Report Back

Please tell me:
3. **Manual test**: What happens when you run the test code above?

## Local Testing with Stable ID

To test with a consistent Extension ID (required for some OAuth flows and consistent `chrome-extension://` URLs):

1. Ensure `package.json` includes the `key` field pointing to `prompt-keeper-test-local.key-pem`.
2. Ensure `prompt-keeper-test-local.key-pem` exists in the root directory.
3. Load the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable **Developer Mode**
   - Click **Load unpacked**
   - Select the `PromptKeeper-ext` folder
4. The Extension ID should be stable and match the one derived from the private key.

