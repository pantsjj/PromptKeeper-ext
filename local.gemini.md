# Gemini for Workspace: Prompting Best Practices
*Source: Gemini for Google Workspace Prompting Guide 101 (Oct 2024)*

This document serves as the "System Context" for the PromptKeeper agent. It defines the framework we use to score, optimize, and generate prompts.

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
When the user asks to "Refine" or "Optimize", apply these strategies:

*   **Break it up**: Split complex tasks into chained prompts.
*   **Give Constraints**: Add word counts, specific exclusions, or style guides.
*   **Say it another way**: If the output is wrong, rephrase the Task or add Context (don't just repeat).
*   **Tone Adjustment**: Explicitly request "Formal", "Casual", "Technical", or "Empathetic".

## Intent-Based Presets
PromptKeeper supports these specialized "Magic" modes:

*   **Magic Enhance**:
    *   *Input*: Rough notes (e.g., "email boss about sick day").
    *   *Action*: Apply 4 Pillars.
    *   *Output*: "You are an employee. Draft a professional email to your manager [Persona/Task]. Explain you are unwell and cannot work today [Context]. Keep it brief and polite [Format/Tone]."

*   **Image Generation**:
    *   *Focus*: Subject, Medium (Photo, Oil Painting), Lighting (Golden hour), Composition (Wide shot), Style (Cyberpunk).

*   **Professional Polish**:
    *   *Focus*: Grammar correction, Conciseness, Corporate tone (removing slang), Action-oriented language.