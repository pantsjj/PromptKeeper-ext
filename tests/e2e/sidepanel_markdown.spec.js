
import { test, expect } from './fixtures';

test.describe('Side Panel Markdown Rendering', () => {
    test('Should render markdown correctly in Side Panel', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
        await page.locator('#new-prompt-button').click();

        // Input Markdown
        await page.fill('#prompt-text', '# Hello\n**World**');

        // Toggle Preview
        await page.locator('#toggle-preview-btn').click();

        // Verify Rendered Content
        const preview = page.locator('#markdown-preview');
        await expect(preview).toBeVisible();
        await expect(preview.locator('h1')).toHaveText('Hello');
        await expect(preview.locator('strong')).toHaveText('World');
    });
});
