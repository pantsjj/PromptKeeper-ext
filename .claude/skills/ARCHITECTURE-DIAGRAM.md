# PromptKeeper Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PromptKeeper Chrome Extension                        │
│                              (Manifest V3)                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                              User Interfaces
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌────────────────┐ │
│  │    Side Panel       │    │    Full-Page IDE    │    │  Diagnostic    │ │
│  │  (sidepanel.html)   │    │   (options.html)    │    │    Pages       │ │
│  │                     │    │                     │    │                │ │
│  │  • Quick access     │    │  • Master-detail    │    │ gemini-        │ │
│  │  • Paste-to-page    │    │  • AI tools panel   │    │ diagnostic.html│ │
│  │  • Search prompts   │    │  • Drive controls   │    │ gemini-help    │ │
│  │  • Workspace nav    │    │  • Full editing     │    │ .html          │ │
│  └─────────┬───────────┘    └─────────┬───────────┘    └────────────────┘ │
│            │                          │                                    │
│            └──────────┬───────────────┘                                    │
│                       │                                                     │
│                       ▼                                                     │
└─────────────────────────────────────────────────────────────────────────────┘

                              Service Layer
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐ │
│  │   StorageService    │  │     AIService       │  │ GoogleDriveService │ │
│  │                     │  │                     │  │                    │ │
│  │  • CRUD prompts     │  │  • Magic Enhance    │  │  • OAuth2 flow     │ │
│  │  • Version history  │  │  • Formalize        │  │  • Backup library  │ │
│  │  • Workspace mgmt   │  │  • Improve Clarity  │  │  • Restore library │ │
│  │  • Data migration   │  │  • Shorten          │  │  • Auto-backup     │ │
│  │  • Import/Export    │  │  • Streaming        │  │                    │ │
│  │                     │  │  • Cancel support   │  │                    │ │
│  └─────────┬───────────┘  └─────────┬───────────┘  └─────────┬──────────┘ │
│            │                        │                        │            │
└────────────┼────────────────────────┼────────────────────────┼────────────┘
             │                        │                        │
             ▼                        ▼                        ▼

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐
│ chrome.storage.local│  │   Offscreen Bridge  │  │    Google Drive API     │
│                     │  │   (offscreen.js)    │  │                         │
│  • Prompts          │  │                     │  │  • AppData folder       │
│  • Projects         │  │  ┌───────────────┐  │  │  • promptkeeper-        │
│  • Settings         │  │  │  Gemini Nano  │  │  │    backup.json          │
│                     │  │  │  (On-Device)  │  │  │                         │
│  ~10MB limit        │  │  │               │  │  │  User's own account     │
│                     │  │  │  • Prompt API │  │  │                         │
└─────────────────────┘  │  │  • Rewriter   │  │  └─────────────────────────┘
                         │  │  • Summarizer │  │
                         │  └───────────────┘  │
                         └─────────────────────┘

                         Background Service Worker
┌─────────────────────────────────────────────────────────────────────────────┐
│                          background.js                                       │
│                                                                             │
│  • Extension lifecycle management                                           │
│  • Offscreen document creation                                              │
│  • Message routing between contexts                                         │
│  • Google Drive sync coordination                                           │
│  • Auto-backup alarm (30-min cadence)                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                         Content Script (Injection)
┌─────────────────────────────────────────────────────────────────────────────┐
│  contentScript.js + injectedScript.js                                       │
│                                                                             │
│  • "Paste-to-Page" feature                                                  │
│  • Injects prompt text into active input fields                             │
│  • Works on ChatGPT, Claude, Gemini, etc.                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           User Journey: Create & Enhance Prompt             │
└─────────────────────────────────────────────────────────────────────────────┘

User Action                   System Response
    │
    │ 1. Opens Side Panel
    ▼
┌─────────────┐
│ Click icon  │───────────▶ Side Panel renders with prompt list
└─────────────┘
    │
    │ 2. Creates new prompt
    ▼
┌─────────────┐              ┌──────────────────┐
│ Click "+"   │───────────▶ │ StorageService   │──▶ chrome.storage.local
└─────────────┘              │ .addPrompt()     │     └── New prompt object
    │                        └──────────────────┘         with UUID, version
    │ 3. Types content
    ▼
┌─────────────┐
│ Edit text   │───────────▶ Editor updates, unsaved indicator shows
└─────────────┘
    │
    │ 4. Clicks "Magic Enhance"
    ▼
┌─────────────┐              ┌──────────────────┐     ┌─────────────────┐
│ AI Button   │───────────▶ │ AIService        │────▶│ Offscreen Doc   │
└─────────────┘              │ .enhancePrompt() │     │ (Gemini Nano)   │
    │                        └──────────────────┘     └────────┬────────┘
    │                                                          │
    │ 5. Streaming response                                    │
    ▼                                                          │
┌─────────────┐                                                │
│ UI updates  │◀───────────────────────────────────────────────┘
│ progressively│     Streaming tokens via message passing
└─────────────┘
    │
    │ 6. Saves prompt (auto or manual)
    ▼
┌─────────────┐              ┌──────────────────┐
│ Cmd+S       │───────────▶ │ StorageService   │──▶ New version created
└─────────────┘              │ .updatePrompt()  │     Version history grows
                             └──────────────────┘
```

## Chrome AI Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Gemini Nano Integration (Unique Differentiator)          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│  Extension Page  │     │   background.js  │     │    Offscreen Document   │
│  (popup/options) │     │  Service Worker  │     │     (offscreen.html)    │
└────────┬─────────┘     └────────┬─────────┘     └────────────┬─────────────┘
         │                        │                            │
         │ 1. AI request          │                            │
         │ ──────────────────────▶│                            │
         │                        │ 2. Ensure offscreen exists │
         │                        │ ───────────────────────────▶
         │                        │                            │
         │                        │ 3. Forward request         │
         │                        │ ───────────────────────────▶
         │                        │                            │
         │                        │                   ┌────────┴────────┐
         │                        │                   │  window.ai.*    │
         │                        │                   │  (Gemini Nano)  │
         │                        │                   │                 │
         │                        │                   │  Prompt API     │
         │                        │                   │  Rewriter API   │
         │                        │                   │  Summarizer API │
         │                        │                   └────────┬────────┘
         │                        │                            │
         │                        │ 4. Stream response         │
         │                        │ ◀───────────────────────────
         │                        │                            │
         │ 5. Update UI           │                            │
         │ ◀──────────────────────│                            │
         │                        │                            │

Why Offscreen Document?
━━━━━━━━━━━━━━━━━━━━━━━
• MV3 Service Workers don't have DOM access
• window.ai requires DOM context
• Offscreen document provides isolated web page context
• CSP-safe: No inline scripts (language-model-shim.js)
```

## Data Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Storage Schema                                  │
└─────────────────────────────────────────────────────────────────────────────┘

chrome.storage.local = {
  "prompts": [
    {
      "id": "uuid-v4",                    // Unique identifier
      "title": "API Request Generator",   // Display name
      "currentVersionId": "v3",           // Head pointer
      "versions": [                       // Full history
        { "id": "v1", "content": "...", "timestamp": 1735000000000 },
        { "id": "v2", "content": "...", "timestamp": 1735000100000 },
        { "id": "v3", "content": "...", "timestamp": 1735000200000 }
      ],
      "tags": ["coding", "api"],          // Organization (future UI)
      "projectId": "proj-123",            // Workspace association
      "createdAt": 1735000000000,
      "updatedAt": 1735000200000
    }
  ],

  "projects": [                           // Workspaces
    {
      "id": "proj-123",
      "name": "Work Prompts",
      "systemPrompt": "",                 // Base context (future)
      "createdAt": 1735000000000
    }
  ]
}
```

## Test Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Testing Pyramid                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │   Manual    │  OAuth, AI availability
                              │   Testing   │  Production smoke tests
                              └──────┬──────┘
                                     │
                         ┌───────────┴───────────┐
                         │    E2E (Playwright)   │  42 tests
                         │                       │  User journeys
                         │  Side Panel, IDE,     │  Workspaces, AI UI
                         │  Markdown, Settings   │
                         └───────────┬───────────┘
                                     │
               ┌─────────────────────┴─────────────────────┐
               │              Unit (Jest)                  │  23 tests
               │                                           │
               │  StorageService  AIService  DriveService  │
               │  CRUD, versions  Streaming  OAuth mocks   │
               └───────────────────────────────────────────┘
```
