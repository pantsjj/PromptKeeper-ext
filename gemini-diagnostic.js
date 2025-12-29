function log(id, msg, type = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = msg; // Allows HTML links
    el.className = 'result ' + type;
}

async function checkGlobals() {
    let msg = "";

    // 1. Local Check (Diagnostic Page Context)
    const localHasAI = !!window.ai;
    msg += `<b>Local Context:</b> ${localHasAI ? "✅ Present" : "❌ Missing"}\n`;

    // 2. Remote Check (Offscreen Context)
    msg += `<b>Offscreen Context:</b> `;
    try {
        // We use runtime.sendMessage directly to bypass AIService if needed, 
        // to test the raw connection to offscreen.
        // We use runtime.sendMessage directly to bypass AIService if needed.
        // Race with a timeout so we don't wait forever.
        const response = await Promise.race([
            chrome.runtime.sendMessage({ action: 'checkAIAvailability' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
        ]);

        if (response && response.available) {
            const status = response.available;
            if (status === 'no') msg += "❌ API says 'no' (flags/model missing)\n";
            else msg += `✅ ${status.toUpperCase()}\n`;
        } else {
            msg += "❓ No response / Unknown\n";
        }
    } catch (e) {
        msg += `❌ Connection Failed (${e.message})\n`;
    }

    if (!localHasAI) {
        msg += "\n👉 <a href='gemini-help.html' target='_blank'>Click here for Fix Instructions</a>";
    }

    // Check new namespace structure if applicable
    try {
        if (typeof ai !== 'undefined') msg += "✅ global 'ai' var is PRESENT\n";
    } catch { msg += "⚠️ global 'ai' var is UNDEFINED\n"; }

    // Determine overall status type
    const isSuccess = localHasAI || msg.includes('✅ READILY');
    const statusType = isSuccess ? 'success' : 'warning';

    log('res-globals', msg, statusType);
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
