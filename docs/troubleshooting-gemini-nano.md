# Troubleshooting: Enabling Gemini Nano in PromptKeeper

If you see the error **"❌ AI Not Supported on this device/browser"**, it means Chrome's built-in AI model (Gemini Nano) is not yet active. This is an experimental feature that requires manual setup.

## 1. Requirements
*   **Browser**: Chrome Version **128+** (Dev or Canary channel recommended, but some features are in Stable).
*   **OS**: macOS, Windows 11, or Linux.
*   **Hardware**: At least 4GB of RAM (22GB+ free storage space recommended).

## 2. Enable Chrome Flags
1.  Open a new tab and go to: `chrome://flags`
2.  Search for and **Enable** these two flags:
    *   `Enables optimization guide on device`: Set to **Enabled BypassPerfRequirement**
    *   `Prompt API for Gemini Nano`: Set to **Enabled**
3.  Click **Relaunch** at the bottom of the screen.

## 3. Download the Model
1.  Open a new tab and go to: `chrome://components`
2.  Find **Optimization Guide On Device Model**.
    *   *If you don't see it:* Ensure you relaunched Chrome after step 2.
    *   *If version is 0.0.0.0:* Click **Check for update**.
3.  Wait for the download to complete (Status: "Up-to-date"). This downloads ~1.5GB.

## 4. Verify
1.  Return to the PromptKeeper options page (`Manage Prompts`).
2.  The status should change to **"✅ AI Ready"** (or "⬇️ AI Model needs download" if it's initializing).

*Note: This feature is experimental and managed by Google Chrome, not PromptKeeper. Availability may change.*
