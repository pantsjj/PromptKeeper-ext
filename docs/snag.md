# Snag: Gemini Nano Availability (API Missing)

> [!IMPORTANT]
> **Up-to-date Remediation Guide**
> For the latest troubleshooting steps regarding "window.ai is undefined" or "API Missing", please refer to:
> [`docs/snag-gemini-nano-remediation.md`](snag-gemini-nano-remediation.md)

The content below is preserved for historical context but may be outdated.

---

## Historical Root Cause Analysis (Legacy)

Earlier investigations concluded:

- The Chrome browser was not exposing the `window.ai` namespace to the extension context even on versions where the feature was nominally “available”.
- Primary suspected causes:
  1. **Chrome Flags Not Active:** Required experimental flags (`#prompt-api-for-gemini-nano`, `#optimization-guide-on-device-model`) disabled or not applied due to pending restart.
  2. **Hardware Incompatibility:** Device did not meet VRAM/RAM thresholds without `BypassPerfRequirement`.
  3. **Release Channel Restrictions:** Stable channel subject to staged roll‑outs / EPP gating.

These findings are now superseded by the more complete environment + context matrix in `snag-gemini-nano-remediation.md`.

