/**
 * PKBuiltinAI - Built-in AI API wrapper (CSP-safe, shared across extension pages)
 *
 * Purpose:
 * - Centralize API-shape branching: `window.LanguageModel` vs `window.ai.languageModel`
 * - Centralize availability checks and session creation
 * - Provide a stable place to adopt streaming/cancel/progress patterns (web-ai-demos)
 *
 * Note: language options are already enforced by `language-model-shim.js`, but we still
 * pass defaults here for clarity and future API changes.
 */
(function initPKBuiltinAI() {
  const DEFAULT_LANG_OPTS = { expectedInputLanguages: ['en'], expectedOutputLanguages: ['en'] };
  const DEFAULT_CREATE_OPTS = { expectedContext: 'en', outputLanguage: 'en' };
  const DEFAULT_SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

  function hasLanguageModel() {
    return typeof window !== 'undefined' && !!window.LanguageModel;
  }

  function hasWindowAiLanguageModel() {
    return typeof window !== 'undefined' && !!(window.ai && window.ai.languageModel);
  }

  async function getAvailability(opts = {}) {
    const langOpts = { ...DEFAULT_LANG_OPTS, ...(opts.langOpts || {}) };

    // Newer API surface (Canary / spec)
    if (hasLanguageModel()) {
      if (typeof window.LanguageModel.availability === 'function') {
        try {
          // Some implementations return 'available'/'unavailable', others return 'readily'/'no'
          return await window.LanguageModel.availability(langOpts);
        } catch (e) {
          return 'no';
        }
      }
      if (typeof window.LanguageModel.capabilities === 'function') {
        try {
          const caps = await window.LanguageModel.capabilities(langOpts);
          return caps?.available || 'no';
        } catch (e) {
          return 'no';
        }
      }
      return 'available';
    }

    // Stable surface
    if (hasWindowAiLanguageModel()) {
      if (typeof window.ai.languageModel.capabilities === 'function') {
        try {
          const caps = await window.ai.languageModel.capabilities(langOpts);
          return caps?.available || 'no';
        } catch (e) {
          return 'no';
        }
      }
      return 'available';
    }

    return 'no';
  }

  /**
   * Create a language model session using the best available API surface.
   * Supports passing `signal` and `monitor` (downloadprogress) where the implementation supports it.
   */
  async function createSession(options = {}) {
    const createOpts = { ...DEFAULT_CREATE_OPTS, ...(options.createOpts || {}) };
    // Allow passing monitor/signal at top level for convenience
    if (options.signal) createOpts.signal = options.signal;
    if (options.monitor) createOpts.monitor = options.monitor;

    if (hasLanguageModel() && typeof window.LanguageModel.create === 'function') {
      const session = await window.LanguageModel.create(createOpts);
      return { session, source: 'LanguageModel' };
    }
    if (hasWindowAiLanguageModel() && typeof window.ai.languageModel.create === 'function') {
      const session = await window.ai.languageModel.create(createOpts);
      return { session, source: 'window.ai' };
    }
    throw new Error('Built-in AI API not available');
  }

  // Simple per-page session cache (Phase 1: in-memory). Safe to skip if callers prefer per-call sessions.
  let cached = null; // { session, source, createdAt }

  async function getCachedSession(options = {}) {
    const ttlMs = typeof options.ttlMs === 'number' ? options.ttlMs : DEFAULT_SESSION_TTL_MS;
    const now = Date.now();

    if (cached?.session && (now - cached.createdAt) < ttlMs) {
      return cached;
    }

    // Destroy stale session
    if (cached?.session) {
      try { cached.session.destroy?.(); } catch { /* ignore */ }
      cached = null;
    }

    const created = await createSession(options);
    cached = { ...created, createdAt: now };
    return cached;
  }

  async function withSession(fn, options = {}) {
    const { session } = await getCachedSession(options);
    return await fn(session);
  }

  function getTokenStats(session) {
    if (!session) return null;
    const inputUsage = typeof session.inputUsage === 'number' ? session.inputUsage : undefined;
    const inputQuota = typeof session.inputQuota === 'number' ? session.inputQuota : undefined;
    if (inputUsage === undefined && inputQuota === undefined) return null;
    return { inputUsage, inputQuota };
  }

  window.PKBuiltinAI = {
    DEFAULT_LANG_OPTS,
    DEFAULT_CREATE_OPTS,
    DEFAULT_SESSION_TTL_MS,
    hasLanguageModel,
    hasWindowAiLanguageModel,
    getAvailability,
    createSession,
    getCachedSession,
    withSession,
    getTokenStats
  };
})();


