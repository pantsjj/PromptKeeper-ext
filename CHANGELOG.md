# Changelog

All notable changes to the **PromptKeeper** extension will be documented in this file.

## [2.0.0] - 2025-12-25

### 🎉 Major Release: The Local AI Prompt IDE

This release transforms PromptKeeper from a simple prompt saver into a full-featured, privacy-first prompt engineering workspace.

### ✨ New Features
- **Google Drive Sync**: Automatic backup to your private Drive AppData folder. Access prompts on any device.
- **Project Workspaces**: Organize prompts into named projects with drag-and-drop support.
- **Version History**: Every save creates a new version. Time-travel to restore any previous iteration.
- **Full-Screen IDE**: A dedicated, spacious editing environment with AI tools in the sidebar.
- **Local AI Optimization (Gemini Nano)**: Magic Enhance, Formalize, Clarify, and Shorten—all on-device, no API keys.

### 🎨 UI/UX Improvements
- **Drag-and-Drop**: Move prompts between workspaces effortlessly.
- **Context Menus**: Right-click to delete prompts or workspaces.
- **Footer Status Bar**: Unified view of AI health, word count, and version history.
- **Dark Mode**: Automatic system theme detection.

### 🐛 Bug Fixes
- Fixed E2E test regression in workspace creation flow.
- Resolved all ESLint warnings and unused variables.
- Fixed Content Security Policy violation in diagnostic pages.
- Removed duplicate UI elements from popup.

### 🏗️ Architecture
- **Service Layer**: Decoupled `StorageService`, `AIService`, and `GoogleDriveService`.
- **Data Model**: Migrated to normalized UUID-based object storage.
- **Test Coverage**: Full E2E test suite with Playwright.

---

## [1.0.8] - 2024-12-08

### Fixed
- Minor bug fixes and stability improvements.

---

## [1.0.0] - 2024-11-01

### Initial Release
- Save and manage prompts locally.
- Export/Import prompts as JSON.
- Paste prompts directly into web pages.
