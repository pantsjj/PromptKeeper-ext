# Changelog

All notable changes to the **PromptKeeper** extension will be documented in this file.

## [Unreleased] - 2025-12-06

### Added
- **Full-Page Editor**: A new, spacious "IDE-like" editing environment accessible via the Options page.
- **Version History & Restore**: Automatically tracks changes. Users can view past versions and **restore** any previous version with a single click (linear history preservation).
- **AI Scoring & Optimization**: Integrated Gemini Nano to score prompts (1-10) based on Persona, Task, Context, and Format.
- **Intent-Based Refinement**: Added "Magic Enhance", "Image Gen", and "Formalize" presets to instantly rewrite prompts for specific goals.
- **Prompting Principles Guide**: Added `PROMPTING_PRINCIPLES.md`, a definitive guide on the "4 Pillars" of prompting, available for user and AI reference.
- **Service Layer Architecture**: Introduced `StorageService` and `AIService` to decouple logic from the UI.
- **Data Model Migration**: Automatically migrates legacy text-only prompts to a robust object-based structure with metadata (ID, Title, Versions).
- **Unit Testing Infrastructure**: Added Jest and Babel support for testing the new service layer.

### Changed
- **Popup UI**: Refactored `popup.js` to utilize the new `StorageService`.
- **Storage**: Moved from a simple array of strings to a structured `Prompt` object model in `chrome.storage.local`.
- **Styling**: Implemented foundational CSS variables for theming and Dark Mode support in the Editor.

### Fixed
- Addressed limitations of the small popup window by providing a dedicated workspace.
