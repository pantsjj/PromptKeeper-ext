# PromptKeeper - The Local AI Prompt IDE

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-v2.0.0-blue?logo=googlechrome)](https://chromewebstore.google.com/detail/promptkeeper/donmkahapkohncialmknoofangooemjb)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE.md)

**PromptKeeper** is a privacy-first Chrome Extension that transforms your browser into a local prompt engineering workspace. Save, organize, version, and (optionally) optimize your AI prompts—with Google Drive sync and upcoming Gemini Nano on-device AI support.

> 🚀 **[Install from Chrome Web Store](https://chromewebstore.google.com/detail/promptkeeper/donmkahapkohncialmknoofangooemjb)**

---

## ✨ Key Features (v2.0)

| Feature | Description |
|---------|-------------|
| 🧠 **Local AI (Gemini Nano)** | On-device optimization using Chrome’s Gemini Nano APIs. Includes **Magic Enhance**, **Formalize**, and more. No API keys needed. |
| ☁️ **Google Drive Sync** | Auto-backup to your private Drive. Access prompts on any device. |
| 🗂️ **Workspaces** | Organize prompts into Projects with drag-and-drop. |
| 📜 **Version History** | Every save is versioned. Time-travel to restore any version. |
| 🖥️ **Full-Screen IDE** | A spacious editor for serious prompt engineering. |

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

---

## 📖 How It Works

### 🎥 v2.0 Demo

Watch the v2.0 walkthrough (side panel, workspaces, Drive backup, and docs integration):  
`https://youtu.be/qIIJ2YItDPA`

### Full-Screen IDE
Click **Manage Prompts** in the popup (or right-click → Options):
- **Left Sidebar**: Workspaces and prompt list
- **Center**: Rich text editor with live word count
- **Right Panel**: AI tools and Google Drive settings
- **Footer**: Version history and storage stats

### Quick Popup
Click the extension icon for quick access:
- View and copy prompts instantly
- **Paste to Page**: Insert prompts directly into ChatGPT, Claude, etc.

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

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for packaging instructions.

---

## 📄 License

ISC License. See [LICENSE.md](LICENSE.md).

---

**Built with ❤️ by [Jaroslav Pantsjoha](https://github.com/pantsjj)**
