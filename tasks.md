# Project Tasks & Issue Drafts

This document tracks the granular tasks required to implement the Roadmap. Use these items to create GitHub Issues.

## Phase 1: Foundation & Data Model Refactor (Priority: High)
*Objective: Migrate from a simple string array to a robust object-based storage model to support versioning and metadata.*

### Task 1.1: Define Data Interfaces
*   **Type**: Refactor
*   **Description**: Create a shared definition (JSDoc or separate file) for the new Prompt object structure.
*   **Acceptance Criteria**:
    *   `Prompt` object defined with: `id` (UUID), `title`, `currentVersionId`, `versions` (array), `tags`, `createdAt`, `updatedAt`.
    *   `Version` object defined with: `id`, `content`, `timestamp`, `author` (optional).

### Task 1.2: Implement Storage Migration Service
*   **Type**: Feature
*   **Description**: Implement a one-time migration script in `background.js` (or a dedicated utility) that runs on extension update.
*   **Logic**:
    *   Read `chrome.storage.local.get('prompts')`.
    *   Detect if format is `Array<string>` (old) or `Array<object>` (new).
    *   If old, map each string to a new `Prompt` object:
        *   `id`: Generate UUID.
        *   `title`: Truncate content to 20 chars or use "Untitled".
        *   `versions`: Create single version with content.
    *   Save back to storage.
*   **Acceptance Criteria**:
    *   Existing user data is preserved and converted to new format on reload.
    *   New installs initialize with empty object structure.

### Task 1.3: Update Popup UI for Object Support
*   **Type**: Refactor
*   **Description**: Update `popup.js` to render the list of prompts from the new object structure.
*   **Changes**:
    *   `displayPrompts()`: Iterate over objects. Display `title` instead of raw text.
    *   Add "Edit" view or modal to view full content/versions (precursor to Phase 2).
    *   Update "Add" and "Delete" functions to handle objects.

## Phase 2: Version Control System (Priority: Medium)
*Objective: Enable history tracking for prompts.*

### Task 2.1: Version Capture Logic
*   **Type**: Feature
*   **Description**: Modify the "Save" function. Instead of overwriting, push a new entry to the `versions` array and update `currentVersionId`.

### Task 2.2: History UI
*   **Type**: Feature
*   **Description**: Add a "History" tab or dropdown in the prompt detail view.
*   **Acceptance Criteria**:
    *   User can see list of past versions with timestamps.
    *   Clicking a past version displays its content.

## Phase 3: AI Optimization (Priority: Medium)
*Objective: Integrate 'Prompting 101' best practices using Gemini Nano.*

### Task 3.1: "Score My Prompt" Service
*   **Type**: AI Feature
*   **Description**: Implement a function in `injectedScript.js` that prompts the `window.ai` model to evaluate the user's text.
*   **Prompt Strategy**:
    *   System Prompt: "You are an expert prompt engineer. Evaluate the following prompt based on four criteria: Persona, Task, Context, Format. Output JSON with a score (1-10) and brief suggestions."

### Task 3.2: "Refine" Quick Actions
*   **Type**: AI Feature
*   **Description**: Add UI buttons for standard refinements defined in the guide.
*   **Actions**:
    *   "Formalize" (Tone)
    *   "Clarify Task" (Task)
    *   "Add Persona" (Persona)

### Task 3.3: Intent-Based Suggestions
*   **Type**: AI Feature
*   **Description**: Implement specialized transformation prompts in `injectedScript.js`.
*   **Sub-tasks**:
    *   **Magic Enhance**: Create a meta-prompt that extracts the "essence" of a rough input and reformats it.
    *   **Image Gen Preset**: Create a meta-prompt optimized for visual descriptions (Subject, Style, Mood, Lighting).
    *   **Professional Polish**: Create a meta-prompt that rewrites text for business communication.

## Phase 4: Workspaces & Context Management (Priority: Low)
*Objective: Implement Project grouping and shared system context.*

### Task 4.1: Project Data Model
*   **Type**: Data
*   **Description**: Extend the data model to support `Projects`.
*   **Structure**:
    *   `Project` object: `id`, `name`, `systemPrompt` (the grounding context), `promptIds` (array of linked prompts).
    *   Update `Prompt` object to include `projectId`.

### Task 4.2: Workspace UI
*   **Type**: UI
*   **Description**: Create a sidebar or dropdown to switch between "All Prompts" and specific Projects.
*   **Features**:
    *   "Create Project" modal (Name + Optional System Prompt).
    *   Drag-and-drop or checkbox selection to move prompts into a project.

### Task 4.3: System Grounding Logic
*   **Type**: Logic
*   **Description**: Ensure that when a prompt is "Optimized" or "scored", the Project's `systemPrompt` is included in the context sent to Gemini Nano.
*   **Logic**: `Context = Project.systemPrompt + CurrentPrompt`.
