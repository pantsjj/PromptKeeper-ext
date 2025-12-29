# ADR 004: Built-In AI (Gemini Nano) Integration Specification

## Status
Accepted (Target: Release 2.1)

## References
- **Official Explainer**: [GitHub/webmachinelearning/prompt-api](https://github.com/webmachinelearning/prompt-api) (Draft Community Group Report)
- **Chrome Status**: [Prompt API (Feature 5134603979063296)](https://chromestatus.com/feature/5134603979063296?gate=5106702730657792)
- **Demos & Playgrounds**:
    - [Chrome Web AI Demos](https://github.com/GoogleChromeLabs/web-ai-demos)
    - [Etienne Noel's Prompt API Playground](https://ai.etiennenoel.com/prompt-api)
    - [WebAI Studio](https://web-ai.studio/)
- **Writing Assistance APIs**: [GitHub/webmachinelearning/writing-assistance-apis](https://github.com/webmachinelearning/writing-assistance-apis)
- **Local Reference**: `/Users/jp/Library/Mobile Documents/com~apple~CloudDocs/Documents/workspaces/writing-assistance-apis`

## Context
PromptKeeper aims to provide premium, secure, and zero-latency prompt enhancement capabilities (summarization, formalization, "magic enhancement") directly within the browser. Relying solely on cloud APIs introduces latency, cost, and privacy concerns for enterprise users. Chrome's Built-in AI (Gemini Nano) offers a local, privacy-first alternative.

We need a standardized architectural approach to integrate this experimental API, which is subject to rapid changes (Chrome 138+), hardware constraints, and "Origin Trial" availability.

## Reference Implementation
We have analyzed the official [Chrome Extensions Samples](https://github.com/GoogleChrome/chrome-extensions-samples), specifically `functional-samples/ai.gemini-on-device`.
- **Sample Approach**: Enables `sidePanel` permission and accesses `window.ai.languageModel` directly within the Side Panel's DOM context.
- **Limitation**: This limits AI availability to when the Side Panel is open and active. It does not easily support background automation or content-script-driven enhancements without opening the UI.

We also align with the structure defined in [WebAI Demos](https://github.com/GoogleChromeLabs/web-ai-demos) for parameter tuning (`topK`, `temperature`) and session management.

## Decision
We will integrate Gemini Nano using a **Centralized Offscreen Bridge** architecture to ensure ubiquitous availability across the extension (Options Page, Content Scripts, Background, Side Panel).

### 1. Specification & Configuration
- **Model**: Gemini Nano (via Chrome Prompt API).
- **Minimum Version**: Chrome 143+ (Dev/Canary recommended for dev, 138+ for stable eventually).
- **Permissions**: `offscreen`, `sidePanel`, `storage`.
- **Flags**: 
    - `#prompt-api-for-gemini-nano`: `Enabled`
    - `#optimization-guide-on-device-model`: `Enabled BypassPerfRequirement` (Critical for wider hardware support).

### 2. Architecture: The Offscreen Bridge
Unlike the reference sample which runs AI in the Side Panel, PromptKeeper utilizes the `chrome.offscreen` API.
- **Why**: Service Workers (Background) cannot access `window.ai`. Side Panels must be open to work. Offscreen documents provide a hidden, DOM-enabled context available 24/7 (via message passing).
- **Flow**:
    1.  **Client** (Options Page / Side Panel) sends message `refinePrompt` to `AIService`.
    2.  **AIService** broadcasts message via `chrome.runtime.sendMessage`.
    3.  **Offscreen Document** (`offscreen.html`) receives message, invokes `window.ai.languageModel`, and returns result.
    4.  **Fallback**: If Offscreen fails or API is missing, returns standardized error for "Cloud Fallback" (future scope).

### 3. Feature Components
To support this integration and manage the "experimental" nature, we implemented:

#### A. Status & Diagnostics
- **Status Footer**: Visible in `options.html`. Shows distinct "Cloud" vs "Local AI" status.
    - *Green*: Ready.
    - *Yellow*: Downloading/Cold.
    - *Red*: Missing/Error.
- **Diagnostic Page** (`gemini-diagnostic.html`):
    - **Global Check**: Detects `window.ai` presence in local vs offscreen context.
    - **Capability Check**: Queries `languageModel.capabilities()` for "readily" vs "after-download".
    - **Functional Test**: Runs a "Hello World" prompt.

#### B. Remediation UX ("The Loop")
- **Help Page** (`gemini-help.html`): Self-service guide for users to enable flags and force-download components (`chrome://components`).
- **Advanced Trigger**: Diagnostics page includes a "Fix" link and console commands (`await window.ai.createTextSession()`) to unblock stuck downloads.

#### C. Workflow & API Strategy
PromptKeeper employs a Hybrid "Best-Tool-for-the-Job" Strategy, falling back to the general Prompt API if specialized APIs are unavailable.

**1. Options Page (Full IDE)**:
*   **Magic Enhance** (Prompt API): Creative expansion using "Persona, Task, Context" framework.
*   **Formalize Tone** (Rewriter API > Prompt API): Rewrite to be more professional.
*   **Improve Clarity** (Rewriter API > Prompt API): Rewrite to be clearer/concise.
*   **Shorten** (Summarizer API > Prompt API): Condense text.

**2. Side Panel (Quick Edit)**:
*   **✨ Magic Optimize**: Corresponds to "Magic Enhance".
*   **🔍 Improve Clarity**: Corresponds to "Improve Clarity".
*   *Constraint*: Only shown when AI is fully available (Green status).

## Consequences
- **Positive**:
    - Zero cost for inference.
    - Data never leaves the device (Enterprise-ready).
    - Consistent API access via `AIService` abstraction.
- **Negative**:
    - High user friction for setup (Flags/Download).
    - Large initial download (~2GB model).
    - "Experimental" API stability risk (mitigated by `AIService` abstraction).

## Validation
- Verified against `chrome-extensions-samples/functional-samples/ai.gemini-on-device`.
- Validated mechanism via `scripts/launch-gemini-chrome.sh` for developer reproducibility.
