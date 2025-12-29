
import { test, expect } from './fixtures'; // Use custom fixture if available, or default

test.describe('Markdown Preview Switching', () => {
    test('Should update preview when switching between prompts', async ({ page, extensionId }) => {
        // 1. Load Extension Options Page
        await page.goto(`chrome-extension://${extensionId}/options.html`);
        await page.waitForLoadState('networkidle');

        // 2. Create Prompt A
        await page.locator('#new-prompt-btn').click();
        await page.locator('#prompt-title-input').fill('Prompt A');
        await page.locator('#prompt-text-area').fill('# Header A');
        await page.locator('#save-btn').click();
        // Wait for list update
        await page.locator('.nav-item-prompt', { hasText: 'Prompt A' }).waitFor();

        // 3. Create Prompt B
        await page.locator('#new-prompt-btn').click();
        await page.locator('#prompt-title-input').fill('Prompt B');
        await page.locator('#prompt-text-area').fill('**Bold B**');
        await page.locator('#save-btn').click();
        await page.locator('.nav-item-prompt', { hasText: 'Prompt B' }).waitFor();

        // 4. Select Prompt A and Check Preview
        await page.locator('.nav-item-prompt', { hasText: 'Prompt A' }).click();
        // It defaults to preview now
        const previewA = page.locator('#markdown-preview');
        await expect(previewA).toBeVisible();
        await expect(previewA).toContainText('Header A');
        await expect(previewA).not.toContainText('Bold B');

        // 5. Select Prompt B and Check Preview (The Crucial Step)
        await page.locator('.nav-item-prompt', { hasText: 'Prompt B' }).click();
        const previewB = page.locator('#markdown-preview');
        await expect(previewB).toBeVisible();
        await expect(previewB).toContainText('Bold B');
        await expect(previewB).not.toContainText('Header A');

        console.log('Verified: Preview updates correctly on switch.');
    });
});
