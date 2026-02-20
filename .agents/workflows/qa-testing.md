---
description: QA and Test Validation Workflow
---
# PromptKeeper QA & Validation Workflow

Use this workflow to validate code changes before committing and releasing.

## Step 1: Pre-Commit Checks
Run all automated checks:
```bash
npm test              # Jest unit tests
npm run test:e2e      # Playwright E2E
npm run lint          # ESLint
```
All tests must pass.

## Step 2: Coverage Audit
Assess test coverage to ensure it has not decreased:
```bash
npm test -- --coverage
```

## Step 3: Run AI Regressions
If changes touch AI-related files (`services/AIService.js`, `builtin-ai.js`, `offscreen.js`), run the specific test suites:
```bash
npx playwright test tests/e2e/ai*.spec.js
npx playwright test tests/e2e/ai_cancel_and_streaming.spec.js
```

## Step 4: Pre-Release Manual Checklist
Ensure the following checks are complete before executing a version release:
- [ ] Manual OAuth test (sign in, backup, restore via Google Drive)
- [ ] Manual AI test using Chrome Built-in AI (Gemini Nano) if available
- [ ] Version bumped in `manifest.json` and `package.json`
- [ ] Changelog updated with the new verison
- [ ] Extension bundled properly
