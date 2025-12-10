# Technical Debt & Known Issues

## Overview
This document tracks technical debt, temporary workarounds, and areas for code improvement.

## active

### 1. Refactor `options.js`
*   **Severity**: Medium
*   **Description**: `options.js` has grown large (~800 lines) and contains mixed concerns (UI rendering, Event Handling, Drive logic).
*   **Plan**: Split into sub-modules: `ui/Editor.js`, `ui/Sidebar.js`, `ui/Footer.js`.

### 2. Test Coverage
*   **Severity**: High
*   **Description**: Unit tests cover `AIService` and `StorageService`, but UI logic in `options.js` and `popup.js` is largely untested.
*   **Plan**: Introduce integration tests or E2E tests (Playwright) for critical user flows.

### 3. Duplicate CSS
*   **Severity**: Low
*   **Description**: formatting styles are duplicated between `popup.html` (embedded styles) and `styles.css`.
*   **Plan**: Unify all styles into a robust CSS architecture (BEM or utility classes).

### 4. AI Service Error Handling
*   **Severity**: Medium
*   **Description**: The "Offscreen Document" workaround for `window.ai` is fragile. If the offscreen document closes unexpectedly, the AI service might hang.
*   **Plan**: Implement a robust retry mechanism and "keep-alive" heartbeat.

## Resolved (v2.0)

*   [x] CSP Violation in `gemini-diagnostic.html` (Fixed by moving inline scripts to `gemini-diagnostic.js`)
*   [x] Duplicate Status Bar in `options.html` (Fixed by unifying to footer)
