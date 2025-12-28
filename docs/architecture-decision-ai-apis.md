# Architecture Decision: AI API Selection
*Date: Dec 6, 2025*
*Status: Updated (Hybrid Strategy)*

## Context
Chrome now offers multiple built-in AI APIs:
1.  **Prompt API** (`window.ai.languageModel`): General-purpose LLM interaction.
2.  **Rewriter API** (`window.ai.rewriter`): Specialized for rephrasing, tone adjustment, and length modification.

## Decision
**PromptKeeper employs a Hybrid "Best-Tool-for-the-Job" Strategy.**

We utilize a modular architecture that dynamically selects the specialized API if available, falling back to the general Prompt API to ensure reliability.

## Workflow Mapping

### 1. Analysis & Recommendation ("Score Prompt")
*   **Primary Tool**: **Prompt API**
*   **Reasoning**: Requires complex evaluation logic, returning structured JSON data (Score + Feedback), and understanding abstract concepts (4 Pillars). Specialized APIs cannot do this.

### 2. Refinement ("Refine Prompt")
*   **Formalize / Polish**:
    *   *Primary*: **Rewriter API** (Tone: `more-formal`)
    *   *Fallback*: Prompt API (Instruction: "Rewrite to be more professional...")
*   **Shorten / Summarize**:
    *   *Primary*: **Rewriter API** (Length: `shorter`)
    *   *Fallback*: Prompt API (Instruction: "Shorten this...")
*   **Magic Enhance / Image Gen**:
    *   *Primary*: **Prompt API**
    *   *Reasoning*: These tasks require *adding* information (creative extrapolation) or complex structural formatting that the Rewriter API's strict "rewrite" scope does not support well.

## User Implication
Users are encouraged to enable **both** APIs for the best performance (lower latency on rewrites), but the extension remains fully functional with just the **Prompt API** enabled (via graceful fallbacks).