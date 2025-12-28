# ADR 001: Hidden Tab for Gemini Nano AI Access

**Date**: 2025-12-06  
**Status**: Accepted  
**Deciders**: Development Team  

## Context

PromptKeeper Chrome extension needs to access Chrome's built-in Gemini Nano AI (`window.ai` API) to provide AI-powered prompt refinement features. However, Chrome's security model restricts where this API is available.

### Problem

The `window.ai` API is **not available** in Chrome extension contexts:
- ❌ Extension popup pages
- ❌ Extension options pages
- ❌ Background service workers
- ❌ **Offscreen documents** (discovered through implementation and web research)

This is by design - Chrome limits offscreen documents to only `chrome.runtime` API access for security and performance reasons.

### Requirements

1. Access `window.ai` API for AI operations
2. Maintain privacy-first approach (local AI processing)
3. Work reliably across extension lifecycle
4. Minimize user disruption
5. Support message passing between extension pages and AI context

## Decision

Implement a **hidden tab approach** where:
1. Create a pinned, inactive tab (`ai-bridge.html`) on extension startup
2. This tab runs in a **web page context** where `window.ai` IS available
3. Use `chrome.tabs.sendMessage()` for communication between extension pages and the AI bridge tab
4. Background service worker manages tab lifecycle (creation, recreation if closed)

## Alternatives Considered

### 1. Offscreen Document (Attempted First)

**Approach**: Use Chrome's Offscreen Document API to create a hidden page.

**Pros**:
- Designed for background tasks
- No visible UI impact
- Lower resource usage

**Cons**:
- ❌ **`window.ai` not available** - Offscreen documents only have `chrome.runtime` API access
- Confirmed by Chrome documentation and web research
- Implementation failed with "API_MISSING (window.ai is undefined)"

**Verdict**: Not viable

### 2. Content Script Injection

**Approach**: Inject script into user's active tab to access `window.ai`.

**Pros**:
- No extra tab created
- `window.ai` available in page context

**Cons**:
- Requires user to have a tab open
- Complex lifecycle management
- Permission concerns (injecting into arbitrary pages)
- Unreliable (tab could close at any time)

**Verdict**: Too fragile

### 3. Service Worker with Polyfill

**Approach**: Try to polyfill or proxy `window.ai` in service worker.

**Cons**:
- Not technically possible - API simply doesn't exist in that context
- Would require server-side AI (defeats privacy goal)

**Verdict**: Not feasible

## Implementation Details

### Architecture

```
Extension Pages (popup.js, options.js)
  ↓ chrome.runtime.sendMessage('getAIBridgeTabId')
Background Service Worker (background.js)
  ↓ returns tabId
Extension Pages
  ↓ chrome.tabs.sendMessage(tabId, {action: 'refinePrompt', ...})
AI Bridge Tab (ai-bridge.html + ai-bridge.js)
  ↓ window.ai.languageModel.create() ✅ Available!
  ↓ AI operations
  ↓ sendResponse({success: true, result: ...})
Extension Pages receive result
```

### Files Created

1. **`ai-bridge.html`** - Minimal HTML page loaded in hidden tab
2. **`ai-bridge.js`** - Message listener and AI operations handler
   - Handles: `checkAIAvailability`, `getDiagnostic`, `getDetailedStatus`, `refinePrompt`
   - Accesses `window.ai` directly (available in tab context)

### Files Modified

1. **`background.js`** - Tab lifecycle management
   - Creates pinned, inactive tab on startup
   - Stores `aiBridgeTabId`
   - Recreates tab if closed
   - Provides tab ID to extension pages

2. **`services/AIService.js`** - Communication layer
   - Changed from `_sendToOffscreen()` to `_sendToAIBridge()`
   - Gets tab ID from background
   - Uses `chrome.tabs.sendMessage()` instead of `chrome.runtime.sendMessage()`

3. **`manifest.json`** - Permissions
   - Removed: `"offscreen"` permission
   - Added: `"tabs"` permission

## Consequences

### Positive

✅ **Actually works** - `window.ai` is available in tab context  
✅ **Reliable** - Tab persists across extension lifecycle  
✅ **Privacy preserved** - All AI processing remains local  
✅ **Clean separation** - AI logic isolated in bridge tab  
✅ **Testable** - Can inspect AI bridge tab for debugging  

### Negative

⚠️ **Visible tab** - Creates a pinned tab in user's browser  
⚠️ **Resource usage** - Tab consumes ~10-20MB memory (acceptable)  
⚠️ **User confusion** - Users might wonder what the tab is for  

### Mitigations

- Tab is **pinned** (smaller, less prominent)
- Tab is **inactive** (not focused)
- Tab title is clear: "AI Bridge"
- Could add user-facing documentation explaining the tab
- Future: Explore if Chrome adds `window.ai` to service workers or offscreen documents

## Validation

### Testing Performed

1. **Unit Tests**: All 12 tests passing (AIService + StorageService)
2. **Manual Testing**:
   - Extension reload creates AI bridge tab
   - Tab persists across browser sessions
   - AI operations complete successfully
   - Tab recreation works if manually closed

### Success Criteria

- [x] `window.ai` accessible in AI bridge context
- [x] Message passing works reliably
- [x] AI refinement features functional
- [x] No console errors
- [x] Graceful degradation if tab creation fails

## References

- [Chrome Offscreen Document API](https://developer.chrome.com/docs/extensions/reference/offscreen/)
- [Chrome Prompt API Documentation](https://developer.chrome.com/docs/ai/built-in)
- Web search: "Chrome extension offscreen document window.ai undefined"
  - Confirmed: Offscreen documents only have `chrome.runtime` API access
  - Tabs have full web page API access including `window.ai`

## Future Considerations

1. **Monitor Chrome API Evolution**:
   - If Chrome adds `window.ai` to service workers → migrate
   - If Chrome adds `window.ai` to offscreen documents → migrate

2. **User Experience**:
   - Add tooltip/documentation about AI bridge tab
   - Consider "hide tab" option if Chrome adds API support

3. **Alternative Approaches**:
   - If hidden tab becomes problematic, fallback to content script injection
   - If privacy requirements change, could use cloud AI APIs

## Lessons Learned

1. **Don't assume API availability** - Always verify in target context
2. **Web search is valuable** - Saved hours of debugging
3. **Offscreen documents are limited** - Not a replacement for web pages
4. **Tabs are more capable** - Full web API access including experimental features

## Decision Outcome

**Accepted**: Hidden tab approach is the only viable solution given Chrome's current API limitations. The minor UX trade-off (visible pinned tab) is acceptable for the functionality gained.

---

**Signed off by**: Development Team  
**Review Date**: 2025-12-06  
**Next Review**: When Chrome API landscape changes
