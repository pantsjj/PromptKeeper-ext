/**
 * Early LanguageModel API shim
 * Ensures outputLanguage/expectedOutputLanguages are always passed to prevent
 * Chrome's "No output language was specified" warning.
 * 
 * This file should be loaded FIRST in all HTML pages that use the LanguageModel API.
 */
(function applyLanguageModelShims() {
    // capabilities/availability should take NO args, or only what the caller provides
    // UPDATE: Now providing default language to prevent "No output language" warnings
    const defaultLangOpts = { outputLanguage: 'en', expectedOutputLanguage: 'en' };
    // create() usually requires language specifiers
    const createOpts = { expectedContext: 'en', outputLanguage: 'en', expectedOutputLanguage: 'en' };

    try {
        // Wrap window.LanguageModel
        if (window.LanguageModel && !window.LanguageModel.__pkShimmed) {

            if (typeof window.LanguageModel.availability === 'function') {
                const orig = window.LanguageModel.availability.bind(window.LanguageModel);
                window.LanguageModel.availability = (opts = {}) => {
                    return orig({ ...defaultLangOpts, ...opts });
                };
            }
            if (typeof window.LanguageModel.capabilities === 'function') {
                const orig = window.LanguageModel.capabilities.bind(window.LanguageModel);
                window.LanguageModel.capabilities = (opts = {}) => {
                    return orig({ ...defaultLangOpts, ...opts });
                };
            }
            if (typeof window.LanguageModel.create === 'function') {
                const orig = window.LanguageModel.create.bind(window.LanguageModel);
                window.LanguageModel.create = (opts = {}) => {
                    return orig({ ...createOpts, ...opts });
                };
            }
            window.LanguageModel.__pkShimmed = true;
            window.LanguageModel.__pkWrapped = true;
        }

        // Wrap window.ai.languageModel
        if (window.ai && window.ai.languageModel && !window.ai.languageModel.__pkShimmed) {
            if (typeof window.ai.languageModel.capabilities === 'function') {
                const orig = window.ai.languageModel.capabilities.bind(window.ai.languageModel);
                window.ai.languageModel.capabilities = (opts = {}) => orig({ ...defaultLangOpts, ...opts });
            }
            if (typeof window.ai.languageModel.create === 'function') {
                const orig = window.ai.languageModel.create.bind(window.ai.languageModel);
                window.ai.languageModel.create = (opts = {}) => orig({ ...createOpts, ...opts });
            }
            window.ai.languageModel.__pkShimmed = true;
            // Back-compat with older shim flag used in code
            window.ai.languageModel.__pkWrapped = true;
        }
    } catch (e) {
        console.warn('[PromptKeeper] LanguageModel shim failed:', e);
    }
})();
