# PromptKeeper Agent Manifesto

## 🚀 Mission (High-Level Objective)
**To create the ultimate Local-First Prompt Engineering Environment for Chrome.**
We transform the browser from a passive consumption tool into an active, privacy-first **Prompt IDE**, empowering users to leverage on-device AI (Gemini Nano) without their data ever leaving their machine.

## 🧠 Core Philosophy
1.  **Sovereignty (Local-First)**: User data is their IP. It stays in `chrome.storage.local`. Cloud sync (Google Drive) is optional and user-controlled.
2.  **Frictionless ("Paste-to-Page")**: Management happens where the work happens—via the **Side Panel**, instantly adjacent to AI tools (ChatGPT, Claude).
3.  **AI-Native**: We don't just store prompts; we *enhance* them using Chrome's built-in models (Nano), ensuring zero latency and zero API costs.

## 📂 Architecture & Documentation Map

### **Status & Roadmap**
*   **[STATUS.md](./STATUS.md)**: The single source of truth for current version, features, and maturity.
*   **[Roadmap](./docs/roadmap.md)**: Strategic vision and phased delivery plan.
*   **[Technical Debt](./docs/TECHNICAL-DEBT.md)**: Known issues and refactoring backlog.

### **Key Architectural Decisions (ADR)**
*   **[ADR-002: Side Panel Migration](./docs/adr/ADR-002-migration-to-side-panel.md)**: The shift to a master-detail layout.
*   **[ADR-004: Built-In AI Integration](./docs/adr/004-built-in-ai-integration.md)**: The generic "Offscreen Bridge" + Hybrid API strategy.
*   **[ADR-005: Markdown Rendering](./docs/adr/005-markdown-rendering.md)**: The "Click-to-Edit" rich text approach.

### **Logic, Intelligence & Quality**
*   **[Prompting Principles](./docs/PROMPTING_PRINCIPLES.md)**: The "4 Pillars" framework (Persona, Task, Context, Format) used for AI optimization.
*   **[Test Strategy](./docs/TEST_STRATEGY.md)**: Coverage matrix and suite inventory for Unit, E2E, and AI-specific journeys.

## 🛠 Active Focus (v2.1)
*   **Polish**: Ensuring "Apple-like" fit and finish (Markdown rendering, Shortcuts, Smooth D&D).
*   **Stability**: Robust AI configuration handling and comprehensive regression testing.
