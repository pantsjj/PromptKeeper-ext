# PromptKeeper FAQ

## General

### What is PromptKeeper?
PromptKeeper is a local-first Chrome Extension that acts as an IDE for your generative AI prompts. It helps you version, organize, and optimize your prompts using Chrome's built-in AI.

### Is it free?
Yes, PromptKeeper is free and open source.

## Privacy & Data

### Where are my prompts stored?
By default, all prompts are stored locally in your browser (`chrome.storage.local`). They never leave your device unless you enable Google Drive Sync.

### Does PromptKeeper read my Google Drive files?
No. PromptKeeper only has access to a specific, hidden "AppData" folder in your Google Drive. It cannot see or modify any of your other documents or files.

### Do I need an API key for the AI features?
No! PromptKeeper uses **Gemini Nano**, which is built into Chrome. All AI processing happens locally on your device.

## Troubleshooting

### "Local Gemini Nano is not available" error
This usually means Chrome hasn't downloaded the model yet or the flags aren't enabled.
1. Ensure you are on Chrome 128+.
2. Go to `chrome://flags` and enable `#optimization-guide-on-device-model` and `#prompt-api-for-gemini-nano`.
3. Relaunch Chrome.
4. Open the [Diagnostic Tool](gemini-diagnostic.html) to check status.

### Sync isn't working between devices
1. Make sure you are signed in with the *same* Google account on both browsers.
2. Check that "Sync" is enabled in your browser settings.
3. Verify you have internet connectivity.
