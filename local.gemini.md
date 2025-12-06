# Project Context: PromptKeeper Extension

## Overview
PromptKeeper is a local-first Chrome Extension designed for managing, organizing, and injecting prompts into browser input fields. It leverages the experimental Chrome Prompt API (Gemini Nano) for on-device AI capabilities.

## Architecture
The extension follows a standard Chrome Extension architecture with a specific pattern for handling the `window.ai` API, which is only available in the main window context (not content scripts or popup directly in some cases, though recent updates allow more flexibility).

1.  **`popup.html` / `popup.js`**:
    *   **Role**: Main UI for the user. Lists prompts, handles CRUD operations, and initiates AI tasks.
    *   **State**: Manages state using `chrome.storage.local`.
    *   **Communication**: Sends messages to `contentScript.js` to trigger actions in the page context.

2.  **`contentScript.js`**:
    *   **Role**: The bridge between the Extension UI (Popup) and the Web Page (DOM).
    *   **Functionality**:
        *   Listens for messages from `popup.js`.
        *   Manipulates the DOM (injects text into active elements).
        *   Communicates with `injectedScript.js` via `window.postMessage` to offload AI tasks that require the `window.ai` object.

3.  **`injectedScript.js`**:
    *   **Role**: Runs in the context of the web page itself.
    *   **Purpose**: Accesses the `window.ai` API (Gemini Nano) which is exposed to the page.
    *   **Flow**: Receives a prompt text, processes it (rewrites/optimizes) using the AI model, and returns the result to `contentScript.js`.

4.  **`background.js`**:
    *   **Role**: Service worker. Handles installation events (onInstalled) and context menu setup.

## Data Model (Current)
*   **Storage**: `chrome.storage.local`
*   **Key**: `'prompts'`
*   **Structure**: An array of strings.
    ```json
    ["Prompt 1 content", "Prompt 2 content"]
    ```
*   *Note*: The current model is simplistic and requires refactoring to support objects with metadata (Title, Body, Versions, Tags).

## Key Technologies
*   **Frontend**: Vanilla HTML/CSS/JS.
*   **AI**: Chrome Built-in AI (Gemini Nano) via `window.ai.languageModel`.
*   **Storage**: Chrome Storage API.

## Development Guidelines
*   **Local First**: All data stays in the browser. No external database.
*   **Privacy**: Prioritize user privacy. AI runs on-device.
*   **Async/Await**: Use modern JS patterns for asynchronous Chrome API calls.
*   **Error Handling**: Gracefully handle cases where `window.ai` is not supported or the model needs downloading.
