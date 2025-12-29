# Chrome Web Store: v2.0.0 Content Package

**Store URL**: https://chromewebstore.google.com/detail/promptkeeper/donmkahapkohncialmknoofangooemjb

**Extension IDs**:
- Production (Web Store): `donmkahapkohncialmknoofangooemjb`
- Local Development: `japfbbfmkjpmiiaabdlfjbijgaffmmdc`

---

## Store Description (Copy/Paste Ready)

### Short Description (132 chars max)
```
Save, organize, and optimize your AI prompts locally. Built-in Gemini Nano AI. Google Drive sync. Privacy-first. No API keys needed.
```

### Detailed Description
```
PromptKeeper is your private, local AI prompt engineering workspace—right in your browser.

WHAT'S NEW IN v2.1.1
• **Streaming + Cancel AI**: On supported Chrome builds, AI output can stream into the editor progressively. While running, buttons switch to **Cancel** so you can abort long operations.
• **Model Download Progress**: If Gemini Nano is warming up/downloading, PromptKeeper shows a “Downloading…” indicator when Chrome provides progress events.
• **Local Model Stats**: A compact “Local Model Stats” line shows token usage/quota (when available) under the editor.

WHAT'S NEW IN v2.1.0
• **Markdown Support**: Prompts now display as rich text (Bold, Lists, Headers). Click the text to edit instantly.
• **Keyboard Shortcuts**: Use Cmd+B and Cmd+I to format your prompts faster.
• **Editor Tuning**: Shared font-size controls for editor and preview, resizable right-hand panel, and improved side panel / full-editor flow.
• **Safety & Autosave**: Stronger AI prompting (no invented personas, clearer placeholders) plus optional auto-save and auto-save-on-switch so you don’t lose changes.

WHAT'S NEW IN v2.0.0
• Side panel view so you can browse, edit, and paste prompts directly into Claude, Gemini, Perplexity, ChatGPT and other tabs without leaving the page.  
• Full‑screen Prompt Management view for deep work, with live word count, AI tools, and Google Drive controls in the sidebar.  
• Workspaces & Projects: group prompts by topic (Work, Creative, Coding, etc.), drag‑and‑drop between projects, and use right‑click context menus for smart deletion.  
• Google Drive Sync: backup and restore your entire library (prompts + workspaces) via your private Drive AppData folder.  
• Version History: every save creates a new revision; quickly time‑travel across the latest 50 changes per prompt.  
• Optional on‑device Gemini Nano tools (where supported) so you can refine prompts locally without API keys.

🧠 BUILT-IN Optional AI OPTIMIZATION (Gemini Nano, on-device)
Leverage Chrome's on-device AI (when available) to refine your prompts without sending data anywhere.
• Magic Enhance: Turn rough notes into structured prompts instantly.
• Formalize, Clarify, Shorten: One-click refinement tools to adjust tone and clarity.
• Zero API Keys: Uses Chrome's local Gemini Nano model; when the model is available, everything runs on-device.

AI tools live in the full-page PromptKeeper editor so you can iterate deeply on prompts without cluttering your chat window.

☁️ GOOGLE DRIVE SYNC
Your prompts, everywhere.
• Automatic backup to your private Drive AppData folder.
• Cross-device access: Sign in on any computer.
• We never see your data—it stays in YOUR Drive.

🗂️ WORKSPACES & PROJECTS
Organize like a pro.
• Create named workspaces for Work, Creative, Coding, etc.
• Drag-and-drop prompts between projects.
• Right-click context menus for quick actions.

The side panel gives you quick access to this library while you’re in Gmail, Docs, or any other tab—so you can paste polished prompts into AI tools with one click.

📜 VERSION HISTORY
Never lose an idea.
• Every save creates a new version.
• Time-travel to any previous version with one click.

🖥️ FULL-SCREEN IDE
A dedicated environment for deep prompt work.
• Spacious editor with live word count.
• AI tools and Drive settings in the sidebar.
• Dark mode support.

🔒 PRIVACY FIRST
• All data stored locally in chrome.storage.
• Google Drive access is limited to an app-specific hidden folder.
• On-device AI means your prompts never leave your machine.

Perfect for prompt engineers, content creators, developers, and anyone who uses ChatGPT, Claude, Gemini, or other AI tools daily.

---
Built by Jaroslav Pantsjoha
```

---

## Screenshot Recommendations

Update your store screenshots to showcase the new v2.0 features:

| # | What to Show | File Name Suggestion |
|---|---|---|
| 1 | **Full-Page IDE** with a prompt open, AI tools visible in the right panel. | `screenshot-1-ide.png` |
| 2 | **Workspaces sidebar** showing multiple projects with one expanded. | `screenshot-2-workspaces.png` |
| 3 | **AI Optimization panel** with "Magic Enhance" button highlighted. | `screenshot-3-ai-tools.png` |
| 4 | **Google Drive Sync** section showing "Signed In" state. | `screenshot-4-drive-sync.png` |
| 5 | **Version History dropdown** in the footer, showing past versions. | `screenshot-5-version-history.png` |

> **Resolution**: Chrome Web Store requires 1280x800 or 640x400 for screenshots.

---

## Promotional Tile Text (Optional Update)

If you want to update the small promo tile (`440x280`), consider this tagline:

**"Your Private AI Prompt Lab"**
or
**"Prompt Engineering, Locally Powered"**

---

## YouTube Description Snippet (Copy/Paste)

```text
PromptKeeper v2.0 is a privacy‑first prompt manager for Chrome.

In this quick demo I walk through the new side panel, full‑screen editor, workspaces, and Google Drive backup/restore.

What’s new in v2.0.0:
- Side panel for quick paste‑to‑page while you’re in Gmail, Docs, or any AI tool
- Full‑page PromptKeeper IDE with collapsible Workspaces & Prompts
- Drag‑and‑drop prompts between workspaces + Smart Delete (keep prompts, delete workspace)
- Built‑in Gemini Nano tools (Magic Enhance, Formalize, Clarify, Shorten) – no API keys
- Google Drive backup & restore of prompts and workspaces
- Version history with the latest 50 revisions per prompt

🔗 Get PromptKeeper on Chrome Web Store (link in description)

#PromptKeeper #ChromeExtension #PromptEngineering #GeminiNano #GoogleDrive #Productivity
```

---

## Twitter / X Snippet (<=140 chars)

```text
PromptKeeper v2.0 – local-first prompt manager for Chrome with workspaces, Gemini Nano tools + Google Drive backup. #PromptKeeper #ChromeExtension
```

---

## Chrome Web Store – Privacy & Permissions Notes (for Developer Dashboard)

These snippets are for the **Privacy practices → Permission justification** section.

### Single purpose description

```text
PromptKeeper is a Generative AI prompt manager. It provides a single place to store, organize, version, and reuse prompts independently of any AI website, with optional Google Drive backup and side panel access while using tools like Claude, Gemini, or ChatGPT.
```

### tabs justification

```text
PromptKeeper uses the "tabs" permission only to interact with the user’s currently active tab and to open its own pages (options screen and the hidden AI bridge tab). This is required so the extension can read the active tab ID, inject the prompt into the correct page when the user clicks "Paste-to-Page", and safely route AI bridge messages to the correct background tab. PromptKeeper does not read or store full browsing history, and it does not track which sites the user visits; it only uses the tab information transiently to perform user‑initiated actions.
```

### identity justification

```text
PromptKeeper uses the "identity" permission exclusively to authenticate the user with their own Google account when they choose to enable Google Drive backup. The extension requests an OAuth token via chrome.identity to read/write a single JSON backup file in the user’s Drive AppData folder and to display the user’s email address in the UI. This email and token are stored only in chrome.storage.local on the user’s device and are never sent to any third‑party server controlled by the developer. All Drive access is optional; the extension works fully in local‑only mode without identity.
```

### alarms justification

```text
PromptKeeper uses the "alarms" permission to schedule optional automatic backups to Google Drive. When the user enables auto‑backup, the extension sets a repeating alarm (e.g., every 30 minutes) that triggers a background task to sync the latest prompts and workspaces to the user’s private Drive AppData file. No other recurring tracking or background processing is performed with alarms. If the user disables auto‑backup, the alarm is cleared and no recurring work runs.
```

### sidePanel justification

```text
PromptKeeper uses the "sidePanel" permission to register and display its prompt library inside Chrome’s side panel. This is central to the extension’s single purpose: letting users browse, edit, and paste prompts while viewing AI tools or other sites on the main page. The side panel shows only the user’s own prompts and workspaces stored locally or recovered from their Drive backup; it does not display or collect page content from the host site.
```

### Remote code justification (if needed)

```text
PromptKeeper does not use remote code. All JavaScript and assets are packaged inside the extension. The only network requests are to Google APIs for Drive backup/restore and userinfo when the user enables sync, and those calls operate on JSON data, not remotely loaded scripts or WASM. No scripts are loaded via external <script> tags, eval, or dynamic module URLs.
```
