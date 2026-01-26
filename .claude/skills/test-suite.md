# PromptKeeper Test Suite Skill

**Trigger**: `/test` or when validating code changes

## Purpose
Run the complete PromptKeeper test suite (Jest unit tests + Playwright E2E tests) and report results.

## Test Inventory

### Unit Tests (Jest) - 23 tests
| File | Coverage |
|------|----------|
| `tests/AIService.test.js` | AI bridge, retries, streaming, cancellation |
| `tests/StorageService.test.js` | CRUD, versioning, migrations, import/export |
| `tests/GoogleDriveService.test.js` | OAuth, backup, restore |
| `tests/PKBuiltinAI.test.js` | Built-in AI wrapper availability |

### E2E Tests (Playwright) - 42 tests across 18 spec files
| Category | Spec Files |
|----------|------------|
| **Core Journeys** | `journey.spec.js`, `smoke.spec.js` |
| **Side Panel** | `sidepanel.spec.js`, `sidepanel_ai.spec.js`, `sidepanel_manage.spec.js`, `sidepanel_markdown.spec.js` |
| **Workspaces** | `workspaces.spec.js`, `workspace_lifecycle.spec.js` |
| **AI Features** | `ai_features.spec.js`, `ai_cancel_and_streaming.spec.js`, `gemini_nano.spec.js` |
| **Editor** | `markdown.spec.js`, `revisions.spec.js`, `font_and_layout.spec.js` |
| **Settings** | `user_journey_ai_and_settings.spec.js`, `system_links.spec.js` |
| **Regressions** | `regression_fixes.spec.js`, `repro_stale_preview.spec.js` |

## Commands

### Run All Tests
```bash
npm test && npm run test:e2e
```

### Run Unit Tests Only
```bash
npm test
```

### Run E2E Tests Only
```bash
npm run test:e2e
```

### Run Specific E2E Category
```bash
# Side panel tests
npx playwright test tests/e2e/sidepanel*.spec.js

# AI tests
npx playwright test tests/e2e/ai*.spec.js tests/e2e/gemini*.spec.js

# Workspace tests
npx playwright test tests/e2e/workspace*.spec.js
```

### Run with UI (debug mode)
```bash
npx playwright test --ui
```

### Run Linting
```bash
npm run lint
```

## Workflow

1. **Before making changes**: Run full suite to establish baseline
2. **After changes**: Run relevant category + full suite
3. **Before commit**: Run `npm test && npm run test:e2e && npm run lint`

## Expected Results

**Passing State (v2.1.1):**
- Unit: 23/23 passing
- E2E: 42/42 passing
- Lint: Clean

## Troubleshooting

### E2E tests failing to load extension
- Ensure extension is built (no build step needed for this project)
- Check `playwright.config.js` for correct extension path

### AI tests skipped
- AI tests may skip if Gemini Nano is not available
- This is expected behavior on machines without the model

### "Page closed" errors
- Usually indicates test cleanup issue
- Check for proper `await` on async operations
