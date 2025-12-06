# Phase 1: Data Model Refactor
**Goal**: Migrate from a simple string array to a robust object-based storage model to support versioning and metadata.

## Task 1.1: Define Data Interfaces
**Issue Title**: Dev: Define Data Models for Prompts and Projects
**Description**: 
We need a strict schema for our data to ensure consistency.

**Acceptance Criteria**:
- [ ] Define JSDoc (or TS interfaces) for:
    - `Prompt`: `{ id: string, title: string, currentVersionId: string, versions: Version[], tags: string[], projectId?: string, ... }`
    - `Version`: `{ id: string, content: string, timestamp: number, author?: string }`
    - `Project`: `{ id: string, name: string, systemPrompt: string }`
- [ ] Document these in a `types.js` or `models.js` file (even if just comments for now).

## Task 1.2: Migration Utility
**Issue Title**: Feat: Implement Data Migration Service
**Description**: 
Existing users have `['string1', 'string2']`. We must convert this to the new object format without data loss.

**Acceptance Criteria**:
- [ ] Create `services/MigrationService.js`.
- [ ] Implement `migrateV1toV2()` function:
    - Read old storage.
    - If array of strings: Map to `Prompt` objects with UUIDs.
    - Save new structure.
- [ ] call this migration on extension startup (or access).

## Task 1.3: Update UI for Objects
**Issue Title**: Refactor: Update Prompt List UI to support Objects
**Description**: 
The UI currently expects strings. It needs to handle the new `Prompt` object structure.

**Acceptance Criteria**:
- [ ] Update `StorageService.getPrompts()` to return the new objects.
- [ ] Update `popup.js` (and `options.js`) to:
    - Display `prompt.title` in the list.
    - Pass `prompt.id` to delete/edit actions.
