# Changelog

All notable changes to the **PromptKeeper** extension will be documented in this file.

## [Unreleased] - 2025-12-06

### Added
- **Full-Page Editor**: A new, spacious "IDE-like" editing environment accessible via the Options page.
- **Version History**: Automatically tracks changes to prompts. Users can now view and preview previous versions of their prompts.
- **Service Layer Architecture**: Introduced `StorageService` and `AIService` to decouple logic from the UI, improving maintainability and testability.
- **Data Model Migration**: Automatically migrates legacy text-only prompts to a robust object-based structure with metadata (ID, Title, Versions).
- **Unit Testing Infrastructure**: Added Jest and Babel support for testing the new service layer.

### Changed
- **Popup UI**: Refactored `popup.js` to utilize the new `StorageService`.
- **Storage**: Moved from a simple array of strings to a structured `Prompt` object model in `chrome.storage.local`.
- **Styling**: Implemented foundational CSS variables for theming and Dark Mode support in the Editor.

### Fixed
- Addressed limitations of the small popup window by providing a dedicated workspace.
