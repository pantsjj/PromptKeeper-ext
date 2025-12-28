# ADR 003: Prompt Detail View & History Behaviour

**Date**: 2025-12-29  
**Status**: Accepted  

## Context

PromptKeeper stores a full history of edits for each prompt.  
Both the side panel (`sidepanel.html` / `popup.js`) and the full‑page editor (`options.html` / `options.js`) expose this history via a **revision dropdown**.

We need a clear, shared contract for:

- How many revisions are surfaced in the UI.
- How the versions are ordered and labelled.
- How future diff/compare features should interact with the history model.

## Decision

1. **Unlimited history in storage**
   - `StorageService.updatePrompt()` keeps **all historical versions** in the `versions[]` array.
   - No pruning is done at the data layer (future archival is a separate concern).

2. **UI shows the most recent 50 revisions**
   - Both sidepanel and options **dropdowns**:
     - Sort `versions` by `timestamp` descending.
     - Take the **most recent 50** entries for the dropdown.
   - Older revisions remain accessible via tooling / future advanced views, but are not shown in the default selector.

3. **Version labelling**
   - Version labels are rendered as:
     - `vN: <locale date> (Curr)` where:
       - `N` counts from `1..versions.length` (full history), even if only the most recent 50 are displayed.
       - `(Curr)` is added for the version whose `id` matches `currentVersionId`.

4. **Refresh semantics**
   - After each **Save** operation:
     - The prompt is reloaded from `StorageService`.
     - The **same prompt** is re‑selected in both sidepanel and options.
     - The revision dropdown is immediately repopulated from the latest state so the new revision is visible without navigating away.

## Consequences

### Positive

- Stable, predictable revision UX across both UIs.
- History remains complete in storage, but the UI stays performant and readable.
- The contract around “50 most recent revisions” is explicit and testable.

### Negative / Trade‑offs

- Users with extremely long histories will not see the **oldest** revisions in the dropdown (they are still stored, just hidden).
- More advanced history browsing (filters, jump‑to‑version, etc.) would require new UI surfaces.

## Future Work: Diff / Compare View (Technical Debt)

A natural extension of this ADR is a **GitHub‑style diff view** between revisions:

- When a user selects an older revision in the dropdown, they could click **“Show Diffs”** to:
  - Compare the **current head version** vs. the selected version.
  - Render a side‑by‑side or inline diff with:
    - Additions highlighted in green.
    - Deletions highlighted in red.
    - Optional word/line granularity toggle.

This feature is **not part of v2.0.0**, but is recorded here to guide future implementation and to ensure the history model can support it cleanly.

## Related Documents

- `services/StorageService.js` – prompt + version data model.
- `popup.js` – sidepanel prompt selection and revision dropdown.
- `options.js` – full‑page editor prompt selection and history dropdown.
- `docs/test-strategy.md` – tests around prompt lifecycle and history.


