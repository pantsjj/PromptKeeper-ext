# PromptKeeper Agent Vision

# Gemini for Workspace: Prompting Best Practices
*Source: Gemini for Google Workspace Prompting Guide 101*

## Project High-Level Objective
To create the ultimate **Local-First Prompt Engineering Environment** for Chrome. This extension demonstrates the power of the **Gemini Nano** on-device model for low-latency, private AI assistance.

**Key Submission Statement:**
"PromptKeeper is a privacy-first Chrome Extension that turns your browser into a Prompt IDE. It leverages Chrome's built-in Gemini Nano to help users write, refine, and manage high-quality AI prompts without their data ever leaving their device."

## Decision Log & Cross-References
*   **[task.md](./task.md)**: Current development status and roadmap.
*   **[ADR-0001](./docs/ADR-0001-storage.md)**: Decision to use `chrome.storage.local` for persistence.
*   **[ADR-0002](./docs/ADR-0002-sidepanel.md)**: Decision to use Side Panel API for master-detail layout.
*   **[how_to.html](../../how_to.html)**: User-facing documentation.

## Implementation Notes (Dec 2025)
PromptKeeper implements these best practices using a **Hybrid AI Strategy**. We use Chrome's **Prompt API** for creative enhancement and the **Rewriter API** for stylistic polish. Automated "Scoring" is currently deferred due to local model limitations, so users should use the 4 Pillars below as a mental checklist.

## Mission
To empower users with a private, local, and intelligent prompt management workspace directly within their browser. PromptKeeper transforms the browser from a passive consumption tool into an active, **AI-assisted Prompt Engineering IDE**.

## Core Philosophy
1.  **Local & Private**: Your prompts are your intellectual property. Data stays on your device (Local-First), backed up only if you choose (Google Drive).
2.  **Frictionless Integration**: Management happens where the work happens—via the Chrome Side Panel, instantly adjacent to your AI tools (ChatGPT, Claude, Gemini).
3.  **AI-Augmented**: Leveraging on-device models (Gemini Nano) to optimize, clarify, and format prompts without server latency or privacy risks.

## Strategic Direction
The project is evolving from a simple clipboard manager to a sophisticated **Prompt Engineering IDE**.

### Key Pillars
*   **Version Control**: Treat prompts like code. Track history, branch ideas, and revert modifications.
*   **Optimization**: Use best-in-class frameworks (Persona, Task, Context, Format) to "Score" and "Refine" prompts locally.
*   **Organization**: Smart Workspaces with "Smart Delete" (Tag Persistence) ensure no idea is ever lost, even when projects are archived.
*   **Sovereignty**: Users own their data. JSON export/import and Google Drive backup ensure portability.

## Best Practices & Architecture
*   **Architecture**: Shared logic between `options.js` (IDE) and `popup.js` (Side Panel) via `StorageService.js`.
*   **Testing**: Comprehensive E2E coverage via Playwright for critical user journeys (Lifecycle, Sync, AI).
*   **Documentation**: Living artifacts (`task.md`, `ADR` logs) guide development.

## User Persona
*   **The Power User**: Interacts with multiple AI models (ChatGPT, Claude, Gemini) daily.
*   **The Developer**: Needs to test prompt variations for applications.
*   **The Content Creator**: Maintains a library of style guides and recurring prompt structures.
