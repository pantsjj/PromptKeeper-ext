# PromptKeeper - The Local AI Prompt IDE

**PromptKeeper** is a privacy-first Chrome Extension designed to help you manage, optimize, and engineer prompts for Generative AI. It transforms your browser into a local prompt engineering workspace.

## Key Features (v2.0)

### 🧠 Native AI Optimization (Gemini Nano)
Leverages Chrome's built-in AI (Gemini Nano) to optimize your prompts **locally**—no API keys required, no data leaves your device.
*   **Score My Prompt**: Get a 1-10 rating based on the "4 Pillars" (Persona, Task, Context, Format).
*   **Magic Enhance**: Instantly rewrite rough notes into structured prompts.
*   **Image Gen Preset**: Optimize prompts for Midjourney/DALL-E with lighting and style keywords.

### 🗂️ Workspaces & Projects
Organize your prompts into **Projects** (e.g., "Work", "Creative", "Coding").
*   **System Grounding**: Define a "System Context" (e.g., Brand Voice, Code Style) for a Project. This context is **automatically applied** to all AI optimizations within that project, ensuring consistency.

### 📜 Version Control
Never lose an idea. PromptKeeper tracks every save as a new **Version**.
*   **Time Travel**: View history and revert to any previous version with a single click.
*   **Linear History**: Restoring creates a new version, preserving the audit trail.

### ⚡ Privacy First
*   **Local Storage**: All data is stored in `chrome.storage.local`.
*   **Local AI**: All inference happens on-device via `window.ai`.

## Installation

1.  Clone this repository.
2.  Open `chrome://extensions/`.
3.  Enable **Developer mode**.
4.  Click **Load unpacked** and select this directory.
5.  Right-click the extension icon and select **Options** to open the full IDE.

## Architecture

*   **`services/`**: Core logic (`StorageService`, `AIService`).
*   **`options.html`**: The main "IDE" workspace.
*   **`popup.html`**: Quick access for copy/pasting.
*   **`PROMPTING_PRINCIPLES.md`**: The system prompt guidelines used by the AI.

## Requirements
*   Chrome 128+ (for Built-in AI).
*   Gemini Nano model downloaded (Chrome manages this automatically).

