# Changelog

All notable changes to the **PromptKeeper** extension will be documented in this file.

## [2.0.0] - 2025-12-08

### Major Features
- **Google Drive Sync**: Automatic cross-device backup and sync for your prompt library.
- **Project Workspaces**: Organize prompts into distinct Projects with drag-and-drop support.
- **System Grounding**: Define a "System Context" for each project (e.g., Brand Guidelines).
- **Full-Page Editor**: A new, spacious "IDE-like" editing environment.
- **Version History**: Linear history tracking with one-click restore.
- **AI Optimization**: Local Gemini Nano integration for "Magic Enhance", "Formalize", and more.

### New UI/UX
- **Drag-and-Drop**: Move prompts easily between workspaces.
- **Context Menus**: Right-click support for deleting prompts and workspaces.
- **Footer Status Bar**: Unified status area for AI health, word count, and version history.

### Fixed
- **Content Security Policy**: Resolved inline script violation in `gemini-diagnostic.html`.
- **UI Consistency**: Removed duplicate status bars and broken AI controls from popup.

### Architectural Changes
- **Service Layer**: Decoupled `StorageService`, `AIService`, and `GoogleDriveService`.
- **Data Model**: Migrated to UUID-based Object storage.
