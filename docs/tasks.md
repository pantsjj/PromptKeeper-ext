# Project Tasks & Issue Drafts

This document tracks the granular tasks required to implement the Roadmap. Use these items to create GitHub Issues.

## Phase 0: Architecture & UX Foundation (Priority: Critical)
*Objective: Prepare the codebase for complexity by decoupling logic and improving the workspace.*

### Task 0.1: Service Layer Extraction
*   **Type**: Refactor
*   **Description**: Create `services/` directory and abstract logic.
*   **Sub-tasks**:
    *   `StorageService.js`: Encapsulate `chrome.storage.local` calls. Add methods: `getPrompts()`, `savePrompt(prompt)`, `deletePrompt(id)`.
    *   `AIService.js`: Encapsulate `window.ai` calls. Handle session creation and error states.
*   **Acceptance Criteria**: `popup.js` should not call `chrome.storage` directly.

### Task 0.2: Full-Page Editor (Options Page)
*   **Type**: Feature
*   **Description**: Create `options.html` and `options.js`.
*   **Features**:
    *   Two-pane layout: Sidebar (Prompt List/Folders), Main (Editor).
    *   Dark Mode styling foundation.
    *   "Open in Full Screen" button from the Popup.

## Phase 1: Data Model Refactor (Priority: High)
*Objective: Migrate from a simple string array to a robust object-based storage model.*

### Task 1.1: Define Data Interfaces
*   **Type**: Refactor
*   **Description**: Define JSDoc types for `Prompt`, `Version`, and `Project`.
*   **Structure**:
    *   `Prompt`: `{ id, projectId, title, currentVersionId, versions[], tags[], ... }`
    *   `Project`: `{ id, name, systemPrompt, ... }`

### Task 1.2: Implement Storage Migration
*   **Type**: Feature
*   **Description**: `StorageService` must handle legacy data (`string[]`) -> new format (`Prompt[]`) on initialization.

## Phase 2: Version Control System (Priority: Medium)
*Objective: Enable history tracking.*

### Task 2.1: Version Capture
*   **Type**: Logic
*   **Description**: `StorageService.updatePrompt()` should push to `versions` array instead of overwriting.

### Task 2.2: History UI
*   **Type**: UI
*   **Description**: Add History list in the Right Sidebar of the Editor.

## Phase 3: AI Optimization (Priority: Medium)
*Objective: Integrate 'Prompting 101' best practices.*

### Task 3.1: "Score My Prompt" Service
*   **Type**: AI Feature
*   **Description**: Prompt Gemini Nano to evaluate text based on Persona, Task, Context, Format.

### Task 3.2: Intent-Based Suggestions
*   **Type**: AI Feature
*   **Description**: Implement transformation presets.
*   **Presets**:
    *   **Magic Enhance**: "Rewrite this using 4 Pillars..."
    *   **Image Gen**: "Optimise for visual description..."
    *   **Professional Polish**: "Rewrite for corporate tone..."

## Phase 4: Workspaces (Priority: Low)
*Objective: Project grouping and system grounding.*

### Task 4.1: Project Logic
*   **Type**: Data
*   **Description**: Add CRUD for Projects. Link Prompts to Projects.

### Task 4.2: System Grounding
*   **Type**: Logic
*   **Description**: Prepend `Project.systemPrompt` to the User Prompt during AI optimization sessions.

## Phase 5: Google Drive Backup & Sync (Priority: High)
*Objective: Enable cross-device access and automatic backup to user's Google account.*

### Task 5.1: OAuth Setup & Manifest
*   **Type**: Configuration
*   **Description**: Configure Google Cloud OAuth credentials and update manifest.json.
*   **Sub-tasks**:
    *   Create OAuth 2.0 Client ID in Google Cloud Console
    *   Enable Google Drive API
    *   Add `identity` and `identity.email` permissions to manifest
    *   Add `oauth2` configuration with Drive AppData scope

### Task 5.2: Create SyncService
*   **Type**: Feature
*   **Description**: Build `services/SyncService.js` to handle Google Drive integration.
*   **Methods**:
    *   `signIn()`: Authenticate via Chrome Identity API
    *   `signOut()`: Revoke token and clear auth state
    *   `uploadToDrive(data)`: Upload prompts JSON to Drive AppData
    *   `downloadFromDrive()`: Fetch prompts from Drive
    *   `syncNow()`: Merge local and remote data
    *   `enableAutoSync()`: Background sync timer

### Task 5.3: UI Implementation
*   **Type**: UI
*   **Description**: Add sync controls to Options page and status indicators to Popup.
*   **Features**:
    *   "Sign in with Google" button
    *   Sync status panel (user email, last sync time)
    *   "Sync Now" manual trigger
    *   Footer sync indicator (☁️ icon with status)

### Task 5.4: StorageService Integration
*   **Type**: Integration
*   **Description**: Trigger sync on prompt save/update operations.
*   **Changes**:
    *   Modify `updatePrompt()` to call `SyncService.queueSync()`
    *   Implement debounced sync (avoid excessive API calls)

### Task 5.5: Conflict Resolution
*   **Type**: Logic
*   **Description**: Implement Last Write Wins merge strategy.
*   **Algorithm**:
    *   Compare `updatedAt` timestamps for matching prompt IDs
    *   Keep newer version, discard older
    *   Show notification of merged changes

### Task 5.6: Testing
*   **Type**: Testing
*   **Description**: Unit tests for SyncService and manual cross-device testing.
*   **Tests**:
    *   Unit: Merge logic correctness
    *   Unit: Auth token handling
    *   Manual: Sign in on Device A → Edit → Verify sync on Device B
    *   Manual: Offline mode graceful degradation
