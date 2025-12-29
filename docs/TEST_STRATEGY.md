# PromptKeeper Testing Strategy (v2.1)

**Status**: Active for v2.1.1  
**Scope**: Unit, E2E, Regression, and User Experience Validation.

---

## 1. Component Coverage Matrix

We employ a "Testing Pyramid" approach, relying on Unit Tests for logic and Playwright E2E for UI/UX validation.

| Component | Type | Validation Layer | Coverage |
| :--- | :--- | :--- | :--- | 
| **Core Services**<br>`AIService.js`, `StorageService.js`, `GoogleDriveService.js` | Logic | **Unit (Jest)** | ✅ **High** – Detailed logic, retries, error handling, and migrations. |
| **Options Page**<br>`options.js`, full IDE | UI | **E2E (Playwright)** | ✅ **High** – `journey.spec`, `workspaces.spec`, `font_and_layout.spec`, `user_journey_ai_and_settings.spec`. |
| **Side Panel**<br>`sidepanel.html` + `popup.js` | UI | **E2E (Playwright)** | ✅ **High** – `sidepanel.spec`, `sidepanel_markdown.spec`, `sidepanel_ai.spec`. |
| **Markdown Rendering**<br>`libs/marked.min.js` integration | Feature | **E2E + Manual** | ✅ **High** – `markdown.spec`, `repro_stale_preview.spec` plus visual checks. |
| **AI Integration**<br>Gemini Nano / Prompt API | Feature | **Unit + E2E + Manual** | 🟢 **Improved** – Unit tests for bridge logic and meta-prompts, E2E for AI buttons in options & sidepanel, manual verification via `gemini-diagnostic.html`. |

---

## 2. Unit Test Perspective (Logic & State)
*Goal: Verify business logic in isolation without browser dependencies.*

### Covered
*   **Prompt CRUD**: Creating, reading, updating (pushing versions), and deleting prompts.
*   **Migrations**: Ensuring legacy string-array data converts to v2 object format.
*   **Google Drive Auth**: Handling token flow checks and error states (Simulated).
*   **AI Service Availability**: Parsing complicated capability states (`readily` vs `after-download`).
*   **AI Meta-Prompts**: Ensuring system prompts forbid personal names, use inline `code` placeholders, and format options with headings.
*   **Builtin AI Wrapper**: `PKBuiltinAI` tests cover availability branching and session creation/caching semantics.

### Not Covered
*   **DOM Manipulation**: `popup.js` and `options.js` event listeners are NOT unit tested.

---

## 3. Regression Test Perspective (Stability)
*Goal: Prevent re-occurrence of known bugs and ensure layout stability.*

### Critical Regression Suites
*   **`sidepanel.spec.js`**:
    *   **Layout Parity**: Ensures Side Panel buttons/headers match Options Page styling.
    *   **Button Visibility**: Verifies "Magic Optimize" appears only when valid.
*   **`repro_stale_preview.spec.js`** (New in v2.1):
    *   **Fix Verification**: Ensures Markdown preview clears previous content when switching prompts.
    *   **Race Conditions**: Rapid switching between prompts.
*   **`regression_fixes.spec.js`**:
    *   **State Leaks**: Verifies one workspace doesn't show prompts from another.
    *   **Word Count**: Verification of live stats updates.

---

## 4. User Journey & UX Validation (E2E)
*Goal: Validate the "Happy Path" and User Experience.*

### Journey A: The "Writer" (Markdown & Editing)
*   **Flow**: Create Prompt -> Toggle Preview -> Click-to-Edit -> Use Shortcut (`Cmd+B`) -> Save.
*   **Validation**: `markdown.spec.js`. Checks that:
    1.  Preview renders HTML (Safe).
    2.  Clicking preview enters Edit Mode.
    3.  Toggle button updates Icon/Title.

### Journey B: The "Organizer" (Workspaces)
*   **Flow**: Create Workspace -> Move Prompt -> Delete Workspace (Smart Delete) -> Restore.
*   **Validation**: `workspace_lifecycle.spec.js` & `workspaces.spec.js`. Checks:
    1.  Drag-and-Drop simulation.
    2.  Orphaned prompts moving to "All Prompts".
    3.  Context Menu functionality.

### Journey C: The "Optimizer" (AI)
*   **Flow** (Options IDE): Select Prompt -> Click AI buttons (Magic Enhance, Formalize, Improve Clarity, Shorten) -> Review output -> Save.
*   **Validation (Automated + Manual)**:
    * **Automated**: `user_journey_ai_and_settings.spec.js` (full editor) and `sidepanel_ai.spec.js` (side panel) using mocked `LanguageModel` to keep tests deterministic.
    * **Manual**: `gemini-diagnostic.html` for environment check and `QA-REPORT-GEMINI.md` golden-path checklist for real Gemini Nano runs.

### Streaming + Cancel (New in v2.1.x)
*   **Flow**: Click AI -> output streams into editor -> click **Cancel** to abort -> editor reverts to original -> no unsaved glow.
*   **Validation**:
    * **Automated**: `ai_cancel_and_streaming.spec.js` with a mocked `promptStreaming()` async iterator + AbortController semantics.

---

## 5. Execution
Run the full suite before any release:

```bash
# 1. Run Logic Tests
npm test

# 2. Run User Journey & Regression Tests (full E2E)
npx playwright test

# 3. Focused AI Journeys (optional, faster)
npx playwright test tests/e2e/user_journey_ai_and_settings.spec.js tests/e2e/sidepanel_ai.spec.js tests/e2e/ai_cancel_and_streaming.spec.js
```

