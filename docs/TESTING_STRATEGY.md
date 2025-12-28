# Automated Testing Strategy: PromptKeeper

## 1. Goal
Ensure full end-to-end (E2E) reliability without manual user intervention, covering the "Happy Path" of creating, editing, and syncing prompts.

## 2. Current State
*   **Unit Tests**: Exist for Services (`AIService`, `StorageService`, `GoogleDriveService`) but are currently failing or fragile.
*   **UI Tests**: Non-existent. `options.js` and `popup.js` contain logic that is untested.
*   **E2E Tests**: Previously attempted but removed due to "Headless" limitations with Extensions.

## 3. Proposed Solution: Playwright with Persistent Context
We will use [Playwright](https://playwright.dev/) which supports loading Chrome Extensions.

### Why Playwright?
*   Native support for loading extensions.
*   Ability to interact with Extension pages (`chrome-extension://...`).
*   Robust handling of asynchronous UI state.

### Implementation Plan

#### Phase A: Fix Foundations (Unit Tests)
1.  **Fix Mocks**: Update test setup to correctly mock `chrome` APIs (specifically `chrome.runtime`, `chrome.storage`, `chrome.identity`).
2.  **Green Build**: Ensure `npm test` passes before adding complexity.

#### Phase B: Test Infrastructure
1.  Create `tests/e2e/` directory.
2.  Configure `playwright.config.js` to load the extension:
    ```javascript
    const pathToExtension = path.join(__dirname, '../');
    const userDataDir = '/tmp/test-user-data-dir';
    // Launch context with extension
    ```
3.  **Headless vs Headed**: Extensions largely *do not work* in strict headless mode. We will run tests in:
    *   **Local**: Headed mode (visible browser).
    *   **CI**: `xvfb` (virtual display) on Linux agents to simulate a display, allowing "Headed" mode in a headless environment.

#### Phase C: Key Scenarios to Automate
1.  **Extension Load**: Verify popup opens and options page loads.
2.  **CRUD Operations**: Create a prompt, Edit it, Save it.
3.  **Workspace Management**: Create a new Project, Move prompt.
4.  **AI Integration**: Mock `window.ai` in the test page context to verify "Magic Enhance" calls.
5.  **Drive Backup**: Mock `chrome.identity` (challenging in E2E) or rely on unit tests for the *logic* and just verify the UI triggers the sync status.

## 4. Definition of Done
*   `npm run test` passes (Unit).
*   `npm run test:e2e` runs full user flows.
*   Coverage report indicates > 80% coverage.
