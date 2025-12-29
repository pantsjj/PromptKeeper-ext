function log(id, msg, type = '') {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = msg; // Allows HTML links
    el.className = 'result ' + type;
}

function getChromeVersion() {
    const raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    return raw ? raw[2] : "Unknown";
}

async function checkGlobals() {
    let msg = "";

    // Browser Info
    msg += `<b>Browser:</b> Chrome ${getChromeVersion()}\n`;

    // 1. Local Context Check
    msg += `<b>Local Context:</b>\n`;

    // Check Namespace variants
    const hasWindowAI = !!window.ai;
    const hasLanguageModel = !!window.LanguageModel; // New Spec?
    const hasRewriter = !!window.Rewriter;           // Spec global?

    msg += `- window.ai: ${hasWindowAI ? "✅ Present" : "❌ Missing"}\n`;
    msg += `- window.LanguageModel: ${hasLanguageModel ? "✅ Present" : "❌ Missing"}\n`;
    msg += `- window.Rewriter: ${hasRewriter ? "✅ Present" : "❌ Missing"}\n`;

    // 2. Offscreen Context Check
    msg += `\n<b>Offscreen Context:</b> `;
    try {
        const response = await Promise.race([
            chrome.runtime.sendMessage({ action: 'checkAIAvailability' }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
        ]);

        if (response) {
            msg += `\n- Availability: ${response.available.toUpperCase()}`;
            if (response.polyfill) msg += ` (Polyfill/Alt)`;
        } else {
            msg += "❓ No response\n";
        }
    } catch (e) {
        msg += `❌ Connection Failed (${e.message})\n`;
    }

    // Determine overall status
    const isSuccess = (hasWindowAI || hasLanguageModel) && !msg.includes('Connection Failed');
    const statusType = isSuccess ? 'success' : 'warning';

    // Help Link
    if (!isSuccess) {
        msg += "\n👉 <a href='gemini-help.html' target='_blank'>Click here for Fix Instructions</a>";
    }

    log('res-globals', msg, statusType);
}

async function checkCapabilities() {
    log('res-caps', "Checking capabilities...", "warn");
    let msg = "";

    // 1. Prompt API
    let promptStatus = "Missing";
    try {
        if (window.ai && window.ai.languageModel) {
            const caps = await window.ai.languageModel.capabilities();
            promptStatus = `window.ai: ${caps.available}`;
        } else if (window.LanguageModel) {
            if (window.LanguageModel.capabilities) {
                const caps = await window.LanguageModel.capabilities();
                promptStatus = `LanguageModel.caps: ${caps.available}`;
            } else if (window.LanguageModel.availability) {
                // Spec style
                const avail = await window.LanguageModel.availability();
                promptStatus = `LanguageModel.avail: ${avail}`;
            } else {
                promptStatus = `LanguageModel (exists)`;
            }
        }
    } catch (e) { promptStatus = `Error: ${e.message}`; }

    msg += `Prompt API: ${promptStatus}\n`;

    // 2. Rewriter API
    let rewriterStatus = "Missing";
    if (window.ai && window.ai.rewriter) rewriterStatus = "window.ai.rewriter";
    if (window.Rewriter) rewriterStatus = "window.Rewriter";

    msg += `Rewriter API: ${rewriterStatus}`;

    const type = msg.toLowerCase().includes("readily") || msg.toLowerCase().includes("available") ? "success" : "warn";
    log('res-caps', msg, type);
}

async function checkRewriter() {
    log('res-rewriter', "Checking Rewriter...", "warn");

    if (!window.Rewriter && (!window.ai || !window.ai.rewriter)) {
        return log('res-rewriter', "❌ Rewriter API missing.", "error");
    }

    try {
        let rewriter;
        if (window.Rewriter) {
            rewriter = await window.Rewriter.create();
        } else {
            rewriter = await window.ai.rewriter.create();
        }

        const result = await rewriter.rewrite("This is a sloppy sentence.");
        log('res-rewriter', `✅ Success! Output: "${result}"`, "success");
        rewriter.destroy();
    } catch (e) {
        log('res-rewriter', `❌ Error: ${e.message}`, "error");
    }
}

async function runTest() {
    log('res-test', "Creating session...", "warn");
    try {
        let session;
        if (window.ai && window.ai.languageModel) {
            session = await window.ai.languageModel.create();
        } else if (window.LanguageModel) {
            session = await window.LanguageModel.create();
        }

        if (!session) return log('res-test', "API Missing - Cannot create session.", "error");

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
