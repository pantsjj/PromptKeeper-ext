# Phase 2.2: Built-in AI Improvements (Scope of Work)

## Overview
This document outlines the next phase of work to elevate the Gemini Nano integration from "Functional" to "Delightful". Based on codebase analysis and user feedback, we will implement features that leverage the full potential of on-device AI.

## 1. Advanced Prompting Capabilities
**Goal**: Move beyond simple request/response.
- [ ] **Streaming Responses:** Implement `session.promptStreaming()` to reduce perceived latency.
    - *Benefits*: User sees output immediately, mimicking the ChatGPT experience.
- [ ] **System Prompts:** Expose the `systemPrompt` parameter in `offscreen.js` initialization.
    - *Use Case*: "You are a concise editor," "You are a code expert."
- [ ] **Context Awareness:** In `sidepanel.js` (when supported), inject page context (selected text or page title) into the prompt automatically.

## 2. Configuration & Control
**Goal**: Give power users control over the model.
- [ ] **Temperature Slider:** Add a UI control for `temperature` (0.0 - 1.0) to adjust creativity vs. determinism.
- [ ] **Top-K / Top-P:** Expose these sampling parameters in `options.html`.
- [ ] **Model Selection:** If multiple models become available (e.g., `gemini-nano-v2`), allow selection.

## 3. UI/UX Enhancements
**Goal**: Integrate AI seamlessly into the workflow.
- [ ] **"Magic Enhance" Button:** A one-click button in the Side Panel editor that rewrites the current prompt to be more effective (Prompt Engineering as a Service).
- [ ] **Auto-Summarization:** Automatically generate a title/summary when saving a new prompt if one isn't provided.
- [ ] **Toast Notifications:** Better visual feedback during model download/execution.

## 4. Code Quality & Testing
**Goal**: Robustness.
- [ ] **Session Management:** specific logic to `destroy()` sessions to free up memory (crucial for local models).
- [ ] **Mocking Framework:** Create a robust `MockAI` object in `tests/utils` to allow full E2E testing without the specialized Chrome build.

## 5. Timeline & Priorities
1. **Streaming** (High Impact, Low Effort)
2. **"Magic Enhance"** (High Impact, Medium Effort)
3. **Configuration UI** (Medium Impact, Low Effort)
4. **Context Injection** (High Impact, High Effort)
