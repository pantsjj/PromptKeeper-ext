function log(id, msg, type = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = 'result ' + type;
}

async function checkGlobals() {
    let msg = "";
    let type = "success";

    if (window.ai) msg += "✅ window.ai is PRESENT\n";
    else { msg += "❌ window.ai is MISSING\n"; type = "error"; }

    // Check new namespace structure if applicable
    try {
        if (typeof ai !== 'undefined') msg += "✅ global 'ai' var is PRESENT\n";
    } catch (e) { msg += "⚠️ global 'ai' var is UNDEFINED\n"; }

    log('res-globals', msg, type);
}

async function checkCapabilities() {
    if (!window.ai || !window.ai.languageModel) {
        return log('res-caps', "Cannot check: API is missing.", "error");
    }

    try {
        log('res-caps', "Checking capabilities...", "warn");
        const caps = await window.ai.languageModel.capabilities();
        let status = caps.available;

        if (status === 'readily') log('res-caps', `✅ Available: ${status}`, "success");
        else log('res-caps', `⚠️ Not Ready: ${status} (Likely downloading)`, "warn");

    } catch (err) {
        log('res-caps', `❌ Error: ${err.message}`, "error");
    }
}

async function checkRewriter() {
    if (window.ai && window.ai.rewriter) {
        log('res-rewriter', "✅ Rewriter API found.", "success");
    } else {
        log('res-rewriter', "❌ Rewriter API missing (Check flags).", "error");
    }
}

async function runTest() {
    if (!window.ai || !window.ai.languageModel) return log('res-test', "API Missing.", "error");

    log('res-test', "Creating session...", "warn");
    try {
        const session = await window.ai.languageModel.create();
        log('res-test', "Session created. Generating...", "warn");

        const response = await session.prompt("Say hello!");
        log('res-test', `✅ Success! Output: "${response}"`, "success");

        session.destroy();
    } catch (err) {
        log('res-test', `❌ Generation Failed: ${err.message}`, "error");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-globals').addEventListener('click', checkGlobals);
    document.getElementById('btn-caps').addEventListener('click', checkCapabilities);
    document.getElementById('btn-rewriter').addEventListener('click', checkRewriter);
    document.getElementById('btn-test').addEventListener('click', runTest);

    // Auto-run globals check
    checkGlobals();
});
