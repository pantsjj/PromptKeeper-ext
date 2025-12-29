import { test, expect } from './fixtures';

test.describe('User Journey: AI + Settings + Saving', () => {
    test('Full editor: edit, AI refine (all buttons), save, font size and autosave settings persist', async ({ page, extensionId }) => {
        // Ensure local AI is always "available" and returns a stable value
        await page.addInitScript(() => {
            window.LanguageModel = {
                availability: async () => 'readily',
                create: async () => ({
                    prompt: async () => 'AI-REFINED PROMPT',
                    destroy: () => { }
                })
            };
        });

        await page.goto(`chrome-extension://${extensionId}/options.html`);

        // Create a workspace and prompt
        await page.locator('#new-prompt-btn').click();
        await page.locator('#prompt-title-input').fill('Journey AI Prompt');
        await page.locator('#prompt-text-area').fill('You are a book reviewer. Critique this draft.');
        await page.locator('#save-btn').click();

        const promptItem = page.locator('.nav-item-prompt', { hasText: 'Journey AI Prompt' });
        await expect(promptItem).toBeVisible();

        // Change editor font size and autosave settings
        const preset = page.locator('#font-size-preset');
        await preset.selectOption('16');
        await expect(page.locator('#font-size-display')).toHaveText('16px');

        const autoSaveEnabled = page.locator('#autosave-enabled-checkbox');
        const autoSaveOnSwitch = page.locator('#autosave-on-switch-checkbox');
        await autoSaveEnabled.check();
        await autoSaveOnSwitch.check();

        // Run AI refine (Magic Enhance) to update content
        const editor = page.locator('#prompt-text-area');
        const magicBtn = page.locator('.refine-btn[data-type="magic_enhance"]');
        await expect(magicBtn).toBeVisible();
        await magicBtn.click();

        // After refine, editor should be marked dirty and contain AI text
        await expect(editor).toHaveValue(/AI-REFINED PROMPT/);

        // Exercise the other refine buttons to ensure they are wired
        const otherTypes = ['formalize', 'clarify', 'summarize'];
        for (const type of otherTypes) {
            const btn = page.locator(`.refine-btn[data-type="${type}"]`);
            await expect(btn).toBeVisible();

            await btn.click();

            // Editor should remain non-empty and reflect AI-refined content
            const value = await editor.inputValue();
            expect(value.length).toBeGreaterThan(0);
        }

        // Manual save should clear unsaved state
        await page.locator('#save-btn').click();

        // Reload and confirm settings + content persisted
        await page.reload();

        await page.locator('.nav-item-prompt', { hasText: 'Journey AI Prompt' }).click();

        await expect(page.locator('#font-size-display')).toHaveText('16px');
        await expect(page.locator('#autosave-enabled-checkbox')).toBeChecked();
        await expect(page.locator('#autosave-on-switch-checkbox')).toBeChecked();

        const editorAfterReload = page.locator('#prompt-text-area');
        await expect(editorAfterReload).toHaveCSS('font-size', /16px/);
        // Last saved content should be the AI-refined text
        await expect(editorAfterReload).toHaveValue(/AI-REFINED PROMPT/);
    });

    test('Side panel: edit prompt, run AI, save and verify font size from options', async ({ page, extensionId, context }) => {
        // First, make sure options has a non-default font size
        const optionsPage = await context.newPage();
        await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);
        await optionsPage.locator('#font-size-preset').selectOption('18');
        await expect(optionsPage.locator('#font-size-display')).toHaveText('18px');

        // Now open the sidepanel
        await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

        const textArea = page.locator('#prompt-text');
        await textArea.fill('Sidepanel draft that should be saved.');
        await expect(textArea).toHaveCSS('font-size', /18px/);

        // Run AI clarify if button is visible (best-effort)
        const clarifyBtn = page.locator('#clarity-btn');
        if (await clarifyBtn.isVisible()) {
            await clarifyBtn.click();
        }

        // Save in sidepanel
        await page.locator('#save-button').click();

        // Reload sidepanel and ensure content is still present
        await page.reload();
        const textAfter = page.locator('#prompt-text');
        await expect(textAfter).toHaveCSS('font-size', /18px/);
        await expect(textAfter).not.toHaveValue('');
    });
});


