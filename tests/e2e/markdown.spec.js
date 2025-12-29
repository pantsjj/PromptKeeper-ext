
import { test, expect } from './fixtures';

test.describe('Markdown Support', () => {

    test('New Prompt should default to Edit Mode (Side Panel)', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
        await page.locator('#new-prompt-button').click();

        const textArea = page.locator('#prompt-text');
        const previewDiv = page.locator('#markdown-preview');
        const toggleBtn = page.locator('#toggle-preview-btn');

        // Verify Default: Edit Mode
        await expect(textArea).toBeVisible();
        await expect(previewDiv).toBeHidden();

        // Verify Icon (Eye for Preview)
        await expect(toggleBtn).toContainText('👀');
    });

    test('Should toggle preview and render markdown (Side Panel)', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
        await page.locator('#new-prompt-button').click();

        const textArea = page.locator('#prompt-text');
        const previewDiv = page.locator('#markdown-preview');
        const toggleBtn = page.locator('#toggle-preview-btn');

        // 1. Enter Markdown
        await textArea.fill('# Title\n**Bold**');

        // 2. Toggle to Preview
        await toggleBtn.click();

        // Verify Preview Visible
        await expect(previewDiv).toBeVisible();
        await expect(textArea).toBeHidden();

        // Verify Content
        await expect(previewDiv.locator('h1')).toHaveText('Title');
        await expect(previewDiv.locator('strong')).toHaveText('Bold');

        // Verify Icon Switch (Code for Edit)
        await expect(toggleBtn).toContainText('👨‍💻');

        // 3. Toggle back to Edit
        await toggleBtn.click();
        await expect(textArea).toBeVisible();
    });

    test('Existing Prompt should default to Preview Mode (Options)', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        // 1. Create a prompt
        await page.locator('#new-prompt-btn').click();
        await page.locator('#prompt-title-input').fill('MD Prompt');
        await page.locator('#prompt-text-area').fill('# Existing\n*Italic*');
        await page.locator('#save-btn').click();

        // Wait for save
        await page.waitForTimeout(500);

        // 2. Reload to simulate fresh entry
        await page.reload();

        // 3. Select the prompt
        // Use text filter on nav-item
        await page.locator('.nav-item', { hasText: 'MD Prompt' }).click();

        const textArea = page.locator('#prompt-text-area');
        const previewDiv = page.locator('#markdown-preview');
        const toggleBtn = page.locator('#toggle-preview-btn');

        // Verify Default: Preview Mode
        await expect(previewDiv).toBeVisible();
        await expect(textArea).toBeHidden();
        await expect(previewDiv.locator('h1')).toHaveText('Existing');

        // Verify Icon
        await expect(toggleBtn).toContainText('👨‍💻');
    });
});
