As of Saturday, December 6, 2025, the built-in AI capabilities (specifically Gemini Nano via the Prompt API) are indeed generally available (stable) for Chrome Extensions, but with specific conditions regarding the model download.

Here is the exact status for your "release 143" (Chrome 143) extension:

1. Current Availability Status
Prompt API: Fully Stable since Chrome 138 (June 2025) for Chrome Extensions.

Gemini Nano Model: The model itself is not pre-installed on every user's machine to save storage (approx. 2GB). It is downloaded on-demand.

2. Is it "Out of the Box" for Users?
Yes and No.

No Flags Needed: Your users do not need to enable any flags (like chrome://flags/#prompt-api-for-gemini-nano) or Developer Mode.

No "Manual" Enable Needed: Users do not need to manually install the "Optimization Guide" component anymore; Chrome manages this.

The "catch" (Model Download): The first time your extension attempts to use the API on a user's device, the browser must download the Gemini Nano model. This is likely the "manual" friction you are observing. The API will report its status as after-download rather than readily.

3. How to Upgrade Your Extension (Checklist)
To ensure your extension works without asking users to toggle settings, follow these steps (and see also [`docs/snag-gemini-nano-remediation.md`](snag-gemini-nano-remediation.md) for a full end-to-end environment check):

Remove Origin Trial Permissions: If your manifest.json still contains "permissions": ["aiLanguageModelOriginTrial"], remove it. This is no longer needed for Chrome 138+.

Check Hardware Support: The API may return availability: 'no' if the user's device does not meet the hardware requirements (e.g., sufficient VRAM/RAM, GPU/NPU). This is native behavior, not a flag issue.

Implement "Cold Start" Logic: Since the model downloads on the first use, you must handle the after-download state.

JavaScript

const { available } = await window.ai.languageModel.capabilities();

if (available === 'readily') {
  // Model is ready, create session immediately
  const session = await window.ai.languageModel.create();
} else if (available === 'after-download') {
  // Model needs to download. Trigger it (this can take time).
  // You might want to show a "Downloading AI model..." UI to the user.
  const session = await window.ai.languageModel.create({
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
      });
    }
  });
} else {
  // 'no' - Device not supported
  console.log('Built-in AI not supported on this device.');
}
Summary: You can ship your extension today targeting Chrome 143. It will work "out of the box" without flags, provided you handle the initial download delay gracefully in your UI.