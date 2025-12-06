# Phase 2: Version Control System
**Goal**: Enable history tracking so users can experiment fearlessly.

## Task 2.1: Version Capture Logic
**Issue Title**: Feat: Implement Versioning Logic in Save Operation
**Description**: 
Saving a prompt should no longer overwrite the data. It should append a new version.

**Acceptance Criteria**:
- [ ] Update `StorageService.savePrompt()`:
    - Check if prompt exists.
    - If yes: Create new `Version` object, push to `versions` array, update `currentVersionId`, update `updatedAt`.
    - If no: Create new `Prompt` with initial version.

## Task 2.2: History UI
**Issue Title**: Feat: Add Version History Sidebar
**Description**: 
Users need to see and select past versions.

**Acceptance Criteria**:
- [ ] Add "History" panel to the Right Sidebar in `options.html`.
- [ ] List versions by timestamp (e.g., "Today, 10:30 AM").
- [ ] Clicking a version loads its content into the Main Editor.

## Task 2.3: Revert Functionality
**Issue Title**: Feat: Add "Revert" or "Restore" Action
**Description**: 
Users should be able to promote an old version to be the "current" one.

**Acceptance Criteria**:
- [ ] Add "Restore this Version" button to the History item.
- [ ] Action: Creates a *new* version (copy of the old one) as the head (preserving linear history, git-like).
