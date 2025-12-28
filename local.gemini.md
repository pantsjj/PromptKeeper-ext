# Gemini for Workspace: Prompting Best Practices
*Source: Gemini for Google Workspace Prompting Guide 101 (Oct 2024)*

**Note on Implementation (Dec 2025):** PromptKeeper implements these best practices using a **Hybrid AI Strategy**. We use Chrome's **Prompt API** for creative enhancement and the **Rewriter API** for stylistic polish. Automated "Scoring" is currently deferred due to local model limitations, so users should use the 4 Pillars below as a mental checklist.

## The 4 Pillars of an Effective Prompt
Every optimization request should evaluate or enhance the prompt based on these four components:

1.  **Persona**: Who is the AI?
    *   *Goal*: Assign a specific role to encourage creativity and relevant tone.
    *   *Examples*: "You are a Product Manager", "You are a Senior Copywriter", "You are an empathetic Customer Service Rep".
    *   *Check*: Does the prompt define "Who"?

2.  **Task**: What must be done?
    *   *Goal*: Use active verbs and clear instructions.
    *   *Examples*: "Draft an email", "Summarize this report", "Generate 5 headlines".
    *   *Check*: Is there a clear command verb?

3.  **Context**: What is the background?
    *   *Goal*: Limit hallucinations and provide boundaries.
    *   *Examples*: "The audience is senior leadership", "Use the attached project specs", "We are a startup in the X industry".
    *   *Check*: Does the prompt explain *why* or *for whom*?

4.  **Format**: What should the output look like?
    *   *Goal*: Structure the response for immediate usability.
    *   *Examples*: "Bullet points", "A table with columns A and B", "JSON format", "Under 280 characters".
    *   *Check*: Is the output structure defined?

## Optimization Strategies (Iterative Refinement)
PromptKeeper's "Refine" buttons map to these strategies:

*   **Formalize**: (Rewriter API) Adjusts tone to be professional.
*   **Shorten**: (Summarizer/Rewriter API) Condenses text.
*   **Clarify**: (Prompt API) Rewrites task with stronger verbs.
*   **Magic Enhance**: (Prompt API) Applies all 4 Pillars to rough notes.

## Intent-Based Presets
PromptKeeper supports these specialized "Magic" modes:

*   **Magic Enhance**:
    *   *Input*: Rough notes (e.g., "email boss about sick day").
    *   *Action*: Apply 4 Pillars.
    *   *Output*: "You are an employee. Draft a professional email to your manager [Persona/Task]. Explain you are unwell and cannot work today [Context]. Keep it brief and polite [Format/Tone]."

*   **Professional Polish**:
    *   *Focus*: Grammar correction, Conciseness, Corporate tone (removing slang), Action-oriented language.