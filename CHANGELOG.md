# Changelog

All notable changes to the **PromptKeeper** extension will be documented in this file.

## [2.0.0] - 2025-12-06

### Major Features
- **Project Workspaces**: Organize prompts into distinct Projects (e.g., "Work", "Creative").
- **System Grounding**: Define a "System Context" for each project (e.g., Brand Guidelines) that is automatically applied to all AI optimization tasks within that workspace.
- **Full-Page Editor**: A new, spacious "IDE-like" editing environment accessible via the Options page.
- **Version History & Restore**: Automatically tracks changes. Users can view past versions and **restore** any previous version with a single click.
- **AI Scoring & Optimization**: Integrated Gemini Nano to score prompts (1-10) and refine them using "Magic Enhance", "Image Gen", and "Formalize" presets.

### Architectural Changes
- **Service Layer**: Decoupled `StorageService` and `AIService`.
- **Data Model**: Migrated to UUID-based Object storage.

### Added
- **Prompting Principles Guide**: Added `PROMPTING_PRINCIPLES.md`.
