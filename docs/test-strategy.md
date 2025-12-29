## PromptKeeper Testing Strategy (v2.0.0)

This document describes what we actually test today (not just plans) across unit and end‑to‑end layers for PromptKeeper v2.0.0.

---

## 1. Test Layers

- **Unit tests (Jest)**: Verify core services and data model behavior in isolation.
- **End‑to‑end tests (Playwright)**: Exercise real extension pages (`sidepanel.html` and `options.html`) via `chrome-extension://` URLs using the packaged extension.

All tests are runnable via:

- **Unit**: `npm test`
- **E2E**: `npm run test:e2e`

> **Note**: For local development, `package.json` is configured with a `key` field pointing to `prompt-keeper-test-local.key-pem`. This ensures a stable Extension ID when loading the unpacked extension, which is useful for debugging and consistent URL access.

---

## 2. Unit Test Coverage

### 2.1 `AIService`

File: `tests/AIService.test.js`

- **Availability checks**
  - Handles success, download‑pending, and unavailable states.
  - Produces detailed diagnostic strings and detailed status objects.
- **Refinement flows**
  - Successful refinement via the AI bridge (`refinePrompt`).
  - Proper error propagation and logging when the AI bridge reports failures or message‑port errors.

### 2.2 `StorageService`

File: `tests/StorageService.test.js`

- **Legacy data migration** from simple string arrays to structured prompt objects.
- **Prompt CRUD**
  - Add, update, delete prompts.
  - Maintain version history with timestamps and `currentVersionId`.
- **Project (workspace) support**
  - Create projects.
  - Associate prompts with projects.

### 2.3 `GoogleDriveService`

File: `tests/GoogleDriveService.test.js`

- **Authentication**
  - Happy‑path token acquisition.
  - Error branch when `chrome.identity.getAuthToken` fails.
- **User info**
  - Fetch user profile via Google APIs with graceful fallback.
- **Backup / Restore**
  - Serialize prompts/projects and send to Drive.
  - Restore data and handle network error branches.

---

## 3. End‑to‑End Test Coverage (Playwright)

All E2E specs live in `tests/e2e/` and run against a real Chromium instance with the extension loaded.

### 3.1 Core User Journeys

- **`journey.spec.js`**
  - Create workspace (inline add) in `options.html`.
  - Create and save a prompt inside that workspace.
  - Switch between **All Prompts** and the specific workspace.
  - Edit the prompt and verify word‑count updates in the right‑hand stats panel.

- **`workspace_lifecycle.spec.js`**
  - Create workspace and prompt.
  - Invoke **Smart Delete** via workspace context menu.
  - Confirm prompt is preserved under **All Prompts** (orphaned).
  - Re‑create workspace and verify prompt is reclaimed into the workspace.

### 3.2 Side Panel Behavior

- **`sidepanel.spec.js`**
  - Layout sanity (search bar, lists, editor, footer, Google section).
  - Basic editor interactivity (typing into title/body, button enablement).
  - Responsive layout checks at different viewport widths.
  - **New parity tests**:
    - Workspaces/Prompts headers show **`+` buttons** and chevrons.
    - Collapsible sections toggle via title and chevron.
    - Plus buttons do **not** collapse sections.

### 3.3 Workspace Management (Options Page)

- **`workspaces.spec.js`**
  - Inline workspace creation (happy path, snake_case conversion).
  - Validation around max‑word limits and Escape‑to‑cancel.
  - **Sidebar parity**:
    - Options sidebar shows **`+` buttons** and chevrons for Workspaces/Prompts.
    - Collapsible sections driven by `#workspace-section` / `#prompts-section` and `collapsed` class.
  - **Context menu behavior**:
    - Right‑click workspace shows floating context menu (`#context-menu`).

### 3.4 Regression & Smoke

- **`regression_fixes.spec.js`**
  - Sidepanel: selected prompt is highlighted and active class moves correctly.
  - Options page: selecting a prompt updates **footer word count** and **storage size**.

- **`smoke.spec.js`**
  - Extension loads successfully and popup opens without runtime errors.

### 3.5 Markdown Rendering Checks
- **`markdown.spec.js`**
  - Toggle between Edit and Preview modes in Options and Side Panel.
  - Verify rendering of headers, bold, etc.
- **`sidepanel_markdown.spec.js`**
  - Verify markdown loads correctly in the Side Panel (regression).
- **`repro_stale_preview.spec.js`**
  - Verify preview content updates immediately when switching prompts.

---

## 4. Gaps & Manual Checks

Some scenarios remain intentionally manual or partially mocked:

- **Google OAuth / real Drive traffic**
  - E2E tests do not hit live Google APIs; Drive behavior is validated via unit tests and manual runs using a real account.
- **Gemini Nano on‑device availability**
  - E2E does not assert actual model download; instead, we rely on unit tests of `AIService` plus manual verification via `gemini-diagnostic.html`.
- **Cross‑browser matrix**
  - Automated tests currently target Chromium; Chrome Stable/Canary and other Chromium flavors are validated manually during release.

---

## 5. Definition of Done for v2.0.0

- `npm test` passes (all unit suites green).
- `npm run test:e2e` passes (all Playwright specs green).
- Critical user journeys are exercised:
  - Workspace lifecycle (create, delete, restore).
  - Prompt lifecycle (create, edit, versioning, selection).
  - Sidepanel quick‑access workflows and collapsible navigation.



## 6. AI Feature Testing (Gemini Nano)
Due to the experimental nature of the Chrome Prompt API (Requires specific flags and hardware), our strategy relies heavily on **Manual Validation** supported by a **Diagnostic Tool**.

### 6.1 Diagnostic Tool (`gemini-diagnostic.html`)
- **Purpose**: Verify `window.ai` availability in both Local and Offscreen contexts.
- **Coverage**:
  - Global Object Check.
  - Capability Check (Prompt, Rewriter, Summarizer).
  - Functional "Hello World" Test.

### 6.2 Automated E2E
- **Spec**: `tests/e2e/gemini_nano.spec.js` (Placeholder).
- **CI Status**: Skipped. Requires custom Chrome launch args `--enable-features=PromptAPIForGeminiNano...`.
- **Roadmap**: Enable in CI once the API stabilizes (Chrome 143+).

### 6.3 QA Report
See [QA-REPORT-GEMINI.md](QA-REPORT-GEMINI.md) for current status and manual test cases.
