# Phase 4: Workspaces & Context Management
**Goal**: Structure and coherency through Project grouping and shared grounding.

## Task 4.1: Project Data Model & UI
**Issue Title**: Feat: Implement Project Creation and Management
**Description**: 
Users need to organize prompts into "Projects".

**Acceptance Criteria**:
- [x] Update StorageService to handle `Projects`.
- [x] Add "Create Project" modal in the UI.
- [x] Add Sidebar navigation to filter prompts by Project.

## Task 4.2: System Grounding (Context)
**Issue Title**: Feat: Implement System Grounding for Projects
**Description**: 
Projects should have a "Base Context" that applies to all prompts within them.

**Acceptance Criteria**:
- [x] Add `systemPrompt` field to Project creation.
- [x] When using AI (Optimization/Scoring) for a prompt in a Project, prepend the `systemPrompt` to the context window.
- [x] UI visual indicator: "Using Context: [Project Name]".

## Task 4.3: Variables & Tags
**Issue Title**: Feat: Support Variables and Tags
**Description**: 
Advanced templating.

**Acceptance Criteria**:
- [ ] Detect `{{variable}}` syntax in Editor.
- [ ] On "Copy" or "Inject", show a modal asking for values for each variable.
- [ ] Add tagging support to the Prompt metadata.
