# Phase 0: Architecture & UX Foundation
**Goal**: Decouple logic from UI and provide a robust "IDE-like" environment for prompt engineering.

## Task 0.1: Service Layer Extraction
**Issue Title**: Refactor: Extract Storage and AI logic into Service Layer
**Description**: 
Currently, `popup.js` contains mixed logic for UI, storage, and AI communication. We need to separate concerns to support the new Options page and cleaner testing.

**Acceptance Criteria**:
- [x] Create `services/StorageService.js`:
    - Implement `getPrompts()`
    - Implement `savePrompt(promptData)`
    - Implement `deletePrompt(id)`
- [x] Create `services/AIService.js`:
    - Encapsulate `window.ai` session creation.
    - Handle `availability` checks and `downloadprogress` monitoring.
- [x] Refactor `popup.js` to import and use these services instead of direct API calls.

## Task 0.2: Full-Page Editor (Options Page) Scaffold
**Issue Title**: Feat: Scaffold Full-Page Editor (Options Page)
**Description**: 
The popup is too small for complex prompt editing. We need a full-page "IDE".

**Acceptance Criteria**:
- [x] Create `options.html` and `options.js`.
- [x] Configure `manifest.json` to register the options page.
- [x] Implement a basic layout:
    - **Left Sidebar**: List of prompts (placeholder).
    - **Main Area**: Textarea for editing.
    - **Right Sidebar**: AI Tools/History (placeholder).
- [x] Add an "Open Full Editor" button to `popup.html`.

## Task 0.3: Visual Polish & Dark Mode Foundation
**Issue Title**: Feat: Implement Dark Mode and Basic Styling
**Description**: 
Establish a professional look and feel using CSS variables for theming.

**Acceptance Criteria**:
- [x] Define CSS variables for colors (bg, text, primary, accent).
- [x] Implement a toggle for Light/Dark mode.
- [x] Apply basic "Card" styling to prompt list items.
