# PromptKeeper FAQ

## Privacy & Data
**Q: Where are my prompts stored?**
A: Your prompts are stored **locally** on your device using Chrome's persistent storage. They are never sent to any external server (including ours) unless you explicitly choose to backup to Google Drive.

**Q: Is the AI running on my computer?**
A: Yes! Smart Refinement features use **Gemini Nano**, which runs directly inside your Chrome browser. This ensures zero latency and complete privacy—your text never leaves your machine for processing.

**Q: What AI tools are available?**
A: When enabled, you get access to local AI tools:
- **Manage Page**: Magic Enhance, Formalize, Improve Clarity, Shorten.
- **Side Panel**: Magic Optimize, Improve Clarity.
These buttons appear automatically when the AI is ready (Green status).

**Q: Why does the AI button say “Cancel” sometimes?**
A: When an AI operation is running, the button switches to **Cancel** so you can abort long requests safely. PromptKeeper uses Chrome’s on-device streaming APIs where available, so you may also see the editor updating progressively while the AI is generating.

**Q: I see a “Downloading…” message — what is that?**
A: The first time you use Local AI (or after a browser update), Chrome may need to download/warm up the Gemini Nano model. PromptKeeper surfaces download progress when Chrome provides it, so you know it’s working rather than “stuck”.

## Editing & Usage
**Q: How do I edit the Markdown preview?**
A: Just click on the text! The preview is "Click-to-Edit". It will instantly switch you back to the text editor. You can also use the "Code/Eye" icon in the toolbar, or `Cmd+B` / `Cmd+I` shortcuts.

**Q: Can I change the editor font size?**
A: Yes. In the full editor, use the **Options → Editor font size** controls on the right. The selected size applies to both the raw editor and the markdown preview, and the side panel picks up the same setting so everything stays visually consistent.

**Q: Why are parts of my prompt shown in a monospace `code` style?**
A: When PromptKeeper’s AI suggests places where **you** should fill in context (e.g. `[briefly describe your current running level]`), it wraps those placeholders in inline code formatting so they stand out. Replace the text inside the brackets with your own details before using the prompt.

**Q: The AI keeps inventing character names or company names—can I stop that?**
A: Yes. v2.1 updates the AI meta-prompts to explicitly **forbid invented personal names and fictional companies**. If you still see this behaviour, it’s usually because an older model response was saved in a prompt—re-run the optimization and the new rules will apply.

## Workspaces & Organization
**Q: How do "Smart Workspaces" work?**
A: Workspaces help you group prompts. If you delete a workspace, PromptKeeper uses "Smart Delete"—your prompts are **not** deleted. Instead, they are moved to "All Prompts" and tagged with the workspace name. If you create the workspace again later, they will automatically reappear!

## Backup & Sync
**Q: How does Google Drive backup work?**
A: We store a single `backup.json` file in a private, hidden folder (`appDataFolder`) on your personal Google Drive. This file is only accessible by this extension.

**Q: Can I sync across devices?**
A: Yes. If you sign in to the same Google account on another computer and enable "Auto-backup", your prompts will sync (last-write-wins).

## Troubleshooting
**Q: Why don't I see the AI tools?**
A: You need a Chrome build that supports the Prompt API + the correct flags. Open the built-in guide: `gemini-help.html` (available from the extension), and verify support via `gemini-diagnostic.html`.
