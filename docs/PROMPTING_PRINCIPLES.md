# Gemini for Google Workspace: Prompting Best Practices & Principles
*Derived from the "Prompting Guide 101" (October 2024 Edition)*

This document serves as the canonical reference for PromptKeeper's optimization logic and user education. It is designed to be consumed by both human users and the Gemini Nano model for grounding.

## 1. The Core Framework: The 4 Pillars
Effective prompts typically contain four key components. Use this framework to score and structure prompts.

### 👤 Persona (Who)
*   **Principle**: Assign a specific role to the AI to control tone, vocabulary, and perspective.
*   **Examples**: "You are a Senior Project Manager", "You are an empathetic Customer Support Agent", "You are a creative Brand Strategist".
*   **Why**: Anchors the model's response in a specific domain expertise.

### 📝 Task (What)
*   **Principle**: clearly state the objective using active verbs. This is the most critical component.
*   **Examples**: "Draft an email", "Summarize this report", "Generate 5 headlines", "Create a project tracker".
*   **Why**: Tells the model exactly what output is required.

### 🌍 Context (Why/Background)
*   **Principle**: Provide background information, constraints, and the "why" behind the task.
*   **Examples**: "The audience is executive leadership", "Based on the attached meeting notes", "For a new product launch in Q4".
*   **Why**: Reduces hallucinations and ensures relevance.

### 📋 Format (How)
*   **Principle**: Specify exactly how the output should be structured.
*   **Examples**: "In a bulleted list", "As a JSON object", "In a table with columns [Date, Action, Owner]", "Limit to 280 characters".
*   **Why**: Makes the output immediately usable without manual formatting.

---

## 2. Iteration Strategy: "Make it a Conversation"
Prompting is rarely perfect on the first try. Use these strategies for refinement:

*   **Break it down**: If a task is complex, split it into chained prompts (e.g., "First outline the blog post, then write the introduction").
*   **Give Constraints**: Explicitly state what *not* to do (e.g., "Avoid jargon", "Do not use passive voice").
*   **Refine the Tone**: Ask for specific tonal shifts (e.g., "Make it more professional", "Make it punchier", "Soften the language").
*   **Use Examples (Few-Shot)**: Provide 1-2 examples of the desired input/output format to guide the model.

## 3. Quick Tips for "Power Prompts"
*   **Average Word Count**: The most fruitful prompts average around **21 words**. (Don't be too brief!).
*   **Natural Language**: Write as if speaking to a colleague. Complete thoughts work better than keywords.
*   **Specifics matter**: Instead of "Write a post", say "Write a 3-sentence LinkedIn post about sustainability".

## 4. System Grounding for Gemini Nano
*When optimizing prompts programmatically, use this instruction:*

> "Analyze the user's input against the 4 Pillars (Persona, Task, Context, Format). Identify missing components. Rewrite the prompt to include a defined Persona, a clear active Task, sufficient Context, and a specified Format. Maintain the original intent."
