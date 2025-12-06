# Recommendations & Future Scope

## Feature Recommendations
1.  **Google Drive Sync**:
    *   *Problem*: Local-only storage means data is trapped on one device. Users want to access prompts across work/home machines.
    *   *Solution*: Implement "Sync to Google Drive" using the Chrome Identity API and Google Drive API.
    *   *Implementation*: Save the JSON dump to a specific app folder in Drive. This maintains privacy (user's own drive) while enabling portability.

2.  **Chained Prompts (Agentic Workflows)**:
    *   *Concept*: Allow users to define a sequence of prompts where the output of Prompt A becomes the input variable for Prompt B.
    *   *Example*: [Research Topic] -> [Generate Outline] -> [Draft Blog Post].

3.  **Variable Injection**:
    *   *Concept*: Add `{{variable}}` syntax support.
    *   *UX*: When copying/injecting a prompt, detect variables and pop up a simple modal asking for values (e.g., "Enter 'Tone'", "Enter 'Audience'").

4.  **Prompt Library Integration**:
    *   *Concept*: A curated "Store" or "Repository" of community prompts (e.g., from "Awesome ChatGPT Prompts") that users can browse and fork into their local library.

## Architectural Improvements
1.  **React/Vue Migration**:
    *   *Observation*: The vanilla JS + DOM manipulation in `options.js` is becoming complex.
    *   *Recommendation*: For the next major version (v2.0), migrate the Options Page to a lightweight framework like React or Preact. This will make managing state (History, Projects, Selection) much cleaner.

2.  **Typescript Migration**:
    *   *Observation*: JSDoc is helpful, but true TypeScript would prevent data shape errors, especially as the `Prompt` object grows more complex in Phase 4.

3.  **Automated E2E Testing**:
    *   *Observation*: Unit tests cover logic, but we rely on manual testing for UI/Extension APIs.
    *   *Recommendation*: Set up Puppeteer or Playwright to test the full extension flow in a headless browser.
