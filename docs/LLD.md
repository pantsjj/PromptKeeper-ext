# PromptKeeper Extension - Low-Level Design (LLD)

## 1. Architecture Overview

```mermaid
graph TB
    subgraph "Chrome Browser"
        subgraph "Extension Context"
            BG[background.js<br/>Service Worker]
            OFF[offscreen.html<br/>Offscreen Document]
            SP[sidepanel.html<br/>Side Panel]
            OPT[options.html<br/>Options Page]
            HT[how_to.html<br/>Documentation]
        end
        subgraph "Web Page Context"
            CS[contentScript.js]
            INJ[injectedScript.js]
        end
        subgraph "Chrome APIs"
            STORAGE[(chrome.storage.local)]
            IDENTITY[chrome.identity]
            SIDEPANEL[chrome.sidePanel]
            AI[window.ai / LanguageModel<br/>Built-in AI]
        end
    end
    
    BG -->|creates| OFF
    BG -->|opens| SP
    SP -->|reads/writes| STORAGE
    OPT -->|reads/writes| STORAGE
    SP -->|uses| AI
    OFF -->|uses| AI
    CS -->|injects| INJ
    SP -->|messages| CS
```

---

## 2. Component Relationships

| Component | File(s) | Purpose |
|-----------|---------|---------|
| **Service Worker** | `background.js` | Lifecycle management, offscreen doc creation, side panel behavior |
| **Side Panel** | `sidepanel.html` + `popup.js` | Main UI when clicking extension icon |
| **Options Page** | `options.html` + `options.js` | Full-featured editor, settings |
| **Offscreen Document** | `offscreen.html` | AI bridge (runs Gemini Nano in DOM context) |
| **Content Script** | `contentScript.js` | Listens for paste-to-page messages |
| **Storage Service** | `services/StorageService.js` | CRUD for prompts/projects |
| **AI Service** | `services/AIService.js` | AI operations (local or via offscreen) |
| **Google Drive Service** | `services/GoogleDriveService.js` | Backup/restore to Drive |

---

## 3. What Happens When You Click the PromptKeeper Icon

```mermaid
sequenceDiagram
    participant User
    participant Chrome
    participant BG as background.js
    participant SP as sidepanel.html
    participant SHIM as language-model-shim.js
    participant BUILTIN as builtin-ai.js
    participant POPUP as popup.js
    participant AI as Chrome AI API

    User->>Chrome: Clicks extension icon
    Chrome->>BG: Action click event
    Note over BG: openPanelOnActionClick: true
    BG->>Chrome: Open Side Panel
    Chrome->>SP: Load sidepanel.html

    rect rgb(255, 230, 230)
        Note over SP: Script Loading Order (SYNC)
        SP->>SHIM: 1. Load language-model-shim.js
        SHIM->>AI: Check if window.ai exists
        alt AI API exists
            SHIM->>AI: Wrap .create(), .availability(), .capabilities()
        else AI API not yet injected
            Note over SHIM: Does nothing (API missing)
        end
        SP->>BUILTIN: 2. Load builtin-ai.js
        BUILTIN->>BUILTIN: Define PKBuiltinAI wrapper
    end

    rect rgb(230, 255, 230)
        Note over SP: Module Loading (DEFERRED)
        SP->>POPUP: 3. Load popup.js (module)
        Note over POPUP: Waits for DOMContentLoaded
        POPUP->>POPUP: init()
        POPUP->>POPUP: applyLanguageModelShims() [fallback]
        POPUP->>POPUP: checkAIAvailability()
        POPUP->>AI: PKBuiltinAI.getAvailability()
        AI-->>POPUP: 'readily' / 'no'
    end
```

---

## 4. The Error: Root Cause Analysis

### Error Message
```
No output language was specified in a LanguageModel API request.
Context: sidepanel.html
Stack Trace: sidepanel.html:0 (anonymous function)
```

### Why This Happens

```mermaid
flowchart TD
    A[sidepanel.html loads] --> B{Is window.ai available?}
    B -->|Yes| C[language-model-shim.js wraps API]
    B -->|No - API injected LATER| D[Shim does nothing]
    D --> E[popup.js loads as module]
    E --> F[init calls checkAIAvailability]
    F --> G{Is API wrapped?}
    G -->|Yes from shim| H[Calls with correct opts ✅]
    G -->|No - shim missed it| I[popup.js fallback shim runs]
    I --> J[But API may already be in use!]
    J --> K[Chrome throws warning ⚠️]
    
    style D fill:#ffcccc
    style J fill:#ffcccc
    style K fill:#ff9999
```

### The Race Condition
1. **`language-model-shim.js`** runs synchronously **IMMEDIATELY** when parsed
2. At that moment, `window.ai` might not exist yet (Chrome injects it asynchronously)
3. Since `window.ai` doesn't exist, the shim does nothing
4. Later, `popup.js` runs and Chrome has now injected `window.ai`
5. `popup.js` tries to use `window.ai.languageModel.capabilities()` 
6. The API is called WITHOUT the language options → **Chrome throws warning**

---

## 5. Script Loading Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        sidepanel.html Loading Timeline                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ Time →                                                                       │
│                                                                              │
│ [Parse HTML Start]                                                           │
│ │                                                                            │
│ ├─► language-model-shim.js (SYNC) ─┬─► window.ai? NO → skip wrapping        │
│ │                                  └─► window.LanguageModel? NO → skip      │
│ │                                                                            │
│ ├─► builtin-ai.js (SYNC) ──────────► Define PKBuiltinAI                     │
│ │                                                                            │
│ ├─► libs/marked.min.js (SYNC) ─────► Markdown parser                        │
│ │                                                                            │
│ ├─► popup.js (MODULE/DEFERRED) ────┬─► Waits for DOMContentLoaded           │
│ │                                  │                                         │
│ │   [Chrome injects window.ai]     │  ← AI API becomes available HERE       │
│ │                                  │                                         │
│ │                                  └─► init() → checkAIAvailability()       │
│ │                                       └─► Calls unwrapped API! ⚠️          │
│ │                                                                            │
│ [Parse HTML End]                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Flow

```mermaid
flowchart LR
    subgraph Storage
        S[(chrome.storage.local)]
    end
    
    subgraph UI
        SP[Side Panel]
        OPT[Options Page]
    end
    
    subgraph Services
        SS[StorageService]
        AIS[AIService]
        GDS[GoogleDriveService]
    end
    
    subgraph External
        DRIVE[Google Drive]
        NANO[Gemini Nano]
    end
    
    SP <-->|read/write prompts| SS
    OPT <-->|read/write prompts| SS
    SS <-->|persist| S
    
    SP -->|refine prompt| AIS
    OPT -->|refine prompt| AIS
    AIS -->|local AI| NANO
    
    SP -->|backup/restore| GDS
    OPT -->|backup/restore| GDS
    GDS <-->|sync| DRIVE
```

---

## 7. Proposed Fix

The shim runs too early. We need to **defer the AI initialization** until we're sure the API is available.

### Option A: Lazy Shimming (Recommended)
Instead of shimming at load time, shim lazily when the API is first accessed:

```javascript
// In popup.js init(), BEFORE calling checkAIAvailability():
await waitForAIAPI(); // Wait for window.ai to be injected
applyLanguageModelShims(); // NOW shim it
checkAIAvailability(); // Safe to call
```

### Option B: Use MutationObserver or polling
Watch for `window.ai` to appear before calling any AI methods.

### Option C: Move all AI calls to Offscreen Document
The offscreen document loads in a full DOM context where the API is reliably available.

---

## 8. Key Files to Review

| File | Lines | Purpose |
|------|-------|---------|
| language-model-shim.js | 1-52 | Early shim (runs too soon) |
| builtin-ai.js | 1-137 | PKBuiltinAI wrapper |
| popup.js | 50-111 | Fallback shim + init |
| services/AIService.js | 86-107 | getAvailability() |
