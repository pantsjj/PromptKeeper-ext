# Test Coverage Audit Skill

**Trigger**: `/coverage` or when assessing test health

## Purpose
Audit PromptKeeper's test coverage and identify gaps.

## Current Coverage Status (v2.1.1)

### Unit Tests (Jest)
| Service | Tests | Status |
|---------|-------|--------|
| `AIService.js` | 8 tests | Streaming, retries, cancellation, error handling |
| `StorageService.js` | 10 tests | CRUD, versioning, migration, import/export |
| `GoogleDriveService.js` | 3 tests | OAuth, backup, restore |
| `PKBuiltinAI.js` | 2 tests | API availability checks |
| **Total** | **23 tests** | **All passing** |

### E2E Tests (Playwright)
| Category | Spec Files | Test Count |
|----------|------------|------------|
| Core Journeys | 2 | ~6 |
| Side Panel | 4 | ~10 |
| Workspaces | 2 | ~6 |
| AI Features | 3 | ~8 |
| Editor/Markdown | 3 | ~6 |
| Settings/System | 2 | ~3 |
| Regressions | 2 | ~3 |
| **Total** | **18 files** | **42 tests** |

## Run Coverage Report

### Jest Coverage
```bash
npm test -- --coverage
```

Output in `coverage/` folder:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/coverage-final.json` - JSON data

### View Coverage
```bash
open coverage/lcov-report/index.html
```

## Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| Line Coverage | 80% | ~75% |
| Branch Coverage | 70% | ~65% |
| Function Coverage | 80% | ~80% |
| Statement Coverage | 80% | ~75% |

## Coverage Gaps Analysis

### Well-Covered Areas
- `services/StorageService.js` - Core CRUD, versioning
- `services/AIService.js` - Main AI operations
- Side Panel UI interactions
- Workspace lifecycle

### Under-Covered Areas
| File/Area | Gap | Priority |
|-----------|-----|----------|
| `popup.js` | UI rendering logic | Medium |
| `options.js` | IDE-specific interactions | Medium |
| `background.js` | Service worker lifecycle | Low |
| `contentScript.js` | Paste-to-page injection | Low |
| Error edge cases | Network failures, storage quota | Medium |

### Not Covered (Intentional)
| Area | Reason |
|------|--------|
| Google OAuth flow | Requires real credentials, manual test |
| Gemini Nano model load | Hardware/flag dependent |
| Chrome Web Store install | Production environment only |

## Recommended Coverage Improvements

### Priority 1: Add Tests For
1. **Prompt sorting** (when implemented)
2. **Bulk delete operations**
3. **Export/Import edge cases**

### Priority 2: Increase Branch Coverage
1. Error handling paths in `StorageService`
2. AI fallback scenarios in `AIService`
3. Edge cases in version history

### Priority 3: Visual Regression
Consider adding:
```bash
npx playwright test --update-snapshots
```
For key UI states (Side Panel, IDE, Markdown preview)

## Test Organization Audit

### Current Structure
```
tests/
├── AIService.test.js        # Unit
├── StorageService.test.js   # Unit
├── GoogleDriveService.test.js # Unit
├── PKBuiltinAI.test.js      # Unit
└── e2e/                     # E2E (Playwright)
    ├── smoke.spec.js
    ├── journey.spec.js
    ├── sidepanel*.spec.js
    ├── workspace*.spec.js
    ├── ai*.spec.js
    ├── markdown.spec.js
    └── ...
```

### Health Score: 85/100

**Strengths:**
- Clear separation of unit vs E2E
- Good naming conventions
- Regression tests for known bugs

**Improvements Needed:**
- Consider `tests/unit/` subfolder for Jest tests
- Add test for each new feature before merging
- Document manual test procedures for OAuth/AI

## Makefile Targets (Recommended)

Add to workflow:
```bash
# Quick validation
npm test && npm run test:e2e

# Full coverage audit
npm test -- --coverage && open coverage/lcov-report/index.html

# Lint check
npm run lint
```

## Pre-Release Checklist

Before any release:
- [ ] All unit tests passing (23/23)
- [ ] All E2E tests passing (42/42)
- [ ] ESLint clean
- [ ] Coverage not decreased
- [ ] Manual OAuth test completed
- [ ] Manual AI test completed (if available)
