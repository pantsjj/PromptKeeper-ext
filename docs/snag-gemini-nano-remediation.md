# Snag Remediation: Gemini Nano / Built‑in AI (Prompt API) Not Available

*Status: Draft – 2025‑12‑29*  
*Scope: PromptKeeper extension on Chrome ≥ 138 (target: 143+).*

This doc replaces and consolidates earlier troubleshooting notes in `snag.md` for the **“API missing / window.ai is undefined”** class of problems.

---

## 1. Current Symptom

- Gemini diagnostic page (`gemini-diagnostic.html`) shows:
  - **Global Object Check:** `❌ window.ai is MISSING`
  - **Capabilities Check:** `Cannot check: API is missing.`
  - **Rewriter API Check:** `❌ Rewriter API missing`
  - **Hello World Test:** `API Missing.`
- Core issue: in the **runtime context where the diagnostic is loaded**, `window.ai` is `undefined`.

---

## 2. Conceptual Model: Where `window.ai` Should Exist

- **Global browser context (https pages):**
  - On supported Chrome versions and hardware, Chrome injects `window.ai` into regular web pages (for example `https://developer.chrome.com`).
  - If `window.ai` is missing here, the browser/profile itself is not configured for built‑in AI.
- **Extension contexts:**
  - `options.html`, `sidepanel.html`, `offscreen.html`, `ai-bridge.html`, `gemini-diagnostic.html` each run in their own context.
  - Chrome may expose `window.ai` to some but not all of these, depending on channel/rollout.
  - PromptKeeper is architected so **all AI calls go through `offscreen.html`**, which is the only place that *must* see `window.ai`.

**Key idea:** Fix priority is:

1. Make sure **Chrome itself** exposes `window.ai` somewhere (global sanity).  
2. Verify that **`offscreen.html` sees `window.ai`** (the production AI path).  
3. Decide how the **diagnostic page** should measure and display these facts.

---

## 3. Environment Requirements (Chrome & Machine)

Cross‑checked from `built-in-AIUPDATE.md` and current Chrome AI docs:

- **Chrome Version**
  - Target: **Chrome 143+** (Prompt API stable since 138).
- **OS**
  - macOS 13+ (Ventura), Windows 10/11, Linux, or ChromeOS (recent Chromebook Plus).
- **Hardware / Storage (approximate from docs)**
  - RAM: ≥ 16 GB recommended.
  - VRAM: > 4 GB recommended if using GPU.
  - Storage: ≥ 22 GB free on the volume hosting the Chrome profile (Gemini Nano model is ~1.5–2 GB).

If a machine does not meet these criteria, the API may permanently report `available: 'no'`.

---

## 4. One‑Pass Remediation Flow (What To Do First)

Use this flow **in order**. Each step has a verification.

### Step 1 – Verify Chrome Built‑in AI State (Outside the Extension)

1. Go to `chrome://version`
   - Confirm version **≥ 138** (ideally 143+).
2. Go to `chrome://components`
   - Locate **“Optimization Guide On Device Model”**.
   - If version is `0.0.0.0` → click **“Check for update”** and wait until it shows a real version.
3. Go to `chrome://on-device-internals`
   - Under **“Foundational model state”**, confirm it shows **“Ready”** (or at least not an error).
4. Open a normal HTTPS page (e.g. `https://developer.chrome.com`) and in DevTools Console run:

   ```js
   window.ai
   ```

   - **Expected (healthy)**: a non‑undefined object.
   - **If `undefined`**: This is a **browser/profile‑level issue**. Revisit flags (see Step 2) or try a new profile / Canary build.

### Step 1.5 – Advanced "Kickstart" (If Model is Stuck)

If flags are on but `window.ai` is missing or the download won't start:

1. Open DevTools Console (`Ctrl/Cmd + Shift + J`).
2. Run this command to force session creation:
   ```javascript
   await window.ai.createTextSession();
   ```
   (Or `await window.ai.languageModel.create()` depending on version).
3. Watch `chrome://components` for movement or `chrome://on-device-internals` for download status.
4. **Hardware Check**: If you have < 4GB VRAM or < 22GB disk, you **MUST** ensure the flag `#optimization-guide-on-device-model` is set to **Enabled BypassPerfRequirement**.

### Step 2 – Chrome Flags (Only If Needed)

> Note: `built-in-AIUPDATE.md` says flags are no longer required on 138+ for Prompt API, but in practice they may still matter on some channels / rollouts. Treat them as an **escape hatch**, not first‑line guidance.

1. Go to `chrome://flags`.
2. Set:
   - `Prompt API for Gemini Nano` → **Enabled**
   - `Enables optimization guide on device` → **Enabled BypassPerfRequirement** (Critical for low-spec or non-standard hardware)
3. Click **Relaunch** (or navigate to `chrome://restart`).
4. Repeat **Step 1** to see if `window.ai` now appears on a regular HTTPS page.

If `window.ai` is still missing outside any extension context after this, accept this as an environment limitation (for now) and proceed assuming **local Gemini is not available on this machine**.

### Step 3 – Verify Extension Contexts (Where PromptKeeper Actually Runs)

Now assuming `window.ai` is available on at least one HTTPS page (global sanity is OK):

1. **Options Page**
   - From `chrome://extensions` → PromptKeeper → **“Extension options”**.
   - In DevTools Console:

     ```js
     window.ai
     ```

   - Record if `undefined` or an object.

2. **Offscreen Document (`offscreen.html`)**
   - In `chrome://extensions` (Developer Mode ON), under PromptKeeper look for **“Inspect views offscreen.html”**.
   - Confirm logs:
     - `[Offscreen] Document loaded`
     - `[Offscreen] window.ai available: true` (or `false`)
   - In that DevTools Console:

     ```js
     window.ai
     ```

   - **This is the critical one**: if this context cannot see `window.ai`, AI features cannot work.

3. **Diagnostic Page As Extension Page**
   - Open `chrome-extension://<EXTENSION_ID>/gemini-diagnostic.html` directly (not `file://`).
   - In DevTools Console:

     ```js
     window.ai
     ```

   - Note if it matches or differs from `offscreen.html`.

### Step 4 – Interpret Results (Outcome Matrix)

| Global HTTPS (`window.ai`) | `offscreen.html` | Diagnostic page | Meaning / Next Action |
| --- | --- | --- | --- |
| ❌ undefined | ❌ undefined | ❌ undefined | Chrome built‑in AI not active on this profile/machine. Re‑check requirements, flags, and possibly try Canary / new profile. |
| ✅ object | ❌ undefined | ❌ undefined | Built‑in AI exists, but **not injected into extension contexts**. Test with a minimal MV3 extension; if also failing there, likely Chrome bug / gating. |
| ✅ object | ✅ object | ❌ undefined | Production AI path is **healthy**; diagnostic page context is mis‑configured. Fix diagnostic (e.g., load via `chrome-extension://` or route it through offscreen). |
| ✅ object | ✅ object | ✅ object | Everything is wired correctly; any remaining issues are higher‑level (prompt logic, download delays, etc.). |

---

## 5. Aligning / Updating Existing Docs

### 5.1 `built-in-AIUPDATE.md`

- **Status:** Mostly up‑to‑date and accurate for Chrome 138+.
- **Action:** Treat this as the **primary reference for model status and availability states**:
  - `available: 'readily'`
  - `available: 'after-download'`
  - `available: 'no'`
- **Needed update:** Add a short link/section:
  - “For full environment + context troubleshooting, see `docs/snag-gemini-nano-remediation.md`.”



### 5.3 `snag.md`

- **Status:** Describes the snag but still assumes flags are the only fix.
- **Action:**
  - Replace most of the fix section with a short summary and a pointer:
    - “For the up‑to‑date remediation flow, see `docs/snag-gemini-nano-remediation.md`.”

### 5.4 `DEBUG-OFFSCREEN.md`

- **Status:** Still valid and highly useful (connection errors, offscreen creation).
- **Action:**
  - Add one short subsection:
    - When debugging offscreen, also look for `[Offscreen] window.ai available: true` and validate `window.ai` in that console.
  - Link to this remediation doc for the broader environment checks.

---

## 6. Test Plan – Manual Checks

Use this list as a regression checklist when changing anything about built‑in AI integration.

### 6.1 Browser / Environment

- **T‑1**: `chrome://version` – Chrome ≥ 138 (target 143+).
- **T‑2**: `chrome://components` – “Optimization Guide On Device Model” has non‑zero version.
- **T‑3**: `chrome://on-device-internals` – Foundational model state “Ready”.
- **T‑4**: On `https://developer.chrome.com`, `window.ai` is an object.

### 6.2 Extension Contexts

- **T‑5**: `options.html` – `window.ai` is defined or we at least understand it’s not required there.
- **T‑6**: `offscreen.html` – logs show `[Offscreen] window.ai available: true`.
- **T‑7**: Offscreen `checkAIAvailability`:
  - From options or sidepanel, observe that AI status in the UI changes from “not available” to at least “after-download” or “ready”.
- **T‑8**: `gemini-diagnostic.html` opened as `chrome-extension://`:
  - Global check passes.
  - Capabilities check returns `readily` or `after-download`.
  - Hello World test succeeds at least once.

---

## 7. Test Plan – Automated (Playwright / Selenium)

> Note: The headless CI browser will not necessarily have Gemini Nano or `window.ai` available. These tests are best run locally in a **profile configured like a real user**.

### 7.1 Playwright Ideas

- Add a dedicated spec (e.g. `tests/e2e/gemini-nano.spec.js`) that:
  - Loads the packaged extension with a persistent profile that has built‑in AI enabled.
  - Opens:
    - `chrome-extension://<id>/options.html`
    - `chrome-extension://<id>/sidepanel.html`
    - `chrome-extension://<id>/gemini-diagnostic.html`
  - For each page, uses `page.evaluate(() => typeof window.ai !== 'undefined')` and records the result.
  - On `gemini-diagnostic.html`, optionally clicks the buttons and asserts that:
    - The global check does **not** contain “MISSING”.
    - The capabilities check does **not** say “Cannot check: API is missing.”

### 7.2 Selenium / WebDriver Ideas

- Use Chrome with `--load-extension` pointing to the built promptkeeper build.
- Navigate to same extension pages as Playwright.
- Use `driver.executeScript('return typeof window.ai !== "undefined"')` for yes/no checks.

---

## 8. Future Improvements / Decisions

- **Diagnostic page behavior**
  - Option A: Keep as a **raw `window.ai` sanity check** (current design).
  - Option B (recommended): Route diagnostic through the same AI bridge / offscreen pipeline as `AIService` so it reports what the **real production path** sees, even if `window.ai` is not injected in the diagnostic page itself.
- **Per‑channel notes**
  - Consider adding a short table for Stable vs Canary behavior and any known rollout quirks.

This file should be treated as the **single source of truth** for resolving “Gemini Nano / built‑in AI is missing or unavailable” issues going forward.


