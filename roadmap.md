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
*Goal: Leverage Chrome's built-in AI using the "Hybrid API" framework (Prompt + Rewriter).*

*   [x] **Refinement Actions**: Quick actions for "Formalize" (Rewriter API), "Summarize" (Summarizer API), "Clarify" (Prompt API).
*   [x] **Intent-Based Suggestions (Auto-Generate)**:
    *   **"Magic Enhance"**: Extracts intent from rough notes and formats it (Prompt API).
    *   **"Professional Polish"**: Rewrites for business context (Rewriter API).
*   [x] **Model Management**: Diagnostic "Traffic Light" UI and Helper Guides for model availability.

## Phase 3.5: Offscreen Document for AI Access
*Goal: Workaround Chrome's limitation where `window.ai` is not available in extension contexts.*

*   [x] **Offscreen Document**: Created hidden web page (`offscreen.html`) where `window.ai` IS accessible.
*   [x] **Message Passing**: Implemented `chrome.runtime.sendMessage()` bridge between extension pages and offscreen document.
*   [x] **Background Service Worker**: Manages offscreen document lifecycle (create on startup, ensure exists before operations).
*   [x] **AIService Refactor**: Updated to use message passing instead of direct `window.ai` access.
*   [x] **Manifest Updates**: Added `offscreen` permission and `background.service_worker` configuration.

**Technical Note**: Chrome only exposes `window.ai` to web page contexts, not extension contexts (popup, options, background). This phase implements the official workaround using Offscreen Documents (Chrome 109+).

**Documentation**: See [`docs/phases/phase-3.5-offscreen-document.md`](file:///Users/jp/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/workspaces/PromptKeeper-ext/docs/phases/phase-3.5-offscreen-document.md)

---

## Phase 4: Workspaces & Context Management
*Goal: Structure and coherency through "Project" grouping and shared grounding.*

*   [x] **Project Workspaces**: Group prompts into specific "Projects" (e.g., "Work Image Gen", "Professional Dev").
*   [x] **System Grounding (Shared Context)**:
    *   Define a "System Prompt" or "Base Context" at the project level (e.g., "You are a senior brand strategist ensuring consistency with [Brand Guidelines]").
    *   This grounding context is automatically applied when optimizing prompts within the project or provided as context to the AI model.
*   [x] **Variable Support**: Support `{{variable_name}}` syntax. (Note: Implemented via manual edit/refine flow for now).
*   [x] **Tagging System**: Filter prompts by tags. (Covered by Project grouping).
*   [x] **Export/Import**: JSON export/import for backup or sharing.

## Phase 5: Google Drive Backup & Sync
*Goal: Enable cross-device access and automatic backup to user's Google account.*

*   [ ] **Google Sign-In**: Authenticate users via Chrome Identity API.
*   [ ] **Automatic Backup**: Upload prompts to Google Drive AppData folder on every save.
*   [ ] **Cross-Device Sync**: Download and merge prompts when signing in on a new device.
*   [ ] **Conflict Resolution**: Handle edits made on multiple devices (Last Write Wins strategy).
*   [ ] **Auto-Sync**: Background sync every 5 minutes when changes detected.
*   [ ] **Sync Status UI**: Visual indicators showing sync state and last sync time.
*   [ ] **Opt-Out Support**: Users can remain in local-only mode if preferred.

**Target Version**: v2.1 or v3.0  
**Estimated Effort**: 2-3 weeks  
**Documentation**: See [`docs/phases/phase-5-google-drive-sync.md`](file:///Users/jp/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/workspaces/PromptKeeper-ext/docs/phases/phase-5-google-drive-sync.md)

---

## Future Scope / Experimental
*   **"Score" Action**: Analyze prompts against the 4 Pillars. (Deferred: Gemini Nano lacks sufficient reasoning capability for objective scoring).
*   **"Image Gen Preset"**: Optimizes for visual models. (Deferred: Requires larger model knowledge base).
*   **Dynamic Variable Injection**: Form-based filling of `{{variables}}`.
*   **Diff View**: Visual text comparison between revisions.

## Success Metrics
*   **Trust**: User data never leaves the device.
*   **Performance**: AI operations take < 2 seconds (after model load).
*   **Utility**: Users can "Time Travel" through their prompt versions.

