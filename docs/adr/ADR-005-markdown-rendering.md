# ADR 005: Markdown Rendering and Paste Behavior

## Status
Accepted

## Context
Users store prompts that often contain Markdown formatting (headers, bold, lists). The default editor is a raw textarea, which makes reading complex prompts difficult. Additionally, when pasting prompts into target applications (like ChatGPT web UI or other forms), users often want "clean" text without the Markdown syntax cluttering the input, or conversely, they want to preserve structure.

## Decision

### 1. Rendering Strategy: Preview Mode & Default View
We have implemented a **Preview Mode** using `marked.js` (v17.0).
*   **Default View**: Existing prompts load in **Preview Mode** (Rich Text) for easier reading.
*   **Toggle Icons**:
    *   **View Preview**: Button shows 👀 (switches to Read-Only).
    *   **Edit Raw**: Button shows 👨‍💻 (switches to Textarea).
*   **Interaction**:
    *   **Click-to-Edit**: Clicking *anywhere* on the preview text instantly switches to Edit Mode. This mimics a WYSIWYG feel without the complexity.
    *   **Shortcuts**: `Cmd+B` (Bold) and `Cmd+I` (Italic) supported in Edit Mode.
*   **Rationale**:
    *   **Readability**: Users primarily read/select prompts.
    *   **Flow**: "Click-to-Edit" reduces friction compared to a strict toggle.
    *   **Space**: Side Panel is too narrow for split-pane.

### 2. Paste Behavior: Implicit "Strip on Paste"
We will implement an **Implicit Strip-on-Paste** for the "Paste to Page" button, while preserving native clipboard behavior for manual copy-paste.
*   **Rationale**:
    *   **Paste to Page**: This button is a convenience feature often used to inject prompts into web forms where raw Markdown syntax (like `**bold**` or `# Header`) might be undesirable or misinterpreted by the receiving app's own text processor. The user intent here is "put the *content* of this prompt into the page".
    *   **Manual Copy (Cmd+C)**: Users who *do* want the raw Markdown (e.g., to paste into a code editor or a Markdown-aware tool) can simply select the text and copy it using standard OS shortcuts. This provides a natural "opt-out" without cluttering the UI with configuration checkboxes.
*   **Implementation**:
    *   The "Paste to Page" action will parse the Markdown to HTML, extract the `textContent`, and inject that clean text.

## Consequences
*   **Positive**: Enhanced readability for users; cleaner input for target websites; simplified UI (no extra checkboxes).
*   **Negative**: Users who *exclusively* use "Paste to Page" but *want* Markdown syntax preserved will need to learn to use Cmd+C/Cmd+V instead.

## Technical Notes
*   **CSS**: Added GitHub-like styling for `.markdown-preview`.
*   **Security**: Ensure `marked` does not execute arbitrary scripts (sanitization is less critical here as input is user-generated local content, but standard precautions apply).
