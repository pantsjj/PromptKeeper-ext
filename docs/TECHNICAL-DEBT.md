# Technical Debt & Known Issues

## Overview
This document tracks technical debt, temporary workarounds, and areas for code improvement.
All items are tracked as GitHub issues: https://github.com/pantsjj/PromptKeeper-ext/issues

---

## Active Issues

### 1. Refactor `options.js` [#3](https://github.com/pantsjj/PromptKeeper-ext/issues/3)
- **Severity**: Medium
- **Description**: `options.js` is monolithic (~840 lines) and mixes UI, State, and Logic.
- **Plan**: Execute [`REFACTOR_PLAN.md`](./REFACTOR_PLAN.md). Break into `State/Store.js`, `Components/Sidebar.js`, etc.

### 2. Test Coverage [#4](https://github.com/pantsjj/PromptKeeper-ext/issues/4)
- **Severity**: High
- **Description**: Unit tests cover `AIService` and `StorageService`, but UI logic in `options.js` and `popup.js` is largely untested.
- **Plan**: Add E2E tests (Playwright) for critical user flows.

### 3. Duplicate CSS [#5](https://github.com/pantsjj/PromptKeeper-ext/issues/5)
- **Severity**: Low
- **Description**: Formatting styles are duplicated between `popup.html`, `sidepanel.html`, and `styles.css`.
- **Plan**: Unify all styles into a robust CSS architecture (BEM or utility classes).

### 4. AI Service Error Handling [#6](https://github.com/pantsjj/PromptKeeper-ext/issues/6)
- **Severity**: Medium
- **Description**: The "Offscreen Document" workaround for `window.ai` is fragile. If the offscreen document closes unexpectedly, the AI service might hang.
- **Plan**: Implement a robust retry mechanism and "keep-alive" heartbeat.

---

## Feature Backlog

### Diff View [#7](https://github.com/pantsjj/PromptKeeper-ext/issues/7)
Visual indicator of text changes between prompt versions (Phase 2 roadmap item).  
With ADR‑003 we now cap the visible history dropdown at the most recent 50 revisions; the diff view should compare the current head version against any selected historical version and present a GitHub‑style colour scheme (green additions, red deletions).

### Dynamic Variable Injection [#8](https://github.com/pantsjj/PromptKeeper-ext/issues/8)
Form-based filling of `{{variables}}` in prompts (Future Scope).

### Markdown Support [#9](https://github.com/pantsjj/PromptKeeper-ext/issues/9)
- [x] **Description**: Render standard markdown (Bold, Italic, Tables) in the editor for better readability, with option to strip formatting on paste.
- **Reference**: `docs/issues/ISSUE-005-markdown-support.md` (Resolved in v2.1.0)

---

## Resolved (v2.0)

- [x] CSP Violation in `gemini-diagnostic.html` (Fixed by moving inline scripts to `gemini-diagnostic.js`)
- [x] Duplicate Status Bar in `options.html` (Fixed by unifying to footer)
- [x] Missing `alarms` permission (Fixed in manifest.json)
- [x] Unclosed `<select>` tag in `options.html` (Fixed - was causing parse errors)
