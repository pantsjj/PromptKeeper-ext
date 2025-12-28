# PromptKeeper FAQ

## Privacy & Data
**Q: Where are my prompts stored?**
A: Your prompts are stored **locally** on your device using Chrome's persistent storage. They are never sent to any external server (including ours) unless you explicitly choose to backup to Google Drive.

**Q: Is the AI running on my computer?**
A: Yes! Smart Refinement features use **Gemini Nano**, which runs directly inside your Chrome browser. This ensures zero latency and complete privacy—your text never leaves your machine for processing.

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
A: You need Chrome version 128+ and must enable the "Prompt API" and "Optimization Guide On Device Model" flags. Check our [AI Setup Guide](./ai_setup.md) for details.
