# Architecture Decision: AI API Selection
*Date: Dec 29, 2025*
*Status: Implemented (Hybrid Strategy)*

## Context
Chrome now offers multiple built-in AI APIs:
1.  **Prompt API** (`window.ai.languageModel` or `window.LanguageModel`): General-purpose LLM interaction.
2.  **Rewriter API** (`window.ai.rewriter` or `window.Rewriter`): Specialized for rephrasing, tone adjustment, and length modification.
3.  **Summarizer API** (`window.ai.summarizer` or `window.Summarizer`): Specialized for shortening text.

## Decision
**PromptKeeper employs a Hybrid "Best-Tool-for-the-Job" Strategy with Robust Availability Checks.**

We utilize a modular architecture that dynamically selects the available specialized API, falling back to the general Prompt API to ensure reliability.

### Availability Logic
We consider the AI "Available" (Green) if **any** valid API entry point is detected with a status of `readily`, `available`, or `after-download`.
- **Primary Check**: `window.LanguageModel.availability()` (Standard)
- **Fallback**: `window.ai.languageModel.capabilities()` (Legacy/Origin Trial)
- **Bridge**: If local detection fails (e.g., restricted context), we use an Offscreen Document bridge.

## Workflow Mapping & UI Integration

### 1. Options Page (Full Manage) - 4 Buttons
*   **Magic Enhance** (Prompt API): Creative expansion using "Persona, Task, Context" framework.
*   **Formalize Tone** (Rewriter API > Prompt API): Rewrite to be more professional.
*   **improve Clarity** (Rewriter API > Prompt API): Rewrite to be clearer/concise.
*   **Shorten** (Summarizer API > Prompt API): Condense text.

### 2. Side Panel (Quick Edit) - 2 Buttons
*   **✨ Magic Optimize**: Corresponds to "Magic Enhance".
*   **🔍 Improve Clarity**: Corresponds to "Improve Clarity".
*   *Constraint*: Only shown when AI is fully available (Green status).

## User Implication
Users enable Chrome flags once. If the text "Gemini Enabled" appears in Green, all features activate automatically. No API keys required.