# Phase 3: AI-Powered Optimization
**Goal**: Leverage Gemini Nano to improve prompt quality using the "Prompting 101" framework.

## Task 3.1: Scoring Logic
**Issue Title**: Feat: Implement "Score My Prompt" with Gemini Nano
**Description**: 
Evaluate the user's prompt against the 4 Pillars: Persona, Task, Context, Format.

**Acceptance Criteria**:
- [x] Update `AIService` to support a "Scoring" session.
- [x] System Prompt: "Evaluate based on Persona, Task, Context, Format. Return JSON { score: 1-10, feedback: '...' }."
- [x] Display the Score and Feedback in the Right Sidebar.

## Task 3.2: Refinement Actions
**Issue Title**: Feat: Add Quick Refinement Actions
**Description**: 
One-click buttons to fix common issues.

**Acceptance Criteria**:
- [x] Add buttons: "Formalize", "Clarify", "Summarize".
- [x] Each button triggers a specific Gemini transformation prompt.
- [x] Result replaces (or appends to) the current editor content.

## Task 3.3: Intent-Based Presets
**Issue Title**: Feat: Implement Intent-Based Transformation Presets
**Description**: 
"Magic" buttons that transform rough notes into specific formats.

**Acceptance Criteria**:
- [x] **Magic Enhance**: Transforms rough notes -> Structured Prompt (Persona/Task/Context/Format).
- [x] **Image Gen**: Transforms description -> Visual Prompt (Subject, Style, Mood).
- [x] **Professional Polish**: Transforms slang/notes -> Business Email/Doc (Covered by "Formalize").
