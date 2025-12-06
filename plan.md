# Roadmap: PromptKeeper Evolution

This roadmap outlines the strategic development plan to transform PromptKeeper into a robust, local-first prompt engineering tool.

## Phase 1: Foundation & Data Model Refactor (Critical)
*Current Limitation: Prompts are stored as a simple array of strings. This prevents metadata, titles, or history.*

*   [ ] **Refactor Data Structure**: Migrate `chrome.storage.local` from `['text']` to:
    ```json
    {
      "prompts": [
        {
          "id": "uuid-v4",
          "title": "My Prompt",
          "currentVersionId": "v2",
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
*   [ ] **Migration Script**: Create a "onUpdate" handler in `background.js` to migrate existing user data to the new format without data loss.
*   [ ] **UI Update**: Update `popup.js` to render lists based on `title` instead of raw content.

## Phase 2: Version Control System
*Goal: Allow users to experiment fearlessly.*

*   [ ] **Version History UI**: Add a "History" view in the popup to see previous iterations of a prompt.
*   [ ] **Revert Functionality**: Ability to restore an older version as the "current" version.
*   [ ] **Diff View (Optional)**: Simple visual indicator of added/removed text between versions (Stretch goal).

## Phase 3: AI-Powered Optimization (Gemini Nano Integration)
*Goal: Leverage Chrome's built-in AI to improve prompt quality using the "Gemini for Google Workspace: Prompting 101" framework.*

*   [ ] **"Optimize" Action**: A button that sends the current prompt to Gemini Nano with a meta-prompt: *"Rewrite this prompt to be more clear, specific, and effective using the Persona-Task-Context-Format framework."*
*   [ ] **"Score" Action**: Analyze the prompt and return a score (1-10) based on the 4 pillars defined in the best practice guide:
    *   **Persona**: Does it assign a role? (e.g., "You are a Product Manager")
    *   **Task**: Is the objective clear and active? (e.g., "Draft an email")
    *   **Context**: Is there sufficient background info?
    *   **Format**: Is the output format specified? (e.g., "Table", "Bullet points")
*   [ ] **Iterative Refinement UI**:
    *   Based on the guide's "Refine" and "Elaborate" workflows, add quick-action buttons for common refinements: "Formalize Tone", "Summarize", "Make it clearer".
*   [ ] **Intent-Based Suggestions (Auto-Generate)**:
    *   **"Magic Enhance"**: Analyzes rough user input to extract core intent and rewrites it into a structured prompt.
    *   **Specialized Presets**:
        *   *"Optimize for Image Generation"*: Restructures prompt for visual models (focusing on subject, style, lighting, composition).
        *   *"Professional Polish"*: Elevates tone for business contexts.
*   [ ] **Model Management UI**: Handle the "Download" state of Gemini Nano gracefully (progress bars, status indicators) as per Chrome 143 guidelines.

## Phase 4: Advanced Management & Templating
*Goal: Reusability and structure.*

*   [ ] **Variable Support**: Support `{{variable_name}}` syntax. When injecting, prompt the user (simple modal) to fill in the values.
*   [ ] **Tagging System**: Filter prompts by tags (e.g., #creative, #coding, #work).
*   [ ] **Export/Import**: JSON export for backup or sharing.

---

## Recommendations & Competitor Analysis
Based on analysis of LaunchDarkly, PromptLayer, and Anthropic's guides, here are recommended features to distinguish PromptKeeper:

1.  **The "Playground" Concept**: Competitors like PromptLayer offer a side-by-side playground.
    *   *Recommendation*: We can't easily run 3rd party models locally, but we *can* use Gemini Nano as a "Test Runner" to see how a model interprets the prompt immediately.

2.  **Context Management**: Anthropic emphasizes "Context Engineering".
    *   *Recommendation*: Add a "Context Bin". Allow users to store snippets of context (e.g., "Project Specs", "Brand Voice") separately and "attach" them to a prompt dynamically. This reduces repetition.

3.  **Prompt Libraries**:
    *   *Recommendation*: Pre-ship the extension with a "Starter Pack" of high-quality, best-practice prompts (System Instructions, Chain-of-Thought templates) to onboard users to good habits.

4.  **Privacy as a Feature**:
    *   *Recommendation*: Explicitly market the "Local-Only" aspect. Competitors are mostly SaaS. PromptKeeper is a "Local Vault". Add a "Privacy Check" badge showing no network requests are made.

## Next Steps
Please review this plan. I recommend starting with **Phase 1 (Data Model Refactor)** as it is the prerequisite for all other features. Shall I generate the GitHub Issues for Phase 1?
