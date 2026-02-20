# Chrome Extension Packaging Skill

**Trigger**: `/package` or before Chrome Web Store submission

## Purpose
Validate and package PromptKeeper for Chrome Web Store publication.

## Pre-Packaging Checklist

### 1. Version Check
```bash
# Check manifest version matches package.json
grep '"version"' manifest.json package.json
```
Both should show: `"version": "2.2.1"` (or current version)

### 2. Required Files Verification
```bash
# Core files that MUST exist
ls -la manifest.json background.js popup.js options.js sidepanel.html options.html
ls -la services/StorageService.js services/AIService.js services/GoogleDriveService.js
ls -la images/icon16.png images/icon48.png images/icon128.png
```

### 3. Manifest Validation

**Required fields in `manifest.json`:**
```json
{
  "manifest_version": 3,
  "name": "PromptKeeper",
  "version": "X.X.X",
  "permissions": ["storage", "sidePanel", "activeTab", "offscreen", "identity", "alarms"],
  "oauth2": { "client_id": "...", "scopes": ["..."] },
  "icons": { "16": "...", "48": "...", "128": "..." }
}
```

### 4. OAuth Client ID Check
```bash
# Ensure production OAuth client ID (not dev)
grep "client_id" manifest.json
```
Should NOT contain `localhost` or dev identifiers.

### 5. Run Full Test Suite
```bash
npm test && npm run test:e2e && npm run lint
```
All must pass before packaging.

## Packaging Steps

### Create Distribution ZIP
```bash
# Create clean package directory
rm -rf dist/
mkdir -p dist/

# Copy required files (exclude dev files)
cp manifest.json background.js popup.js options.js dist/
cp sidepanel.html options.html popup.html dist/
cp offscreen.html offscreen.js dist/
cp contentScript.js injectedScript.js dist/
cp builtin-ai.js language-model-shim.js rewrite.js dist/
cp gemini-diagnostic.html gemini-help.html dist/
cp -r services/ dist/
cp -r images/ dist/
cp -r node_modules/marked/ dist/node_modules/marked/

# Create ZIP
cd dist && zip -r ../promptkeeper-v2.1.1.zip . && cd ..
```

### Files to EXCLUDE from package
- `tests/` - Test files
- `docs/` - Documentation
- `coverage/` - Coverage reports
- `.git/` - Git directory
- `.claude/` - Claude skills
- `node_modules/` (except `marked`)
- `*.md` files (except those needed)
- `package.json`, `package-lock.json`
- `playwright.config.js`, `jest.config.js`
- `eslint.config.mjs`, `babel.config.cjs`

## Chrome Web Store Submission

### Required Assets (in `ChromeStore/` folder)
- Screenshot 1: Side Panel view (1280x800)
- Screenshot 2: Full IDE view (1280x800)
- Screenshot 3: AI features (1280x800)
- Promo tile: 440x280
- Icon: 128x128 (already in images/)

### Store Listing Fields
- **Title**: PromptKeeper - AI Prompt Manager
- **Summary**: Local-first prompt engineering with on-device AI
- **Category**: Productivity
- **Language**: English

## Post-Submission Verification

1. Install from Web Store on clean Chrome profile
2. Test core journey: Create workspace → Create prompt → AI enhance → Save
3. Test Google Drive backup/restore
4. Verify Side Panel opens correctly
5. Check AI features (if Gemini Nano available)

## Rollback Plan

If issues discovered post-publish:
1. Increment version in `manifest.json` and `package.json`
2. Fix issue
3. Run full test suite
4. Re-package and re-submit
