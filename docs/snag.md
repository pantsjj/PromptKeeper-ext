# Snag: Gemini Nano Availability (API Missing)

**Issue:** Users report "⚠️ Local Gemini Nano is not available" with the diagnostic code `[API_MISSING (window.ai is undefined)]`.
**Impact:** All AI-powered features (Enhance, Formalize, etc.) are disabled. Core prompt management functionality remains operational.

## Root Cause Analysis
The Chrome browser is not exposing the `window.ai` namespace to the extension context. This occurs despite the feature being ostensibly "available" in Chrome 128+.

**Primary Causes:**
1.  **Chrome Flags Not Active:** The required experimental flags (`#prompt-api-for-gemini-nano`) are either disabled, set to "Default", or not applied due to a pending restart.
2.  **Hardware Incompatibility:** The user's device lacks the VRAM/RAM required, and the flag `#optimization-guide-on-device-model` was not set to "BypassPerfRequirement".
3.  **Release Channel Restrictions:** The user is on Chrome Stable, where these features may be gated behind server-side rollouts (A/B testing) or Early Preview Program (EPP) enrollment, even if flags appear present.

## Investigation Options

### 1. The Diagnostic Tool (User-Facing)
*   **Action:** Click "Run Diagnostic Tool ↗" in the PromptKeeper Options page.
*   **Check:**
    *   **Global Object Check:** If `❌ window.ai is MISSING`, the browser configuration is invalid.
    *   **Capabilities Check:** If `⚠️ Not Ready`, the API exists but the model is downloading.

### 2. The "Console" Check (Developer)
*   **Action:** Open `chrome://extensions`, toggle "Developer Mode", click `background.html` (if applicable) or inspect the Popup.
*   **Command:** Type `window.ai`.
*   **Result:** `undefined` confirms the API is not injected into the extension's execution context.

## Validation Steps (The Fix)

To validate a fix, the user must perform this sequence:

1.  **Reset & Re-Enable Flags:**
    *   Navigate to `chrome://flags`.
    *   **Reset All** (clears conflicting settings).
    *   Enable **"Prompt API for Gemini Nano"**.
    *   Enable **"Enables optimization guide on device"** -> set to **"Enabled BypassPerfRequirement"**.
2.  **Hard Relaunch:** Use the "Relaunch" button or type `chrome://restart`.
3.  **Verify Model Download:**
    *   Navigate to `chrome://components`.
    *   Ensure **"Optimization Guide On Device Model"** shows a version > `0.0.0.0` (e.g., `2024.9.11.x`).
4.  **Re-Run Diagnostic:** The Global Object Check must return `✅ window.ai is PRESENT`.

**Recommendation:** If problems persist on Chrome Stable, switch to **Chrome Canary** for development/testing, as APIs are unguarded there.
