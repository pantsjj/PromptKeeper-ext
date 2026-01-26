# Changelog

All notable changes to the **PromptKeeper** extension will be documented in this file.

## [2.2.0] - 2026-01-25

### ✨ New Features

- **Prompt Coach**: Real-time AI-powered prompt quality scoring (0-100) with visual hashtag attribute tags (`#persona`, `#context`, `#templated`, `#specific`, `#structured`). Guides users toward better prompts as they type. Powered by Gemini Nano.
- **Prompt Sorting**: Sort prompts by Name (A-Z/Z-A), Newest First, Oldest First, or Recently Modified. Preference persists across sessions.
- **Theme Toggle**: Choose Light, Dark, or Auto (system) theme. Syncs consistently between Side Panel and Options page.
- **Keyboard Shortcut Settings**: Quick link to `chrome://extensions/shortcuts` for configuring the side panel hotkey (default: `Ctrl+Shift+P` / `⌘+Shift+P`).
- **Placeholder UX**: Double-click to select entire placeholder patterns (`[placeholder]`, `` `[placeholder]` ``, `{{mustache}}`). Placeholders are visually highlighted in preview mode (blue, bold) for easy identification.

### 🐛 Bug Fixes

- **Modal Dialogs**: Replaced native `confirm()`/`alert()` with custom modal system to eliminate flickering in Chrome Side Panel.
- **AI Concurrency**: Fixed data loss when switching prompts during AI streaming. Streams are now prompt-aware.
- **"No output language" Warning**: Eliminated console warning on first AI call.
- **Dark Mode**: Fixed context menu visibility, Cancel/Stop button text, and sidebar item colors.
- **Light Mode**: Fixed faded text in sidebar items when Light theme is forced.
- **Settings Scroll**: Fixed right sidebar scrolling so all settings are accessible.
- **Sort Dropdown**: Fixed prompts disappearing when cycling through sort options.
- **Prompt Coach Version Selection**: Score now updates correctly when selecting historical revisions.
- **Markdown Preview Scroll**: Fixed missing scrollbar in preview mode for long prompts.

### 🧪 Technical

- **E2E Tests**: 89+ tests passing. Added `theme_settings.spec.js`, `bugfix_sorting_and_coach.spec.js`, updated modal and workspace lifecycle tests.
- **Prompt Coach Documentation**: Added comprehensive guide at `how_to.html#prompt-coach`.

---

## [2.1.1] - 2025-12-29

### ✨ Improvements
- **Built-in AI UX**: AI output can stream into the editor (where supported), and AI buttons switch to **Cancel** so you can abort long operations safely.
- **Model Download Feedback**: Surfaces “Downloading…” progress indicators during Gemini Nano model warm-up/download (when Chrome provides progress events).
- **Local Model Stats**: Shows a compact “Local Model Stats” line (token usage/quota when available) under the editor in both full editor and side panel.

### 🐛 Fixes
- **CSP-safe AI bootstrap**: Consolidated AI bootstrap logic via external shims/wrappers to avoid MV3 inline-script CSP violations and reduce duplication.

## [2.1.0] - 2025-12-29

### ✨ New Features
- **Markdown Support**: Prompts now render Bold, Italic, Lists, and Headers.
- **Click-to-Edit**: Seamlessly toggle between read-only markdown preview and edit mode by clicking the text.
- **Keyboard Shortcuts**: Added `Cmd+B` (Bold) and `Cmd+I` (Italic) outputting standard markdown syntax.
- **Rich Paste**: "Paste to Page" automatically strips markdown formatting to ensure clean text insertion into web forms.
- **Editor Font Controls**: Adjustable editor/preview font size (with presets) shared between full editor and side panel for better readability.
- **Resizable Layout**: Right-hand options/AI panel is now resizable and independently scrollable, so backup and stats content remains accessible on smaller screens.
- **Streaming Local AI**: Where supported, AI output streams into the editor progressively instead of waiting for a single final response.
- **Cancel AI Operations**: AI buttons switch to **Cancel** while running so you can abort long operations safely.
- **Model Download Progress**: Surfaces “Downloading…” indicators during Gemini Nano model warm-up/download (when Chrome provides progress events).

### 🐛 Bug Fixes
- **AI Configuration**: Fixed "Not Supported" error for Gemini Nano by enforcing `expectedContext: 'en'` during session creation.
- **AI Language Safety Warning**: Enforced language options across `create()`, `availability()`, and `capabilities()` without violating MV3 CSP (external shim).
- **Side Panel**: Improved layout stability, button visibility logic, and ensured the panel can always be reopened from the extension icon even after jumping into full-page management.
- **Preview Rendering**: Fixed stale content issue when switching rapidly between prompts.
- **AI Personas**: Tightened AI meta-prompts to avoid invented personal names and ensure placeholders are clearly marked for user input.

### 🧪 Technical
- **E2E Testing**: Added comprehensive test suites for Markdown Support (`markdown.spec.js`) and Regression fixes.
- **Accessibility & Layout Tests**: Added tests covering editor font-size propagation, right-pane resizing/scrolling, and side panel "Manage" behaviour.
- **Documentation**: Consolidated detailed test strategies and architectural decisions.

---

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
