# PromptKeeper Rules & Guidelines

## Quality Assurance & Testing

Before committing any code, you must ensure that all test suites and linters pass successfully.

### Pre-Commit Command
Always execute the following command before pushing:
```bash
npm test && npm run test:e2e && npm run lint
```

### Individual Test Commands
* **Unit Tests (Jest)**: `npm test`
* **Coverage**: `npm test -- --coverage`
* **E2E Tests (Playwright)**: `npm run test:e2e`
* **Specific E2E Suite**: `npx playwright test <path-to-file.spec.js>`

## Procedural Workflows
For detailed pre-release checks, packing instructions, or AI feature validation, refer to the step-by-step guides located in `.agents/workflows/`.
