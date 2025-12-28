# Refactoring Plan: options.js

## 1. Goal
Deconstruct the monolithic `options.js` (~840 lines) into smaller, testable ES Modules. This will improve maintainability, verify `UI` logic with unit tests, and separate concerns.

## 2. Analysis of Current State
`options.js` currently handles:
1.  **State Management**: `currentPromptId`, `currentProjectId`, `searchFilter`, etc.
2.  **DOM Binding**: Massive `init()` function binding ~30 elements.
3.  **Event Handling**: Listeners for clicks, drags, inputs.
4.  **UI Rendering**: Functions like `renderPromptList`, `renderProjectItem`.
5.  **Service Integration**: Direct calls to `StorageService`, `AIService`, `GoogleDriveService`.

## 3. Proposed Architecture (Phase 1)
We will adopt a **Component-Based Architecture** using vanilla JS ES Modules.

### Directory Structure
```
options/
├── main.js              (Entry point, initializes app)
├── state/
│   └── Store.js         (Centralized state management)
├── services/            (Existing services)
└── components/
    ├── Sidebar.js       (Project & Prompt lists)
    ├── Editor.js        (Title, TextArea, Stats)
    ├── AIPanel.js       (AI Tools, Right Sidebar)
    ├── CloudPanel.js    (Google Drive integration)
    └── Footer.js        (Status bar, history)
```

## 4. Execution Phases

### Phase A: State Extraction
**Goal**: Move global variables (`currentPromptId`, etc.) into a reactive `Store`.
*   [ ] Create `options/state/Store.js`.
*   [ ] Implement a simple Publisher-Subscriber pattern for state changes.

### Phase B: Component Extraction
**Goal**: Move rendering logic into specific files.
*   [ ] **Sidebar**: Move `loadWorkspaces`, `renderProjectItem`, `renderPromptList`.
*   [ ] **Editor**: Move `savePrompt`, `createNewPrompt`, `updateStats`.
*   [ ] **CloudPanel**: Move `handleGoogleSignIn`, `handleBackup` logic.

### Phase C: Integration
**Goal**: Wire components together in `main.js`.
*   [ ] Update `options.html` to import `main.js` (type="module").
*   [ ] Ensure components subscribe to `Store` updates.

## 5. Action Steps

1.  **Create Store**: Implement `Store` class with `subscribe()`, `setState()`, `getState()`.
2.  **Create Editor Component**: Extract `Editor` class that accepts `Store` in constructor. Move text area logic there.
3.  **Create Sidebar Component**: Extract `Sidebar` class. Logic for rendering lists.
4.  **Refactor Main**: `main.js` should just bootstrap:
    ```javascript
    const store = new Store();
    new Sidebar(document.getElementById('sidebar'), store);
    new Editor(document.getElementById('editor'), store);
    ```

## 6. Risks
*   **Regression**: Breaking existing Features during migration.
*   *Mitigation*: Use the existing E2E Smoke Test to verify basic functionality after *each* extraction.
