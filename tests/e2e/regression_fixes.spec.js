
import { test, expect } from './fixtures';

test.describe('UI Regression Fixes', () => {

    test('Should highlight selected prompt in side panel', async ({ page, extensionId }) => {
        // 1. Navigate to side panel
        await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

        // 2. Create two prompts to test selection
        const titleInput = page.locator('#prompt-title');
        const textArea = page.locator('#prompt-text');
        const saveButton = page.locator('#save-button');
        const newButton = page.locator('#new-prompt-button');

        // Create Prompt 1
        await newButton.click();
        await titleInput.fill('Prompt One');
        await textArea.fill('Content 1');
        await saveButton.click();

        // Wait for list to update and elements to be stable
        const prompt1 = page.locator('.prompt-entry', { hasText: 'Prompt One' });
        await expect(prompt1).toBeVisible();

        // Create Prompt 2
        await newButton.click();
        await titleInput.fill('Prompt Two');
        await textArea.fill('Content 2');
        await saveButton.click();

        // Wait for list to update
        const prompt2 = page.locator('.prompt-entry', { hasText: 'Prompt Two' });
        await expect(prompt2).toBeVisible();

        // 3. Verify selection Logic
        // Click Prompt 1 and wait for active class
        await prompt1.click();
        await expect(prompt1).toHaveClass(/active/, { timeout: 2000 });
        await expect(prompt2).not.toHaveClass(/active/);

        // Click Prompt 2
        await prompt2.click();
        await expect(prompt2).toHaveClass(/active/, { timeout: 2000 });
        await expect(prompt1).not.toHaveClass(/active/);
    });

    test('Should update footer stats in options page on selection', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        const newBtn = page.locator('#new-prompt-btn');

        await newBtn.click();
        // Fixed IDs for Options Page
        await page.locator('#prompt-title-input').fill('Stats Test Prompt');
        const promptText = 'One two three four five';
        await page.locator('#prompt-text-area').fill(promptText);
        await page.locator('#save-btn').click();

        // Wait for save (unsaved-glow removal)
        await expect(page.locator('#prompt-text-area')).not.toHaveClass(/unsaved-glow/, { timeout: 5000 });

        // Verify it appears in the list 
        await expect(page.locator('.nav-item-prompt', { hasText: 'Stats Test Prompt' })).toBeVisible();

        // 2. Locate the prompt in list and click it
        const promptItem = page.locator('.nav-item-prompt', { hasText: 'Stats Test Prompt' });
        await expect(promptItem).toBeVisible({ timeout: 5000 });

        const footerWordCount = page.locator('#footer-word-count');

        // Click to select
        await promptItem.click();

        // 3. Verify Footer Stats updated
        await expect(footerWordCount).toHaveText('Words: 5');

        // Verify Size
        const footerSize = page.locator('#footer-storage-used');
        await expect(footerSize).toContainText('Size:');
        await expect(footerSize).toContainText('KB');
    });

    test('Should reset footer stats when creating a new prompt', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        // 1. Create a prompt with text
        await page.locator('#new-prompt-btn').click();
        await page.locator('#prompt-title-input').fill('Stats Reset Test');
        await page.locator('#prompt-text-area').fill('One two three');
        await page.locator('#save-btn').click();

        // Verify stats > 0
        await expect(page.locator('#footer-word-count')).toHaveText('Words: 3');

        // 2. Click New Prompt
        await page.locator('#new-prompt-btn').click();

        // 3. Verify stats reset
        await expect(page.locator('#footer-word-count')).toHaveText('Words: 0');
    });
});
