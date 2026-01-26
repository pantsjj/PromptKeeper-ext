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

async function checkFeatureSupport() {
    log('res-caps', "Checking feature support...", "warn");
    let msg = "";

    // Language options to prevent Chrome's "No output language was specified" warning
    const langOpts = { expectedInputLanguages: ['en'], expectedOutputLanguages: ['en'] };

    // 1. Prompt API
    let promptStatus = "Missing";
    try {
        if (window.ai && window.ai.languageModel) {
            const caps = await window.ai.languageModel.capabilities(langOpts);
            promptStatus = `window.ai: ${caps.available}`;
        } else if (window.LanguageModel) {
            if (window.LanguageModel.capabilities) {
                const caps = await window.LanguageModel.capabilities(langOpts);
                promptStatus = `LanguageModel.caps: ${caps.available}`;
            } else if (window.LanguageModel.availability) {
                const avail = await window.LanguageModel.availability(langOpts);
                promptStatus = `LanguageModel.avail: ${avail}`;
            } else {
                promptStatus = `LanguageModel (exists)`;
            }
        }
    } catch (e) { promptStatus = `Error: ${e.message}`; }
    msg += `<b>Prompt API:</b> ${promptStatus}\n`;

    // 2. Rewriter API
    let rewriterStatus = "Missing";
    if (window.ai && window.ai.rewriter) rewriterStatus = "window.ai.rewriter";
    if (window.Rewriter) rewriterStatus = "window.Rewriter";
    msg += `<b>Rewriter API:</b> ${rewriterStatus}\n`;

    // 3. Summarizer API
    let summarizerStatus = "Missing";
    if (window.ai && window.ai.summarizer) summarizerStatus = "window.ai.summarizer";
    if (window.Summarizer) summarizerStatus = "window.Summarizer";
    msg += `<b>Summarizer API:</b> ${summarizerStatus}`;

    const type = msg.toLowerCase().includes("readily") || msg.toLowerCase().includes("available") ? "success" : "warn";
    log('res-caps', msg, type);
}

async function runPromptTest() {
    log('res-test-prompt', "Creating session...", "warn");
    try {
        let session;
        if (window.ai && window.ai.languageModel) {
            session = await window.ai.languageModel.create({
                expectedContext: 'en',
                outputLanguage: 'en',
                expectedOutputLanguage: 'en'
            });
        } else if (window.LanguageModel) {
            session = await window.LanguageModel.create({
                expectedContext: 'en',
                outputLanguage: 'en',
                expectedOutputLanguage: 'en'
            });
        }

        if (!session) return log('res-test-prompt', "API Missing - Cannot create session.", "error");

        log('res-test-prompt', "Session created. Generating...", "warn");
        const response = await session.prompt("Say hello!");
        log('res-test-prompt', `✅ Success! Output: "${response}"`, "success");
        session.destroy();
    } catch (err) {
        log('res-test-prompt', `❌ Generation Failed: ${err.message}`, "error");
    }
}

async function runRewriterTest() {
    log('res-test-rewriter', "Checking Rewriter...", "warn");

    if (!window.Rewriter && (!window.ai || !window.ai.rewriter)) {
        return log('res-test-rewriter', "❌ Rewriter API missing.", "error");
    }

    try {
        let rewriter;
        if (window.Rewriter) {
            // Create with minimal options if needed, or default
            rewriter = await window.Rewriter.create();
        } else {
            rewriter = await window.ai.rewriter.create();
        }

        const result = await rewriter.rewrite("This is a sloppy sentence.");
        log('res-test-rewriter', `✅ Success! Output: "${result}"`, "success");
        rewriter.destroy();
    } catch (e) {
        log('res-test-rewriter', `❌ Error: ${e.message}`, "error");
    }
}

async function runSummarizerTest() {
    log('res-test-summarizer', "Checking Summarizer...", "warn");

    if (!window.Summarizer && (!window.ai || !window.ai.summarizer)) {
        return log('res-test-summarizer', "❌ Summarizer API missing.", "error");
    }

    try {
        let summarizer;
        if (window.Summarizer) {
            summarizer = await window.Summarizer.create();
        } else {
            summarizer = await window.ai.summarizer.create();
        }

        const input = "Gemini is a family of multimodal AI models developed by Google. It is designed to be efficient and runs on-device.";
        const result = await summarizer.summarize(input);
        log('res-test-summarizer', `✅ Success! Output: "${result}"`, "success");
        summarizer.destroy();
    } catch (e) {
        log('res-test-summarizer', `❌ Error: ${e.message}`, "error");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-globals').addEventListener('click', checkGlobals);
    document.getElementById('btn-caps').addEventListener('click', checkFeatureSupport);

    document.getElementById('btn-test-prompt').addEventListener('click', runPromptTest);
    document.getElementById('btn-test-rewriter').addEventListener('click', runRewriterTest);
    document.getElementById('btn-test-summarizer').addEventListener('click', runSummarizerTest);

    // Auto-run globals check
    checkGlobals();
});
