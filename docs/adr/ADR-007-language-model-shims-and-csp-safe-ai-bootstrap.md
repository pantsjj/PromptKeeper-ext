# ADR-007: LanguageModel Shims + CSP-Safe AI Bootstrap

## Status

Accepted (v2.1.x)

## Context

PromptKeeper integrates Chrome’s on-device AI APIs (Gemini Nano / Prompt API) across multiple extension surfaces:

- `sidepanel.html` (side panel UI)
- `options.html` (full-page editor)
- `offscreen.html` + `offscreen.js` (AI bridge execution context)

Chrome began emitting a warning on extension page load:

> “No output language was specified in a LanguageModel API request… Please specify a supported output language code: [en, es, ja]”

This warning was observed even when users had not explicitly triggered an AI action yet, and was reported as occurring immediately when opening the side panel.

In practice, PromptKeeper makes “availability” calls early (to decide whether to show AI tools), and those calls may now require language parameters in newer API shapes.

Additionally, as a Manifest V3 extension, PromptKeeper enforces strict extension-page Content Security Policy:

- `script-src 'self'` (no inline scripts)

This constraint prevents using inline `<script>` as an “early shim” mechanism.

## Problem Statement

We need a robust, non-hacky way to:

1. Prevent “missing output language” warnings by ensuring language options are consistently provided.
2. Apply the fix safely across all extension surfaces (side panel, options, offscreen).
3. Respect MV3 CSP (no inline scripts).
4. Avoid duplicating shim logic across multiple JS entrypoints.

## Decision

We will implement a **single, shared, CSP-safe shim module** that is loaded early on extension pages, and treat any per-page wrapping as a **failsafe** only.

### A. Shared Shim File

Create `language-model-shim.js`, responsible for wrapping:

- `window.LanguageModel.create(options)`
- `window.LanguageModel.availability(options)`
- `window.LanguageModel.capabilities(options)`
- `window.ai.languageModel.create(options)`
- `window.ai.languageModel.capabilities(options)`

The shim will merge in default language hints:

- `expectedInputLanguages: ['en']`
- `expectedOutputLanguages: ['en']`

and ensure `create()` always includes:

- `expectedContext: 'en'`
- `outputLanguage: 'en'`

### B. Early Load Order (CSP-Safe)

Add `<script src="language-model-shim.js"></script>` as the **first** script loaded in:

- `sidepanel.html`
- `options.html`
- `offscreen.html`

This preserves MV3 CSP compliance (external scripts from `'self'` are allowed) and ensures wrapping happens before our application code calls AI APIs.

### C. Failsafe Wrappers in App Code

Keep the existing `applyLanguageModelShims()` in `popup.js` and `options.js`, but change its behavior to:

- **Return early** if the shared shim has already run (flags set).
- Only wrap when the shim was not loaded for some reason (future-proofing).

### D. Explicit Language Options in API Call Sites

In addition to the shim, explicitly pass language options when calling:

- `availability(...)`
- `capabilities(...)`

in code paths used during initial “AI availability checks” (e.g., `AIService.getAvailability`, `offscreen.js` diagnostics).

This belt-and-suspenders approach ensures consistent behavior even if the platform changes the call signatures again.

## Rationale

- **CSP compliance**: MV3 blocks inline scripts, so the only reliable early-boot mechanism is a shared external script.
- **Single source of truth**: a single shared shim eliminates copy/paste drift across surfaces.
- **Failsafe over hard dependency**: UI code can still self-heal if a page is loaded without the shim (developer mistakes / future refactors).
- **Compatibility with evolving API shapes**: Chrome exposes multiple surfaces (`window.LanguageModel` vs `window.ai.languageModel`). Wrapping both keeps PromptKeeper resilient.

## Alternatives Considered

1. **Inline “early shim” script in HTML**
   - Rejected: violates MV3 CSP (`script-src 'self'`), breaks extension pages.

2. **Only fix `create()` calls**
   - Rejected: warning can be triggered by `availability()` / `capabilities()` calls used during “show/hide AI tools”.

3. **Centralize all AI access exclusively in the offscreen document**
   - Not adopted (for now): PromptKeeper supports hybrid “local page” checks and an offscreen bridge. Full consolidation is a larger refactor and would need careful UX work (latency, UI readiness, messaging reliability).

## Implementation Notes (Current State)

- Shared shim: `language-model-shim.js`
- Early include in: `sidepanel.html`, `options.html`, `offscreen.html`
- Failsafe checks: `popup.js`, `options.js` return early if shim flags are present.
- Call sites updated to pass language options in `services/AIService.js`, `offscreen.js`, and `gemini-diagnostic.js`.
- Built-in AI wrapper: `builtin-ai.js` (CSP-safe external) loaded early to centralize API-shape branching and provide session helpers (`window.PKBuiltinAI`).
- AI cancellation plumbing (best-effort):
  - `AIService.refinePrompt(..., { signal })` forwards abort intent.
  - Offscreen supports `cancelRefinePrompt` to abort an in-flight operation when running via the offscreen bridge.

## Cross References / Prior Art

### Internal PromptKeeper Docs

- `docs/adr/ADR-004-built-in-ai-integration.md` (hybrid local vs offscreen bridge)
- `docs/QA-REPORT-GEMINI.md` (Gemini Nano operational diagnostics and troubleshooting)
- `gemini-diagnostic.html` + `gemini-diagnostic.js` (local support checks)

### External / Related Examples (web-ai-demos)

We reviewed `/workspaces/web-ai-demos` and adopted these principles:

- **Central wrapper functions** for API creation and shape differences
  - Example: `ai-session-management/script.js` uses `createLanguageModel(options)`
- **Availability gating** before session creation
  - Example: `weather-ai/src/lib/prompting/index.ts` uses `availability()` / `capabilities()` checks before `create()`
- **Abort + streaming patterns** (future improvement opportunity)
  - Examples: multiple demos use `AbortController` + `promptStreaming()` for responsive UX
- **Download progress monitoring** (future improvement opportunity)
  - Examples: `news-app/script.js` uses `monitor(m => m.addEventListener('downloadprogress', ...))`

These examples reinforce the value of small “bootstrap” wrappers rather than scattered, ad-hoc calls.

## Consequences

### Positive

- Eliminates CSP-violating inline shims while keeping “early shim” behavior.
- Standardizes AI language configuration across all extension pages.
- Reduces log noise for users and makes diagnostics more deterministic.
- Makes future API migrations cheaper by having one shim to update.
- Enables cleaner adoption of `web-ai-demos` best practices (central wrapper, streaming/cancel, progress UX) without duplicating boot logic.

### Negative / Trade-offs

- Introduces one more shared bootstrap script to maintain.
- Some shim behavior is inherently defensive and may be redundant if all call sites are always correct.

## Follow-ups (Optional)

- Surface token usage/quota (where supported) in UI using `window.PKBuiltinAI.getTokenStats(session)`.
- Continue hardening cancel semantics across all surfaces so partial streamed output never “sticks” after an abort.

Tracking plan: see `built-in-AI-API-optimisation-plan.md`.


