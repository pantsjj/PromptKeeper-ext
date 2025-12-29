import { test, expect } from './fixtures';

test.describe('Side Panel AI Features', () => {
    test('Magic Optimize and Improve Clarity use local AI and mark content as unsaved', async ({ page, extensionId }) => {
        const extensionUrl = `chrome-extension://${extensionId}/sidepanel.html`;

        // Mock local LanguageModel so AIService detects availability and returns a deterministic value
        await page.addInitScript(() => {
            window.LanguageModel = {
                availability: async () => 'readily',
                create: async () => ({
                    // Streaming mock (new behavior)
                    promptStreaming: async function* (_input, opts) {
                        const signal = opts?.signal;
                        const chunks = ['AI-', 'REFINED ', 'PROMPT'];
                        for (const c of chunks) {
                            if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
                            // small delay to simulate streaming
                            await new Promise(r => setTimeout(r, 25));
                            yield c;
                        }
                    },
                    prompt: async () => 'AI-REFINED PROMPT',
                    destroy: () => { }
                })
            };
        });

        await page.goto(extensionUrl);
        await page.waitForLoadState('domcontentloaded');

        const textArea = page.locator('#prompt-text');
        await expect(textArea).toBeVisible();
        await textArea.fill('Original prompt text');

        // Wait for AI row to become visible once availability resolves
        const aiRow = page.locator('#ai-buttons-row');
        await aiRow.waitFor({ state: 'visible', timeout: 10000 });

        const magicBtn = page.locator('#magic-btn');
        const clarityBtn = page.locator('#clarity-btn');
        await expect(magicBtn).toBeVisible();
        await expect(clarityBtn).toBeVisible();

        // Click Magic Optimize and wait for refinement to land
        await magicBtn.click();
        await expect(textArea).toHaveValue(/AI-REFINED PROMPT/);
        await expect(textArea).toHaveClass(/unsaved-glow/);

        // Then click Improve Clarity and ensure the flow still works without errors
        await clarityBtn.click();

        // Content should still be non-empty and considered unsaved
        const after = await textArea.inputValue();
        await expect(after.length).toBeGreaterThan(0);
        await expect(textArea).toHaveClass(/unsaved-glow/);
    });
});


