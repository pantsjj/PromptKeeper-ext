---
description: Validate Chrome's built-in AI (Gemini Nano) availability and PromptKeeper's AI features.
---
# AI Feature Validation

Use this workflow when testing Gemini Nano features or troubleshooting AI integration in PromptKeeper.

## Chrome AI APIs Used by PromptKeeper

| API | Feature | File |
|-----|---------|------|
| **Prompt API** | Magic Enhance, custom prompts | `services/AIService.js` |
| **Rewriter API** | Formalize, Improve Clarity | `services/AIService.js`, `offscreen.js` |
| **Summarizer API** | Shorten | `services/AIService.js` |

## Pre-Requisites for AI Features

### 1. Chrome Version
Gemini Nano requires Chrome 127+ (Dev/Canary recommended for latest APIs)

### 2. Chrome Flags (User Must Enable)
```
chrome://flags/#prompt-api-for-gemini-nano → Enabled
chrome://flags/#optimization-guide-on-device-model → Enabled BypassPerfRequirement
chrome://flags/#text-safety-classifier → Disabled (optional, for testing)
```

### 3. Model Download
- Model is ~2GB, downloaded on first use
- Check: `chrome://components/` → "Optimization Guide On Device Model"
- Status should show version number (not "0.0.0.0")

## Validation Commands

### Check AI Availability (in browser console)
```javascript
// Prompt API
console.log('Prompt API:', typeof window.LanguageModel !== 'undefined');

// Check capabilities
if (window.LanguageModel) {
  const caps = await window.LanguageModel.availability();
  console.log('Availability:', caps); // 'available', 'downloadable', 'unavailable'
}

// Rewriter API
console.log('Rewriter API:', typeof window.Rewriter !== 'undefined');

// Summarizer API
console.log('Summarizer API:', typeof window.Summarizer !== 'undefined');
```

## Running AI-Specific Tests
```bash
# All AI tests
npx playwright test tests/e2e/ai*.spec.js tests/e2e/gemini*.spec.js tests/e2e/sidepanel_ai.spec.js

# Streaming and cancel tests
npx playwright test tests/e2e/ai_cancel_and_streaming.spec.js
```

## Diagnostic Tools

1. **Built-in Diagnostic Page**: Open `gemini-diagnostic.html` in the browser to view API availability, test model access, and check Chrome compatibility.
2. **Help Page**: Open `gemini-help.html` for user-facing setup instructions and troubleshooting steps.

## Common Troubleshooting

### "AI features unavailable"
1. Check Chrome version (127+)
2. Verify flags are enabled
3. Check model download status in `chrome://components/`
4. Restart Chrome after enabling flags

### "Model not ready"
- Model still downloading. Wait and retry (can take several minutes on first use).

### "No output language" warning
- Fixed in v2.1.1 via `language-model-shim.js` which enforces language properties.

### AI works in diagnostic but not in extension
- Check `offscreen.js` is loading correctly.
- Verify message passing between extension pages and the offscreen document.
- Check the browser console background worker logs for errors.
