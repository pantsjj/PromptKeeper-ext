# PromptKeeper - The Local AI Prompt IDE

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-v2.1.1-blue?logo=googlechrome)](https://chromewebstore.google.com/detail/promptkeeper/donmkahapkohncialmknoofangooemjb)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE.md)

**PromptKeeper** is a privacy-first Chrome Extension that transforms your browser into a local prompt engineering workspace. Save, organize, version, and (optionally) optimize your AI prompts—with Google Drive sync and built-in Markdown support.

> 🚀 **[Install from Chrome Web Store](https://chromewebstore.google.com/detail/promptkeeper/donmkahapkohncialmknoofangooemjb)**

---

## ✨ Key Features (v2.1)

| Feature | Description |
|---------|-------------|
| 📝 **Markdown Support** | Rich text preview with **bold**, *italics*, lists, and headers, plus **Click-to-Edit** previews. |
| ⌨️ **Shortcuts & Formatting** | Use `Cmd+B` and `Cmd+I` to format quickly. Raw markdown in the editor, clean text via stripped "Paste-to-Page". |
| 🧠 **Local AI (Gemini Nano)** | On-device optimization using Chrome’s Gemini Nano APIs. Includes **Magic Enhance**, **Formalize**, **Improve Clarity**, **Shorten**. AI meta-prompts avoid invented personas and clearly mark user-fill areas. |
| ⚡ **Streaming + Cancel AI** | Where supported, AI output streams into the editor progressively. Buttons switch to **Cancel** so you can abort long operations safely. |
| ⬇️ **Model Download Progress** | When Chrome is downloading/warming the on-device model, PromptKeeper surfaces a **Downloading…** progress indicator instead of failing silently. |
| ☁️ **Google Drive Sync** | Auto-backup to your private Drive. Access prompts on any device. |
| 🗂️ **Workspaces** | Organize prompts into Projects with drag-and-drop. |
| 📜 **Version History** | Every save is versioned. Time-travel to restore any version. |
| 🖥️ **Full-Screen IDE** | A spacious editor for serious prompt engineering with a resizable, scrollable right-hand options & AI panel. |
| 🔍 **Readable by Design** | Shared font-size controls keep the editor and markdown preview in sync across the full editor and side panel. |

---

## 🚀 Getting Started

### Install from Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store listing](https://chromewebstore.google.com/detail/promptkeeper/donmkahapkohncialmknoofangooemjb)
2. Click **Add to Chrome**
3. Pin the PromptKeeper icon 📌 to your toolbar

### Enable Gemini Nano (Local AI Features)
PromptKeeper supports Chrome's built-in **Gemini Nano** for private, local prompt optimization.

1. Go to `chrome://flags`
2. Enable **Optimization Guide On Device Model** (`#optimization-guide-on-device-model`)
3. Enable **Prompt API for Gemini Nano** (`#prompt-api-for-gemini-nano`)
4. Relaunch Chrome

**Note**: Once valid, the **"AI Optimization"** tile in the Manage Page and the **"Magic Optimize"** buttons in the Side Panel will appear automatically.
While AI is running, buttons will switch to **Cancel**, and on supported builds you may see **streaming output** in the editor.

---

## 📖 How It Works

### 🎥 v2.1 Demo

Watch the v2.1 walkthrough (Local AI streaming, cancel button, improved layout, and full Google Drive backup):  
[![PromptKeeper v2.1 Walkthrough](https://img.youtube.com/vi/bictdOsBC30/0.jpg)](https://www.youtube.com/watch?v=bictdOsBC30)  
[Watch: https://youtu.be/bictdOsBC30](https://youtu.be/bictdOsBC30)

### Full-Screen IDE
Click **Manage Prompts** in the popup (or right-click → Options):
- **Left Sidebar**: Workspaces and prompt list.
- **Center**: Rich text editor with live word and character count.
- **Right Panel**: AI tools, editor options (including font size), and Google Drive settings. The panel is resizable and scrollable so nothing gets hidden.
- **Footer**: Version history selector, storage stats, and live `Words / Chars / Size` summary.

### Quick Popup & Side Panel
Click the extension icon for quick access:
- View and copy prompts instantly.
- **Paste to Page**: Insert prompts directly into ChatGPT, Claude, etc.
- Open the **Side Panel** for a compact version of the editor that shares the same font settings and AI tools. A single click on **Manage ↗** takes you into the full-screen IDE when you need more space.

---

## 🔒 Privacy & Security

| | |
|---|---|
| **Local Storage** | All data stored in `chrome.storage.local` by default |
| **Drive Isolation** | Google Drive access limited to hidden AppData folder only |
| **On-Device AI** | Gemini Nano runs entirely on your machine |
| **No Tracking** | Zero analytics, no third-party services |

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run tests
npm run lint
npm test
npm run test:e2e
```

See `docs/TEST_STRATEGY.md` for the full coverage matrix and E2E suite list.

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for packaging instructions.

---

## 📄 License

ISC License. See [LICENSE.md](LICENSE.md).

---

**Built with ❤️ by [Jaroslav Pantsjoha](https://github.com/pantsjj)**
