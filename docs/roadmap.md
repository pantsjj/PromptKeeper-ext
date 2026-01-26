# Roadmap: PromptKeeper Evolution

This roadmap outlines the strategic development plan to transform PromptKeeper into a robust, local-first prompt engineering tool.

## Phase 0: Architecture & UX Foundation (High Impact / Min Effort)
*Goal: Decouple logic from UI and provide enough screen real estate for "Engineering" prompts.*

*   [x] **Service Layer Extraction**: Move logic out of `popup.js` into dedicated ES modules:
    *   `StorageService.js`: Handles CRUD, Data Migration, and Versioning logic.
    *   `AIService.js`: Wrapper for `window.ai` interactions, handling sessions and fallbacks.
*   [x] **Full-Page Editor (Options Page)**:
    *   *Problem*: A 600px popup is too small for serious prompt engineering.
    *   *Solution*: Build `options.html` as a full-screen "IDE" for deep work, keeping `popup.html` for quick access/injection.
*   [x] **Visual Polish**: Implement a clean, card-based UI with "Dark Mode" support to feel like a professional developer tool.

## Phase 1: Data Model Refactor (Critical)
*Current Limitation: Prompts are stored as a simple array of strings. This prevents metadata, titles, or history.*

*   [x] **Refactor Data Structure**: Migrate `chrome.storage.local` from `['text']` to:
    ```json
    {
      "prompts": [
        {
          "id": "uuid-v4",
          "title": "My Prompt",
          "currentVersionId": "v2",
          "projectId": "proj-123",
          "versions": [
            { "id": "v1", "content": "Draft 1", "timestamp": 123456789 },
            { "id": "v2", "content": "Draft 2", "timestamp": 123456799 }
          ],
          "tags": ["coding", "email"],
          "updatedAt": 123456799
        }
      ]
    }
    ```
*   [x] **Migration Script**: Create a "onUpdate" handler in `background.js` to migrate existing user data.
*   [x] **UI Update**: Update `popup.js` (and new `options.js`) to render lists based on `title`.

## Phase 2: Version Control System
*Goal: Allow users to experiment fearlessly.*

*   [x] **Version History UI**: Add a "History" view to see previous iterations.
*   [x] **Revert Functionality**: Ability to restore an older version.
*   [ ] **Diff View (Optional)**: Visual indicator of text changes.

## Phase 3: AI-Powered Optimization (Gemini Nano)
*Goal: Leverage Chrome's built-in AI using the "Hybrid API" framework (Prompt + Rewriter).*

*   [x] **Refinement Actions**: Quick actions for "Formalize" (Rewriter API), "Summarize" (Summarizer API), "Clarify" (Prompt API).
*   [x] **Intent-Based Suggestions (Auto-Generate)**:
    *   **"Magic Enhance"**: Extracts intent from rough notes and formats it (Prompt API).
    *   **"Professional Polish"**: Rewrites for business context (Rewriter API).
*   [x] **Model Management**: Diagnostic "Traffic Light" UI and Helper Guides for model availability.
*   [x] **Side Panel Integration**: AI buttons available directly in the quick-edit side panel.

## Phase 3.5: Offscreen Document for AI Access
*Goal: Workaround Chrome's limitation where `window.ai` is not available in extension contexts.*

*   [x] **Offscreen Document**: Created hidden web page (`offscreen.html`) where `window.ai` IS accessible.
*   [x] **Message Passing**: Implemented `chrome.runtime.sendMessage()` bridge between extension pages and offscreen document.
*   [x] **Background Service Worker**: Manages offscreen document lifecycle (create on startup, ensure exists before operations).
*   [x] **AIService Refactor**: Updated to use message passing instead of direct `window.ai` access.
*   [x] **Manifest Updates**: Added `offscreen` permission and `background.service_worker` configuration.

## Phase 6: Editor Experience (v2.1 Released)
*Goal: Improve the writing and reading experience for complex prompts.*

*   [x] **Markdown Support**:
    *   Render specific markdown elements (Bold, Italic, Code Blocks, Lists) in the editor for readability.
    *   **Click-to-Edit**: Seamless toggling between preview and edit modes.
    *   Implement "Strip Markdown" on paste to allow pasting clean text into web forms.
*   [x] **Keyboard Shortcuts**:
    *   `Cmd+B` / `Cmd+I` for formatting.
    *   `Cmd+Enter` to save.

---

## Phase 7: Organization & Sorting (v2.2)
*Goal: Enable power users to manage large prompt libraries effectively.*

### 7.1 Sort Options (P0 - Low Effort, High Impact)
*User Request: "Can prompts be sorted by name instead of date/time?"*

*   [ ] **Sort Dropdown**: Add sort control to prompt list header
    *   Sort by: Name (A-Z), Name (Z-A), Newest First, Oldest First, Recently Modified
    *   Persist sort preference in `chrome.storage.local`
*   [ ] **Default Behavior**: Maintain current "newest first" as default
*   [ ] **Workspace-Specific Sorting**: Each workspace can have its own sort preference

**Value Proposition:**
- Direct user request from Chrome Web Store feedback
- Essential for users with 50+ prompts
- Low implementation effort (~2 hours)
- Competitive parity with FlashPrompt, AIPRM

### 7.2 Tags UI (P1 - Medium Effort, High Impact)
*Note: `tags` field already exists in data model but is unused in UI.*

*   [ ] **Tag Input**: Inline tag editor below prompt title
    *   Comma-separated or Enter to add
    *   Click tag to remove
    *   Autocomplete from existing tags
*   [ ] **Filter by Tag**: Tag chips in sidebar for quick filtering
*   [ ] **Tag Management**: View all tags, rename, merge duplicates
*   [ ] **Smart Tagging**: AI-suggested tags based on prompt content (using Gemini Nano)

**Value Proposition:**
- Cross-workspace organization (tags transcend workspaces)
- Already in data model—just needs UI
- Enables the Prompt Coach feature (see Phase 8)
- Competitive with AIPRM's category system

---

## Phase 8: Template Variables (v2.3)
*Goal: Enable reusable prompt templates with dynamic placeholders.*

### 8.1 Variable Syntax (P1 - Medium Effort)
*   [ ] **Syntax**: `{{variable_name}}` with optional defaults `{{name:default_value}}`
*   [ ] **Detection**: Automatically detect variables in prompt content
*   [ ] **Fill-In Form**: Modal or side panel form to fill variables before paste
*   [ ] **Variable History**: Remember last-used values per template

**Example:**
```
You are a {{role:senior developer}} reviewing {{language:Python}} code.
Focus on {{focus_areas}} and provide feedback in {{format:bullet points}}.
```

### 8.2 Template Management
*   [ ] **Mark as Template**: Flag prompts as reusable templates
*   [ ] **Template Gallery**: Separate view for template prompts
*   [ ] **Duplicate with Values**: Create new prompt from template with filled values

**Value Proposition:**
- Competitive parity with AIPRM, ManagePrompts, PromptLayer
- Reduces prompt duplication
- Enables team sharing (fill different values for different contexts)

---

## Phase 9: Prompt Coach & Scoring (v2.4) ⭐ UNIQUE DIFFERENTIATOR
*Goal: Real-time prompt quality assessment with visual attribute indicators.*

### 9.1 Prompt Scoring Framework

Based on synthesis of best practices from:
- [Anthropic Claude Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
- [Google Gemini Prompting Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)

**The 7 Pillars of Prompt Quality:**

| # | Attribute | Tag Display | Criteria |
|---|-----------|-------------|----------|
| 1 | **Clear Task** | `#ClearTask` | Has explicit action verb (analyze, write, create, summarize) |
| 2 | **Specific Context** | `#Context` | Provides background, constraints, or domain info |
| 3 | **Role/Persona** | `#Role` | Defines who the AI should act as |
| 4 | **Output Format** | `#Format` | Specifies desired structure (JSON, bullets, paragraphs) |
| 5 | **Examples** | `#Examples` | Includes one or more examples (few-shot) |
| 6 | **Constraints** | `#Constraints` | States what to avoid or limits (length, tone, topics) |
| 7 | **Specificity** | `#Specific` | Uses precise language, avoids ambiguity |

**Scoring Formula:**
- Each attribute = 14 points (7 × 14 = 98 max)
- Partial credit for weak matches
- Maximum score: **99/100** (no perfect prompt exists)

### 9.2 Real-Time Visual Feedback

**UI Design - Attribute Tags at Bottom of Editor:**

```
┌─────────────────────────────────────────────────────────┐
│ [Prompt Editor Content Area]                            │
│                                                         │
│ You are a senior Python developer reviewing code...     │
│                                                         │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Score: 71/99                                            │
│                                                         │
│ ██ #ClearTask  ██ #Context  ░░ #Role  ██ #Format       │
│ ░░ #Examples   ██ #Constraints  ██ #Specific           │
│                                                         │
│ 💡 Add a persona (e.g., "Act as...") to improve score  │
└─────────────────────────────────────────────────────────┘

Legend:
██ = Achieved (colored, e.g., blue/green)
░░ = Not achieved (grayed out)
```

*   [ ] **Attribute Tags Bar**: Horizontal row of 7 attribute chips below editor
*   [ ] **Progressive Coloring**: Tags light up as attributes are detected
*   [ ] **Hover Tooltips**: Explain what each attribute means and how to achieve it
*   [ ] **Score Counter**: Running total (e.g., "71/99") updates as user types
*   [ ] **Improvement Hints**: One-line suggestion for the highest-impact missing attribute

### 9.3 Detection Logic (Gemini Nano + Heuristics)

**Hybrid Approach:**
1. **Fast Heuristics** (instant, as user types):
   - `#ClearTask`: Regex for action verbs (analyze|write|create|summarize|explain|generate|...)
   - `#Role`: Pattern match "Act as", "You are a", "Assume the role"
   - `#Format`: Keywords (JSON|bullet|list|table|paragraph|markdown|XML)
   - `#Examples`: Detect "Example:", "For instance:", "e.g.," or code blocks
   - `#Constraints`: "Do not", "Avoid", "Limit to", "Maximum", "Only"

2. **AI-Powered Analysis** (on save or explicit check):
   - Use Gemini Nano Prompt API to analyze for #Context and #Specific
   - Provide nuanced scoring with confidence levels
   - Generate improvement suggestions

### 9.4 Implementation Files

| Component | File | Notes |
|-----------|------|-------|
| Scoring Engine | `services/PromptCoachService.js` | New service |
| Attribute Detector | `services/AttributeDetector.js` | Heuristics + AI |
| UI Component | `prompt-coach-bar.js` | Tag bar renderer |
| Styles | `prompt-coach.css` | Chip styling |

**Value Proposition:**
- **Unique Feature**: No competitor has real-time prompt scoring with visual feedback
- **Educational**: Teaches users prompt engineering as they write
- **Gamification**: Score creates engagement and motivation to improve
- **Leverages Gemini Nano**: Uses on-device AI for analysis (free, private)
- **Progressive Enhancement**: Works with heuristics alone if AI unavailable

---

## Phase 10: Additional Chrome AI APIs (v2.5)
*Goal: Leverage full suite of Chrome's built-in AI capabilities.*

*   [ ] **Translator API**: "Translate prompt to [language]" button
*   [ ] **Proofreader API**: Grammar and clarity checking (feeds into #Specific score)
*   [ ] **Language Detector API**: Auto-detect prompt language, suggest translation
*   [ ] **Writer API**: "Generate prompt from intent" - describe what you want, AI writes the prompt

---

## Future Scope / Experimental
*   **Diff View**: Visual text comparison between revisions.
*   **Prompt Packs**: Export/share collections via Google Drive folders.
*   **Nested Workspaces**: Folder hierarchy for complex organizations.
*   **Usage Analytics**: Track which prompts are used most (local only).
*   **Keyboard Shortcut Insertion**: FlashPrompt-style keyword triggers.

---

## Success Metrics
*   **Trust**: User data never leaves the device.
*   **Performance**: AI operations take < 2 seconds (after model load).
*   **Utility**: Users can "Time Travel" through their prompt versions.
*   **Engagement**: Prompt Coach score improves user prompt quality over time.
*   **Differentiation**: Unique features not available in any competitor.


