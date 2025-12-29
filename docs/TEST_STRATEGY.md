# PromptKeeper Testing Strategy (v2.1)

**Status**: Active for v2.1.0  
**Scope**: Unit, E2E, Regression, and User Experience Validation.

---

## 1. Component Coverage Matrix

We employ a "Testing Pyramid" approach, relying on Unit Tests for logic and Playwright E2E for UI/UX validation.

| Component | Type | Validation Layer | Coverage |
| :--- | :--- | :--- | :--- | 
| **Core Services**<br>(`AIService.js`, `StorageService.js`, `GoogleDriveService.js`) | Logic | **Unit (Jest)** | ✅ **High**<br>Covers detailed logic, error handling, and migrations. |
| **Options Page**<br>(`options.js`, Full IDE) | UI | **E2E (Playwright)** | ✅ **High**<br>Covered by `journey.spec` and `workspaces.spec`. |
| **Side Panel**<br>(`sidepanel.js`, Companion) | UI | **E2E (Playwright)** | ✅ **High**<br>Covered by `sidepanel.spec` and `sidepanel_markdown.spec`. |
| **Markdown Rendering**<br>(`marked.js` Integration) | Feature | **E2E + Manual** | ✅ **High**<br>Covered by `markdown.spec` and visual checks. |
| **AI Integration**<br>(Gemini Nano Bridge) | Feature | **Manual + Unit** | 🟡 **Mixed**<br>Unit tests verify *logic*; Validation relies on `gemini-diagnostic.html`. |

---

## 2. Unit Test Perspective (Logic & State)
*Goal: Verify business logic in isolation without browser dependencies.*

### covered
*   **Prompt CRUD**: Creating, reading, updating (pushing versions), and deleting prompts.
*   **Migrations**: Ensuring legacy string-array data converts to v2 object format.
*   **Google Drive Auth**: Handling token flow checks and error states (Simulated).
*   **AI Service Availability**: Parsing complicated capability states (`readily` vs `after-download`).

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
*   **Flow**: Select Prompt -> Click "Magic Enhance" -> Review Output.
*   **Validation**: **Manual** (due to API experimental nature).
    *   Uses `gemini-diagnostic.html` for environment check.
    *   Uses "Golden Path" manual checklist in `QA-REPORT-GEMINI.md`.

---

## 5. Execution
Run the full suite before any release:

```bash
# 1. Run Logic Tests
npm test

# 2. Run User Journey & Regression Tests
npm run test:e2e
```
