# Built-in AI API Optimisation Plan (PromptKeeper v2.1+)

## Why we’re doing this

PromptKeeper’s built-in AI integration has grown across multiple surfaces (`options.html`, `sidepanel.html`, `offscreen.html`) and multiple API shapes (`window.LanguageModel` vs `window.ai.languageModel`). We already stabilized “language options” via `language-model-shim.js` (ADR-007), but we still have **duplication** and we’re not yet using the strongest UX patterns from `web-ai-demos`.

This plan adopts proven patterns (central wrappers, streaming, cancel/abort, download progress, session reuse) to:

- Reduce code duplication and drift.
- Improve UX (faster feedback, cancellable operations, clearer “downloading model” status).
- Improve maintainability and future-proof API changes.
- Strengthen test coverage around AI journeys.

## Source of best practices (prior art)

We will explicitly borrow patterns from:

- `web-ai-demos/ai-session-management` (central `createLanguageModel(options)` wrapper, multi-session management, token usage/quota display)
- `web-ai-demos/news-app` (download progress UX via `monitor(m).addEventListener('downloadprogress', ...)`)
- `web-ai-demos/*` Prompt API playgrounds (streaming rendering via `promptStreaming`, `AbortController`)

See: ADR-004 and ADR-007 for the already-recorded references.

## Current state (baseline)

- **Stability / Safety**: `language-model-shim.js` ensures language params are always present across `create()`, `availability()`, `capabilities()` (CSP-safe, external script).
- **Architecture**: Hybrid local + offscreen bridge.
  - Local checks used for capability gating / showing buttons.
  - Offscreen used for prompt refinement execution when needed.
- **UX today**:
  - Non-streaming results (wait for full completion).
  - “Please wait…” busy state on buttons.
  - Unsaved glow only after AI returns and editor text is updated.

## Target architecture (what we’re moving to)

### 1) Central “Builtin AI Bootstrap” wrapper (highest ROI, do first)

**Goal**: single place to manage:

- API shape differences (`window.LanguageModel` vs `window.ai.languageModel`)
- availability/capability gating
- session creation options (languages, monitor, signal)
- session reuse and destruction

**Implementation**:

- Add `builtin-ai.js` (CSP-safe external script, loaded early) that defines `window.PKBuiltinAI`:
  - `getAvailability({ expectedInputLanguages, expectedOutputLanguages })`
  - `createSession({ signal, monitor, expectedContext, outputLanguage, ... })`
  - optional: `withSession(fn, opts)` (session cache)
  - optional: `getTokenStats(session)` (inputUsage/inputQuota if available)

**Where we adopt it**:

- `services/AIService.js`: replace local `availability/capabilities/create` branching with `window.PKBuiltinAI.*`
- `offscreen.js`: replace duplicated checks and session creation with `window.PKBuiltinAI.*`
- `gemini-diagnostic.js`: use `window.PKBuiltinAI.getAvailability()` for consistency

**Impact (better)**:

- Eliminates duplicated branching logic and duplicated “language opts” constants.
- Makes future API shape changes a one-file update.

### 2) Streaming output (promptStreaming) + progressive rendering (UX improvement)

**Goal**: show AI output progressively for long refinements instead of “all at once”.

**Implementation**:

- Extend `AIService` to support a streaming refinement path:
  - Use `session.promptStreaming(metaPrompt, { signal })` where supported.
  - Fall back to `session.prompt(metaPrompt, { signal })` when streaming isn’t available.
- UI behavior:
  - While streaming: keep button in “Please wait…” state.
  - Update the editor content progressively as chunks arrive.
  - Preserve the existing rule: **unsaved glow turns on only after completion** (stream ended).

**Where we adopt it**:

- `options.js`: AI refine buttons in full editor
- `popup.js` (side panel): AI buttons (“Magic Optimize”, “Improve Clarity”)

**Impact (better)**:

- Faster perceived performance.
- Users see the output as it forms (less “black box” waiting).

### 3) Abort/cancel (AbortController)

**Goal**: allow users to cancel long operations safely, preventing stranded in-flight operations.

**Implementation**:

- For each AI action:
  - Create a per-action `AbortController`
  - Store it while the operation runs
  - Clicking the same button again (or a dedicated “Cancel” button) aborts

**Where we adopt it**:

- `options.js` and `popup.js` AI button handlers
- Offscreen refine path must forward/obey `signal` where supported

**Impact (better)**:

- Avoids accidental wasted compute.
- Improves UX confidence (“I can stop this”).

### 4) Model download progress (monitor + downloadprogress)

**Goal**: show a clear “model downloading / warming up” indicator (instead of vague errors or spinners).

**Implementation**:

- When creating sessions, pass `monitor(m) { m.addEventListener('downloadprogress', ...) }`
- Surface progress into:
  - Full editor AI status area (`#ai-status`)
  - Side panel (lightweight status line or button text)

**Where we adopt it**:

- `options.js`: AI status line already exists
- `popup.js`: optional minimal status text (or button label change)

**Impact (better)**:

- Reduces user confusion during first-run / cold start.
- Converts “it’s broken” into “it’s downloading (x%)”.

### 5) Session management + reuse (cache + optional persistence)

**Goal**: reuse sessions to reduce overhead and provide richer stats (quota/usage), while keeping privacy/local-first.

**Implementation**:

- Phase 1 (in-memory):
  - cache a single prompt session per context (options/sidepanel/offscreen)
  - destroy it on idle timeout or when switching major settings
  - display `inputUsage`/`inputQuota` if available
- Phase 2 (optional):
  - multi-session support keyed by Prompt ID (similar to `ai-session-management` UUID pattern)
  - store session metadata (not model data) in `chrome.storage.local` for continuity (NOT required for v2.1)

**Impact (better)**:

- Faster repeated refinements.
- Better “AI health” visibility via token stats.

## Files likely to change

- **New**:
  - `builtin-ai.js` (shared wrapper, global `window.PKBuiltinAI`)
- **Updated**:
  - `services/AIService.js` (use wrapper; add streaming + abort handling entrypoints)
  - `offscreen.js` (use wrapper; accept abort/progress)
  - `gemini-diagnostic.js` (use wrapper for consistency)
  - `options.js`, `popup.js` (UI streaming/cancel/progress wiring)
  - `options.html`, `sidepanel.html`, `offscreen.html` (load `builtin-ai.js` early)
- **Docs**:
  - `docs/adr/ADR-004-built-in-ai-integration.md` (architecture update)
  - `docs/adr/ADR-007-language-model-shims-and-csp-safe-ai-bootstrap.md` (follow-up now becomes planned)

## Testing plan (how we’ll prove it works)

- **Unit (Jest)**:
  - New suite for `PKBuiltinAI` wrapper behavior (shape detection, options merging, fallbacks).
  - Extend AIService tests to cover streaming fallback logic (promptStreaming present vs absent).
- **E2E (Playwright)**:
  - Extend AI journeys to:
    - wait for completion (already required)
    - validate busy state and optional cancel
    - verify editor updates and preview sync
    - verify unsaved glow only after completion
  - Add a mock `promptStreaming` implementation in init scripts (where we want streaming coverage), otherwise keep current mocks (prompt-only) and ensure fallback works.

## Test harness / framework revision (required)

Because these changes introduce **streaming**, **abort/cancel**, and **downloadprogress monitor** behaviors, we must update the test harness to assert the *right things* and avoid false failures.

### What needs to change

- **E2E mocks must support both APIs**:
  - `session.prompt()` (non-streaming)
  - `session.promptStreaming()` (streaming) as an async iterator yielding chunks
- **E2E must become “event-driven” instead of time-driven**:
  - Wait for UI state transitions (`ai-busy` on/off, button label changes, editor value updates)
  - Avoid sleeps; rely on deterministic selectors/conditions
- **Abort/cancel tests**:
  - Verify that clicking “Cancel” aborts the request and the UI returns to idle without applying unsaved glow
- **Progress tests**:
  - Where we attach `monitor(downloadprogress)`, tests should validate that status text updates (or that it is safely ignored if the API surface doesn’t support it)
- **Wrapper-level unit tests**:
  - Add unit coverage for `window.PKBuiltinAI.getAvailability()` and `createSession()` with both API shapes:
    - `window.LanguageModel.*`
    - `window.ai.languageModel.*`

### Milestone (must be last before release)

**M5 (Test posture update):** revise Playwright fixtures + AI mocks + assertions to match streaming/cancel/progress; update `docs/TEST_STRATEGY.md` to reflect the new harness capabilities and what we validate.

## Milestones / rollout

1. **M1 (Refactor foundation)**: add `builtin-ai.js`, refactor `AIService` + `offscreen.js` to use it (no UX change yet).
2. **M2 (Streaming + cancel)**: implement streaming + AbortController in options page first; then side panel.
3. **M3 (Progress UX)**: wire `monitor(downloadprogress)` into status UI.
4. **M4 (Session reuse + stats)**: cache sessions; surface quota/usage if available.
5. **M5 (Test posture update)**: update test harness (Playwright fixtures/mocks + unit tests) to validate streaming/cancel/progress correctly; refresh `docs/TEST_STRATEGY.md`.

## Implementation status (current repo)

> This section is the “done vs remaining” checklist for the plan, to avoid ad-hoc patching.

### ✅ Implemented

- **Central wrapper**
  - Added `builtin-ai.js` exposing `window.PKBuiltinAI`:
    - `getAvailability()`
    - `createSession()`
    - `getCachedSession()` / `withSession()` (TTL-based cache)
    - `getTokenStats()`
  - Loaded early (CSP-safe) in:
    - `options.html`
    - `sidepanel.html`
    - `offscreen.html`
- **Streaming + cancel (AbortController)**
  - `services/AIService.js` now prefers `promptStreaming()` when available, with fallback to `prompt()`.
  - Options page (`options.js`) now supports:
    - “Cancel” button state while AI is running
    - streaming preview updates via `onChunk`
    - **revert editor content on cancel** (no partial text left behind)
  - Side panel (`popup.js`) supports:
    - “Cancel” button state while AI is running
    - streaming preview updates via `onChunk`
  - Offscreen (`offscreen.js`) supports:
    - request tracking via `requestId`
    - cancel messages `cancelRefinePrompt` → abort in-flight controller
- **LanguageModel warning + MV3 CSP**
  - `language-model-shim.js` (external, CSP-safe) enforces language options for:
    - `create()`, `availability()`, `capabilities()`
  - ADR-007 tracks this decision.
- **Progress UX**
  - Options page: `monitor(downloadprogress)` updates `#ai-status`.
  - Side panel: new `#ai-progress` indicator in footer + `monitor(downloadprogress)` hook.
- **Testing updates (initial harness support)**
  - Unit tests:
    - Added `tests/PKBuiltinAI.test.js` to cover wrapper behavior (availability, createSession, caching).
  - E2E tests:
    - Updated `tests/e2e/sidepanel_ai.spec.js` to include a streaming mock (`promptStreaming`).
    - Added `tests/e2e/ai_cancel_and_streaming.spec.js` to validate cancel + revert behavior in Options.

### ⚠️ Partially implemented / still needs hardening

- **Side panel cancel semantics**:
  - Cancel currently aborts, but we should **also revert editor text back to original** (like Options does), so partial streamed content can’t remain visible.
- **Session “stats” surfacing**:
  - Session caching exists (`getCachedSession()`), but we do not yet surface `inputUsage/inputQuota` in UI.
- **Offscreen specialized APIs**:
  - `offscreen.js` still uses `window.ai.summarizer/rewriter` directly (fine), but could be wrapped via `PKBuiltinAI` for consistent monitoring/cancel patterns if needed.

### 🧪 Test posture (still TODO to fully close M5)

- Update `docs/TEST_STRATEGY.md` to explicitly list:
  - streaming-aware mocks (`promptStreaming` as async iterator)
  - cancel assertions (AbortController / revert semantics)
  - progress assertions (downloadprogress monitor) and fallbacks
- Extend E2E AI journeys (existing suites) to:
  - assert cancel behavior in side panel
  - assert progress indicator behavior (best-effort) without flakiness

## Success criteria

- No duplicated API-shape branching across files (wrapper is the single source of truth).
- No CSP violations.
- AI operations are cancellable.
- Clear progress shown during model download/warm-up.
- Streaming path improves perceived responsiveness without breaking “unsaved glow after completion”.
- Tests cover the new architecture and prevent regression.


