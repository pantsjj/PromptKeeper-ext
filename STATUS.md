# PromptKeeper Extension Status

## 🚀 Project Status: v2.2.0 (Release Candidate)

**Date:** 2026-01-26
**Current Version:** 2.2.0

### ✨ New Features (v2.2)

- **Prompt Coach**: Real-time AI-powered prompt quality scoring (0-100) with visual hashtag attribute tags. Guides users toward better prompts as they type.
- **Prompt Sorting**: Sort by Name (A-Z/Z-A), Newest/Oldest First, or Recently Modified. Persistent preference.
- **Theme Toggle**: Light / Dark / Auto theme selector synced across Side Panel and Options page.
- **Keyboard Shortcut Settings**: Easy access to configure side panel hotkey.
- **Custom Modal System**: Eliminated flickering dialogs in Chrome Side Panel.
- **Placeholder UX**: Smart placeholder handling for templates:
  - Visual highlighting (blue, bold) in preview mode
  - Click-to-select: Click placeholder in preview → auto-select in editor
  - Double-click to select entire pattern (including backtick-wrapped)

### 🐛 Bug Fixes (v2.2)
- **Sort Dropdown**: Fixed prompts disappearing when cycling through sort options.
- **Prompt Coach Version Selection**: Score now updates correctly when selecting historical revisions.
- **Markdown Preview Scroll**: Fixed missing scrollbar for long prompts in preview mode.

### 🧪 Test Coverage (v2.2)
- **E2E Tests**: 90 total (88 passed, 1 skipped, 1 flaky AI test)
- **Unit Tests**: 29/29 passed (5 suites)
- **Visual Validation**: 14 screenshots captured and verified
- **New Test Suites**: `theme_settings.spec.js`, `bugfix_sorting_and_coach.spec.js`
- **Updated Tests**: Modal dialogs, workspace lifecycle, AI streaming

---

## 🚀 Project Status: v2.1.1 (Released)

**Date:** 2025-12-30
**Current Version:** 2.1.1

### ✅ New Features (v2.1)
- **Markdown Support**: Read-only preview with "Click-to-Edit" UX.
- **Shortcuts**: `Cmd+B` / `Cmd+I` for formatting.
- **Stability**: Fixed side panel crash and AI configuration errors.

## 🚀 Project Status: v2.0.0 (Released)

**Date:** 2025-12-28  
**Current Version:** 2.0.0

### ✅ Completed Milestones
- **Chrome Side Panel Migration (ADR‑0002)**: Side panel is the primary quick‑access surface with paste‑to‑page support.
- **Full‑Page IDE (`options.html`)**: Master‑detail layout for deep prompt work, with AI tools and Drive controls in the right sidebar.
- **Workspace Management**:
  - Inline workspace creation with validation and snake_case normalization.
  - Drag‑and‑drop prompts between workspaces.
  - Smart Delete semantics (workspace removal without losing prompts, with reclaim support).
- **Google Drive Integration**:
  - Backup and restore via Drive AppData.
  - Optional auto‑backup alarm (30‑minute cadence when enabled).
- **UI Polish & Parity**:
  - Resizable side panel sidebar (100–400px) with auto‑hide at very small widths.
  - Collapsible **Workspaces** and **Prompts** sections in both sidepanel and options, with dedicated `+` buttons.
  - Consistent selection highlighting and real‑time word count / storage usage stats in sidepanel and options.
  - AI Optimization panel (Gemini Nano) toggled via footer status dots.

### 🧪 Test Coverage (Green)

- **Unit (Jest)** – `npm test`
  - `AIService.test.js`
  - `StorageService.test.js`
  - `GoogleDriveService.test.js`
  - **Result:** 3/3 suites, 23/23 tests passing.

- **End‑to‑End (Playwright)** – `npm run test:e2e`
  - `journey.spec.js`: Core workspace + prompt creation and editing journey in options page.
  - `workspace_lifecycle.spec.js`: Smart Delete and workspace restore behavior.
  - `sidepanel.spec.js`: Layout, editor interactivity, responsive behavior, collapsible sections, and sidepanel sidebar parity.
  - `workspaces.spec.js`: Inline workspace creation, validation, collapsible sections, and context menu behavior in options page.
  - `regression_fixes.spec.js`: Active prompt highlighting (sidepanel) and footer stats update (options).
  - `ai_features.spec.js`: Verification of AI buttons and footer status icons.
  - `revisions.spec.js`: Version increment logic and Markdown preview verification.
  - `smoke.spec.js`: Extension load + popup smoke check.
  - **Result:** 42/42 tests passing (Full Suite).

For a detailed breakdown, see `docs/test-strategy.md`.

### ⚠️ Known Issues / Technical Debt

- **Code Duplication**: `popup.js` and `options.js` share significant workspace/prompt rendering logic.  
  *Planned follow‑up:* extract a shared presenter/module after the v2.0.0 release.
- **Manual Coverage Required**:
  - Live Google OAuth / Drive integration (E2E tests rely on mocks and do not hit real Google APIs).
  - Gemini Nano model download and `window.ai` availability on user machines (verified via `gemini-diagnostic.html` and docs, not automated).

### 🏁 Release Readiness

**Status: READY FOR PUBLICATION TO CHROME WEB STORE**

- All unit and E2E suites are green on a clean environment.
- Core user journeys (workspace + prompt lifecycle, sidepanel quick access, Smart Delete) are covered by automated tests.
- Manual smoke tests have been run for:
  - Google sign‑in/out and backup/restore on at least one real Google account.
  - Gemini Nano availability using the provided diagnostic and help pages.

---

## Recent Updates

- **2025-12-30:** Test Harness Patching: Uplifted all E2E tests for v2.1.1 UI; fixed critical "page closed" errors.
- **2025-12-30:** Bug Fixes: Resolved editor height cutoff, padding polish, and footer stats reset logic.
- **2025-12-28:** Added collapsible Workspaces/Prompts sections and `+` parity between sidepanel and options; extended Playwright coverage.
- **2025-12-28:** Fixed UI regressions (selection highlight, footer stats). Verified with `regression_fixes.spec.js`.
- **2025-12-28:** Implemented drag‑and‑drop and polished side panel UI.
- **2025-12-28:** Migrated to Side Panel architecture (ADR‑0002).

---

## Maturity Assessment (v2.1)

### Strengths (Competitive Advantage)
*   **Privacy-First**: All prompts are stored locally in `chrome.storage` with optional backup to the user’s own Google Drive AppData. No third-party servers, no API keys.
*   **Native AI Integration**: Gemini Nano (Chrome built‑in AI) powers on‑device refinement (Magic Enhance, Formalize, Clarify, Shorten). Most competitors rely on paid cloud APIs, we are **free and low‑latency** when the model is available.
*   **Architecture**: Service layer (`StorageService`, `AIService`, `GoogleDriveService`) + offscreen AI bridge give a clean separation between UI and logic.
*   **Workspaces & Versioning**: Prompts are grouped into workspaces with full version history and easy “time‑travel”.
*   **Side Panel + Full IDE**: Users get a lightweight side panel for paste‑to‑page flows and a full‑page options editor for deep prompt engineering, sharing the same data model.

### Weaknesses (Gaps vs. Market Leaders)
*   **Organization Depth**: Workspaces exist, but there is no nesting, tags, or saved filters yet.
*   **Templating**: Good placeholder support (`[placeholder]`, `{{name}}`) with highlighting, click-to-select, and double-click selection; no forms or variable binding yet.
*   **Collaboration**: Google Drive sync covers backup and multi‑device use for a single user, but there is no shared library or team workspace model.
*   **AI Dependency on Chrome**: Gemini Nano availability depends on Chrome flags / rollout; when missing, PromptKeeper is “prompt library only” (no AI optimization).
*   **UI Polish**: v2.1 brings a refined UI (Apple‑style theming, collapsible sidebars, drag‑and‑drop, context menus) and **Rich Markdown Support**, but lacks inline diff view or analytics dashboards common in heavier SaaS tools.

### Peer Comparison
| Feature | PromptKeeper v2.2 | Market Standard (e.g., AIPRM, PromptGenius) |
| :--- | :--- | :--- |
| **Storage** | Local (Chrome Storage) + optional Google Drive backup | Cloud / Hosted Sync |
| **AI** | **Native (Gemini Nano)**, on‑device | External API Keys (OpenAI/Anthropic) |
| **Prompt Coach** | **Yes (real-time scoring + attribute tags)** | No |
| **Versioning**| **Yes (per‑prompt history + restore)** | Often Premium Feature |
| **Sorting** | **Yes (Name, Date, Modified)** | Basic or Premium |
| **Theme Control** | **Yes (Light/Dark/Auto)** | Limited |
| **Templates** | **Yes (placeholder highlighting + double-click selection)** | Yes (Variables, Forms) |
| **Workspaces** | Yes (per‑project grouping) | Folders/Tags/Collections |
| **Community** | No | Public Libraries / Sharing |

### Verdict
PromptKeeper v2.2 is **production‑ready for individual power users** who value privacy, local‑first storage, and on‑device AI.

**Unique Differentiator**: Prompt Coach provides real-time prompt quality scoring with visual attribute tags—**no competitor has this feature**. It teaches prompt engineering best practices as users write.

We are competitive on **privacy, cost, and core workflow** (workspaces, versioning, sorting, sidepanel + IDE), but intentionally lean on advanced SaaS features like templating UIs, team sharing, and analytics.
Next maturity steps should focus on: (1) richer organization (tags/nesting), (2) ergonomic templating, and (3) optional sharing/export flows that still respect the privacy‑first positioning.

### Future Collaboration Direction (Post‑v2)
A pragmatic next step for collaboration is to **piggy‑back on Google Drive’s existing sharing model** instead of building a custom backend:
- Allow users to **export or mirror their library into a regular (user‑visible) Drive folder or file**, not just AppData.
- That folder/file can then be **shared via standard Drive sharing** (e.g. a shared folder of prompt‑pack JSON files or a single “team library” file).
- Other PromptKeeper users could **import or periodically sync** from that shared location, with a simple “last‑write‑wins” merge strategy.

This keeps PromptKeeper’s privacy stance (no third‑party servers) while opening a pathway to lightweight collaboration and “prompt packs” shared via Drive.
