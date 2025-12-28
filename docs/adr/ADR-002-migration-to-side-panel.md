# ADR 002: Migration from Popup to Side Panel

## Status
Accepted

## Date
2025-12-28

## Context
The PromptKeeper extension originally used a standard `default_popup` for its primary interface. However, as features grew (workspace management, complex prompt editing, AI integration), the popup interface presented significant usability challenges:
- **Ephemeral State**: Popups close immediately when focus is lost, causing data loss or interruption during workflows.
- **Limited Real Estate**: Fixed maximum dimensions (800x600px) restricted advanced UI layouts.
- **Workflow Friction**: Users often need to reference the page content *while* editing or selecting prompts. The popup obstructed this view.

## Decision
We decided to migrate the primary interface to the Chrome Side Panel API (`chrome.sidePanel`) and configure it to open on extension icon click.

## Detailed Design
1. **Manifest Configuration**:
   - Removed `default_popup` from `manifest.json`.
   - Added `side_panel` permission.
   - Configured `background.js` to set `openPanelOnActionClick: true`.

2. **Layout & Responsiveness**:
   - **Sidebar Width**: Default 200px, user-resizable via drag handle (100-300px range).
   - **Minimum Width**: Enforced `min-width: 200px` on body to ensure usability.
   - **Auto-hide Sidebar**: Sidebar hides at panel width <300px for focused copy/paste workflow.
   - **Dynamic Section Sizing**: Workspaces section limited to `max-height: 120px`; Prompts section expands with `flex: 1` to prioritize prompt list visibility.
   - **Sticky Footer**: Implemented `margin-top: auto` on the status footer to anchor it to the bottom.

3. **Data & State Management**:
   - **Storage Sync**: Implemented `chrome.storage.onChanged` listeners in `popup.js` to ensure real-time synchronization when prompts are added, restored, or modified from any view.
   - **Auto-Backup**: 5-minute interval alarm (`chrome.alarms`) triggers automatic backup to Google Drive when signed in. Alarm is created on Google sign-in and cleared on sign-out.

## Consequences
### Positive
- **Persistent Workflow**: Users can read page content and interact with prompts simultaneously without the UI closing.
- **Better UX**: More vertical space for prompt lists and editing.
- **Modernization**: Aligns with modern browser extension patterns.

### Negative
- **Discovery**: Users habituated to popups might initially find the side docking unexpected (mitigated by tooltip "Click to open Side Panel").
- **Testing Complexity**: E2E tests (Playwright) required adjustment to target `sidepanel.html` specifically rather than the unified `extensionId` popup context.

## References
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [Issue #12: Popup closes unexpectedly during editing](https://github.com/promptkeeper/issues/12)

---

## LLM Implementation Prompt

> Use this prompt to implement or rebuild `sidepanel.html` from scratch.

### Task
Create `sidepanel.html` for the PromptKeeper Chrome extension that mirrors the master-detail layout of `options.html` (full Prompt Management page).

### Layout Requirements (Master-Detail)

```
┌─────────────────────────────────────────────────┐
│              Search Bar (top)                   │
├──────────────────┬──────────────────────────────┤
│   LEFT SIDEBAR   │        RIGHT EDITOR          │
│  ┌────────────┐  │  ┌────────────────────────┐  │
│  │ WORKSPACES │  │  │ Title Input            │  │
│  │ (dropdown) │  │  ├────────────────────────┤  │
│  ├────────────┤  │  │                        │  │
│  │ PROMPTS    │  │  │ Prompt Text Area       │  │
│  │ (list)     │  │  │                        │  │
│  │            │  │  ├────────────────────────┤  │
│  │            │  │  │ [New][Save][Delete]    │  │
│  ├────────────┤  │  │ [Paste-to-Page]        │  │
│  │ Google     │  │  ├────────────────────────┤  │
│  │ Sign-in    │  │  │ Google Sign-in Section │  │
│  └────────────┘  │  └────────────────────────┘  │
├──────────────────┴──────────────────────────────┤
│ Footer: Stats | Version | Backup | Restore | Manage│
└─────────────────────────────────────────────────┘
```

### Specific Requirements

1. **Reference Files**:
   - Copy CSS variables and styling from `options.html` (Apple-inspired design)
   - Link to `styles.css` for shared button/input styles
   - Load `popup.js` as module for all functionality

2. **Left Sidebar** (width: 200px, resizable 100-300px):
   - **Workspaces Section**: Collapsible header with `id="workspace-toggle"`, plus button `id="add-project-btn"`, list container with `id="workspaces-section"` containing `id="workspace-list"`. Section limited to `max-height: 120px`.
   - **Prompts Section**: Collapsible header with `id="prompts-toggle"`, list container with `id="prompts-section"` containing `id="prompt-list"`. Takes remaining space with `flex: 1`.
   - **Resize Handle**: `id="resize-handle"` between sidebar and editor for drag-to-resize.
   - **Google Sign-in**: At bottom of sidebar with `id="google-signin-btn"`, `id="drive-signed-out"`, `id="drive-signed-in"`, `id="user-email"`, `id="google-signout-btn"`

3. **Right Editor**:
   - Title input: `id="prompt-title"`
   - Text area: `id="prompt-text"`
   - Buttons (preserve existing styling from `styles.css`):
     - `id="new-prompt-button"` - New
     - `id="save-button"` - Save (primary blue)
     - `id="delete-prompt-button"` - Delete (danger red)
     - `id="paste-prompt-button"` - Paste-to-Page (orange, pulsating)

4. **Footer Status Bar** (sticky bottom):
   - Word count: `id="word-count"`
   - Version selector: `id="version-selector"` (dropdown)
   - Storage used: `id="storage-used"`
   - Backup link: `id="backup-link"` (Google Drive backup)
   - Restore link: `id="restore-link"` (Google Drive restore)
   - Open full editor: `id="open-full-editor-link"`
   - *Note: Export/Import moved to full management page (options.html)*`

5. **CSS Requirements**:
   - `body { min-width: 200px; }` (for narrow side panel)
   - Sections visible by default, hidden only when `.collapsed` class added
   - Use flexbox: sidebar `flex: 0 0 200px`, editor `flex: 1`

6. **JavaScript**:
   - Load: `<script src="popup.js" type="module"></script>`
   - Collapsible section toggle for workspace/prompt sections
   - Draggable resize handle for sidebar width adjustment
   - Inline workspace creation (click + to show input field)

### Element ID Checklist

All these IDs MUST exist for `popup.js` compatibility:

| Category | Element IDs |
|----------|-------------|
| Search | `popup-search` |
| Sidebar | `workspace-toggle`, `workspaces-section`, `workspace-list`, `prompts-toggle`, `prompts-section`, `prompt-list` |
| Editor | `prompt-title`, `prompt-text` |
| Buttons | `new-prompt-button`, `save-button`, `delete-prompt-button`, `paste-prompt-button` |
| Google | `google-signin-btn`, `drive-signed-out`, `drive-signed-in`, `user-email`, `google-signout-btn` |
| Footer | `stats`, `word-count`, `version-selector`, `storage-used`, `backup-link`, `restore-link`, `open-full-editor-link` |
| Resize | `resize-handle` |
| Workspace Actions | `add-project-btn` |

### Verification

Run E2E tests after implementation:
```bash
npm run test:e2e tests/e2e/sidepanel.spec.js
```

All 3 tests must pass:
- Side Panel layout and components
- Editor interactivity  
- Responsive Layout Check
