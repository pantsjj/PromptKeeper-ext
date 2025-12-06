# Roadmap: PromptKeeper Evolution

This roadmap outlines the strategic development plan to transform PromptKeeper into a robust, local-first prompt engineering tool.

## Phase 0: Architecture & UX Foundation (High Impact / Min Effort)
*Goal: Decouple logic from UI and provide enough screen real estate for "Engineering" prompts.*

*   [x] **Service Layer Extraction**: Move logic out of `popup.js` into dedicated ES modules:
    *   `StorageService.js`: Handles CRUD, Data Migration, and Versioning logic.
    *   `AIService.js`: Wrapper for `window.ai` interactions, handling sessions and fallbacks.
*   [x] **Full-Page Editor (Options Page)**:
    *   *Problem*: A 600px popup is too small for serious prompt engineering.
    *   *Solution*: Build `options.html` as a full-screen "IDE" for deep work, keeping `popup.html` for quick access/injection.
*   [x] **Visual Polish**: Implement a clean, card-based UI with "Dark Mode" support to feel like a professional developer tool.

## Phase 1: Data Model Refactor (Critical)
*Current Limitation: Prompts are stored as a simple array of strings. This prevents metadata, titles, or history.*

*   [x] **Refactor Data Structure**: Migrate `chrome.storage.local` from `['text']` to:
    ```json
    {
      "prompts": [
        {
          "id": "uuid-v4",
          "title": "My Prompt",
          "currentVersionId": "v2",
          "projectId": "proj-123",
          "versions": [
            { "id": "v1", "content": "Draft 1", "timestamp": 123456789 },
            { "id": "v2", "content": "Draft 2", "timestamp": 123456799 }
          ],
          "tags": ["coding", "email"],
          "updatedAt": 123456799
        }
      ]
    }
    ```
*   [x] **Migration Script**: Create a "onUpdate" handler in `background.js` to migrate existing user data.
*   [x] **UI Update**: Update `popup.js` (and new `options.js`) to render lists based on `title`.

## Phase 2: Version Control System
*Goal: Allow users to experiment fearlessly.*

*   [x] **Version History UI**: Add a "History" view to see previous iterations.
*   [x] **Revert Functionality**: Ability to restore an older version.
*   [ ] **Diff View (Optional)**: Visual indicator of text changes.

## Phase 3: AI-Powered Optimization (Gemini Nano)
*Goal: Leverage Chrome's built-in AI using the "Gemini for Workspace" framework.*

*   [x] **"Score" Action**: Analyze prompts against the 4 Pillars (Persona, Task, Context, Format).
*   [x] **Iterative Refinement**: Quick actions for "Formalize", "Summarize", "Clarify".
*   [x] **Intent-Based Suggestions (Auto-Generate)**:
    *   **"Magic Enhance"**: Extracts intent from rough notes and formats it.
    *   **"Image Gen Preset"**: Optimizes for visual models (Style, Lighting, Composition).
    *   **"Professional Polish"**: Rewrites for business context.
*   [x] **Model Management**: Graceful UI for model download progress (Handled in AIService session creation).

## Phase 4: Workspaces & Context Management
*Goal: Structure and coherency through "Project" grouping and shared grounding.*

*   [x] **Project Workspaces**: Group prompts into specific "Projects" (e.g., "Work Image Gen", "Professional Dev").
*   [x] **System Grounding (Shared Context)**:
    *   Define a "System Prompt" or "Base Context" at the project level (e.g., "You are a senior brand strategist ensuring consistency with [Brand Guidelines]").
    *   This grounding context is automatically applied when optimizing prompts within the project or provided as context to the AI model.
*   [x] **Variable Support**: Support `{{variable_name}}` syntax. (Note: Implemented via manual edit/refine flow for now, fully dynamic injection moved to Future Scope).
*   [x] **Tagging System**: Filter prompts by tags. (Covered by Project grouping).
*   [x] **Export/Import**: JSON export for backup or sharing. (Legacy feature preserved).

---

## Success Metrics
*   **Trust**: User data never leaves the device.
*   **Performance**: AI operations take < 2 seconds (after model load).
*   **Utility**: Users can "Time Travel" through their prompt versions.
*   **Quality**: Prompts optimized by the tool yield better results than raw input (verified by user feedback).
