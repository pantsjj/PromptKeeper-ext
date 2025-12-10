# PromptKeeper - The Local AI Prompt IDE

**PromptKeeper** is a privacy-first Chrome Extension designed to help you manage, optimize, and engineer prompts for Generative AI. It transforms your browser into a local prompt engineering workspace with built-in AI capabilities.

## ✨ New in v2.0

### ☁️ Google Drive Sync & Backup
Automatically back up your prompts to your private Google Drive AppData folder.
*   **Cross-Device Sync**: Access your prompt library on any computer by signing in.
*   **Privacy First**: Your data stays in your personal Drive; we never see it.
*   **Offline Support**: Work offline and sync automatically when you reconnect.

### 🧠 Native AI Optimization (Gemini Nano)
Leverages Chrome's built-in AI (Gemini Nano) to optimize your prompts **locally**—no API keys required, no data leaves your device.
*   **Magic Enhance**: Instantly rewrite rough notes into structured prompts.
*   **Formalize / Clarify / Shorten**: Quick-refinement tools for your text.
*   **Diagnostic Tool**: Built-in checker to verify your local AI availability.

### 🗂️ Workspaces & Projects
Organize your prompts into **Projects** (e.g., "Work", "Creative", "Coding").
*   **Drag-and-Drop**: Easily move prompts between workspaces.
*   **Context Menus**: Right-click to delete prompts or workspaces.

### 📜 Version Control
Never lose an idea. PromptKeeper tracks every save as a new **Version**.
*   **Linear History**: View all previous iterations in the footer status bar.
*   **Time Travel**: Restore any previous version with a single click.

## 🚀 Getting Started

### Prerequisites
To use the local AI features, you need:
1.  **Chrome 128+**
2.  **Gemini Nano** enabled in Chrome.
    *   Go to `chrome://flags`
    *   Enable **Enables optimization guide on device** (`#optimization-guide-on-device-model`)
    *   Enable **Prompt API for Gemini Nano** (`#prompt-api-for-gemini-nano`)
    *   Relaunch Chrome.

### Installation (Developer Mode)
1.  Download or clone this repository.
2.  Open `chrome://extensions/` in Chrome.
3.  Enable **Developer mode** (top right).
4.  Click **Load unpacked** and select the extension folder.
5.  Pin the **PromptKeeper** icon 📌 to your toolbar.

## 📖 Usage Guide

### Full-Screen IDE
Right-click the extension icon and select **Options** (or click "Manage Prompts" in the popup). This is your main workspace for deep work.
*   **Left Sidebar**: Manage Workspaces and browse Prompts.
*   **Center Editor**: Edit your prompt, save versions, and use AI tools.
*   **Right Panel**: Access AI refinement tools and Google Drive settings.
*   **Footer**: View version history and storage stats.

### Quick Access Popup
Click the extension icon for a lightweight editor to:
*   Quickly view and copy prompts.
*   Paste prompts directly into web forms (ChatGPT, Claude, etc.) using the **Paste** button.

## 🔒 Privacy & Architecture

*   **Local First**: All data is stored in `chrome.storage.local` by default.
*   **App-Specific Drive Access**: Google Drive access is limited to a hidden AppData folder. The extension **cannot** read your other Drive files.
*   **On-Device AI**: AI processing happens entirely on your machine using Chrome's built-in model.

---
*Built by Jaroslav Pantsjoha*

