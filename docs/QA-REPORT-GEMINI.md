# QA Report: Built-in AI (Gemini Nano) Integration

## 1. Feature Overview
This report covers the testing status of the "Built-in AI" feature introduced in v2.1.
- **Goal**: Enable local, privacy-first prompt enhancement.
- **Core Technology**: Chrome Prompt API (Experimental) via Offscreen Document.

## 2. Test Coverage

### 2.1 Automated Tests
Currently, automated testing for this feature is limited due to the experimental nature of the API (Requires specific Chrome flags and hardware).
- **Unit Tests**: `AIService` methods are stubbed/mocked (Planned).
- **E2E Tests**: A placeholder spec `tests/e2e/gemini_nano.spec.js` has been created. Running this in CI requires a custom Chrome build with GenAI flags enabled.

### 2.2 Manual Validation (The "Golden Path")
Since automated E2E is fragile for this feature, we rely on a robust Manual Verification plan.

**Test Case 1: Environment Setup**
- [ ] Run `scripts/launch-gemini-chrome.sh`.
- [ ] Verify Chrome opens with warnings about "Unsupported command-line flag".
- [ ] Verify `chrome://version` shows `--enable-features=PromptAPIForGeminiNano...`.

**Test Case 2: Diagnostic Tool**
- [ ] Open Extension Options.
- [ ] Click "Test AI" (opens `gemini-diagnostic.html`).
- [ ] Check "Global Object":
    - Local: ❌ Missing (Expected).
    - Offscreen: ✅ READILY / AFTER-DOWNLOAD / NO.
- [ ] Check "Functional Test":
    - Click "Run Test Prompt".
    - Verify output: "Hello there!..." (or similar).

**Test Case 3: Prompt Enhancement**
- [ ] Open Side Panel on any page.
- [ ] Type "fix this".
- [ ] Click "Magic Enhance".
- [ ] Verify the input is replaced with a structured prompt.

## 3. Known Issues & Limitations
| Issue | Status | Workaround |
|-------|--------|------------|
| **"Waiting..." on Diagnostics** | **FIXED** | Fixed by updating Offscreen Reason to `DOM_SCRAPING`. |
| **"API Missing" (Red Circles)** | **FIXED** | Fixed by moving from `chrome.tabs` to `chrome.offscreen`. |
| **"Not Supported" Error** | **FIXED (v2.1)** | Fixed by adding `{ expectedContext: 'en' }` to `window.ai.languageModel.create()`. |
| **Model Download Stuck** | **External (Chrome)** | Use `await window.ai.createTextSession()` in console to kickstart. |
| **Hardware Incompatibility** | **External** | Use `OptimizationGuideOnDeviceModel:BypassPerfRequirement` flag. |

## 4. Conclusion
The feature is **functionally complete** and verified manually on macOS/Chrome Canary. Automated coverage is the next priority for v2.2 once the API stabilizes.
