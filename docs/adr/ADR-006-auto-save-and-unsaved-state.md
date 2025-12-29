# ADR-006: Auto-Save and Unsaved-State Indicators

## Status

Accepted – revised v2.1 behaviour

## Context

PromptKeeper stores prompts locally and already supports explicit **Save** operations and version history.
However, users frequently:

- Forget to press **Save** after editing or running AI refinements.
- Experiment rapidly with prompts and then switch to another prompt, unintentionally discarding edits.
- Struggle to see at a glance whether the current text differs from the last saved version.
- Trigger AI optimizations and then navigate away while a response is still in-flight.

We also introduced:

- Rich markdown rendering (code/preview toggle) in both the **full editor** and **side panel**.
- Local AI-based rewrites (Gemini Nano) wired into the editor toolbars.
- Shared typography controls (font size) across text and preview views.

This increases the number of places where edits and background work can happen and makes feedback and safety
around saving more important.

## Decision

We refined the behaviour into three distinct concepts: **unsaved state**, **auto-saving**, and **AI-in-progress**
feedback.

### 1. Unsaved state indicator (editor + preview)

- When the current content diverges from the last saved version, the active editor surface is marked dirty:
  - The main full-page editor textarea and the side panel textarea both receive an `unsaved-glow` class that
    applies a soft, pulsing **orange halo**.
  - The full-page markdown preview shares the same font size as the raw editor and reflects text changes, but
    the unsaved state is anchored to the editor’s dirty flag (not just view toggling).
- Transitions to “dirty”:
  - User types in the raw editor.
  - Programmatic changes such as AI refinements calling `setPromptText(...)`.
- Transitions back to “clean”:
  - On successful manual Save.
  - On successful auto-save (timer or auto-save-on-switch).
- On Save completion, the editor also runs a short **green pulse** to confirm that the write and versioning
  succeeded.

### 2. Configurable auto-save for prompts

- New options in the full editor **Options** card:
  - `Auto-save prompts` (checkbox, default: **ON**).
  - `Auto-save interval` (select: 1, 5, 10 minutes; default: **5 min**).
- When enabled, the options page runs a timer that:
  - Checks a local `isEditorDirty` flag.
  - If dirty, calls the existing `savePrompt()` logic, creating a new version as usual and clearing the
    `unsaved-glow`.
- Settings are stored in `chrome.storage.local` as:
  - `autoSaveEnabled`
  - `autoSaveIntervalMinutes`
  - The side panel reads `editorFontSize` and other shared settings so typography and behaviour remain
    consistent across surfaces.

### 3. Optional “auto-save on prompt switch”

- Additional option: `Auto-save when switching prompts` (checkbox, default: **OFF**).
- When enabled and the current editor is dirty:
  - Selecting another prompt in the full editor triggers a Save of the current prompt **before** loading the
    next one.
  - This is targeted at advanced/heavy users who frequently jump between prompts and expect their edits to
    follow them automatically.

### 4. AI-in-progress feedback vs. unsaved state

To avoid overloading a single visual cue, we **separate** “AI is working” from “changes are unsaved”:

- When the user clicks any **AI optimization button** (e.g. Magic Enhance, Formalize, Clarify, Shorten):
  - The clicked button:
    - Changes label to “Please wait…”.
    - Becomes disabled.
    - Receives an `ai-busy` CSS class that applies a pulsing orange halo around the button itself.
  - This indicates an AI call is running in the background and discourages users from spamming the action,
    without blocking the whole UI with pop-ups.
- When the AI response arrives:
  - The button label, enabled state, and `ai-busy` animation revert to normal.
  - The editor content is updated via `setPromptText(...)`.
  - The editor becomes dirty and gets the `unsaved-glow` halo, clearly signalling that the new AI-generated
    content has **not** yet been saved.
- Navigating away while AI is running:
  - Because the “busy” indication is on the button and editor, users have an at-a-glance visual cue that work
    is still in progress.
  - We deliberately avoid modal pop-ups; if a user leaves anyway, the call may still complete but the visual
    contract is clear: a glowing AI button + “Please wait…” means an update is pending.

## Event / Data Flow (High-Level)

Below is a simplified event flow for the main scenarios.

### A. Manual edit and save (full editor)

1. User types in the editor  
   → `input` handler sets `isEditorDirty = true` and adds `unsaved-glow`.  
   → Stats/footer update words/chars/size.
2. User clicks **Save** or presses `Cmd/Ctrl+S`  
   → `savePrompt()` writes content + title to `StorageService`.  
   → Version history is updated; footer version selector is refreshed.  
   → `isEditorDirty` is cleared, `unsaved-glow` removed, green pulse shown.
3. Auto-save timer (if enabled) periodically repeats step 2 whenever `isEditorDirty` is `true`.

### B. Auto-save on prompt switch

1. User edits current prompt (editor becomes dirty, halo visible).
2. User clicks another prompt in the list while `autoSaveOnSwitch` is enabled.  
   → `selectPrompt()` first checks `isEditorDirty`.  
   → If dirty, it calls `savePrompt()` for the current prompt.  
   → On success, clears dirty state and loads the selected prompt.

### C. AI optimization (full editor / side panel)

1. User clicks an AI button (e.g. Magic Enhance).  
   → Button enters `ai-busy` state (label “Please wait…”, disabled, pulsing halo).  
   → AI meta-prompt is assembled and sent via `AIService.refinePrompt`.
2. AI response returns successfully.  
   → Editor content is updated via `setPromptText(refined)`.  
   → `setPromptText` marks editor dirty and syncs preview if visible.  
   → `unsaved-glow` halo appears on the editor surface.
3. User decides whether to:
   - Accept and **Save** (manual or auto-save), clearing the halo; or
   - Navigate away, knowingly discarding the unsaved AI suggestion.

### D. Font size and shared visual consistency

1. User changes font size from the **Options** panel.  
   → `editorFontSize` is clamped, applied to `--prompt-font-size`, and persisted.  
   → Raw editor and markdown preview both update immediately.  
   → Side panel listens for `editorFontSize` changes and updates its editor/preview size live.

## Consequences

- **Pros**
  - Greatly reduces the risk of losing work due to forgotten saves or AI rewrites.
  - Makes the unsaved state immediately visible, even without reading the footer stats.
  - Gives clear, non-modal feedback that AI work is in progress, improving trust in the system.
  - Keeps behaviour configurable so users who dislike auto-save can disable it or tune the interval.
  - Reuses existing save/version pipelines, so history remains accurate and unchanged.

- **Cons**
  - Slightly more background activity due to periodic auto-save checks.
  - Auto-save on switch can trigger additional saves during rapid navigation, which may increment version
    numbers more quickly.
  - AI busy indicators add some visual motion; care must be taken not to overuse animations.

We consider these trade-offs acceptable given the improved safety, clarity, and overall user experience for
prompt editing and AI-assisted workflows.



