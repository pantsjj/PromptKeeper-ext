
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

        // Wait for list to update
        await page.waitForTimeout(500); // Allow storage sync/DOM update
        const prompt1 = page.locator('.prompt-entry', { hasText: 'Prompt One' });
        await expect(prompt1).toBeVisible();

        // Create Prompt 2
        await newButton.click();
        await titleInput.fill('Prompt Two');
        await textArea.fill('Content 2');
        await saveButton.click();

        // Wait for list to update
        await page.waitForTimeout(500);
        const prompt2 = page.locator('.prompt-entry', { hasText: 'Prompt Two' });
        await expect(prompt2).toBeVisible();

        // 3. Verify selection Logic

        // Click Prompt 1
        await prompt1.click();
        await expect(prompt1).toHaveClass(/active/);
        await expect(prompt2).not.toHaveClass(/active/);

        // Click Prompt 2
        await prompt2.click();
        await expect(prompt2).toHaveClass(/active/);
        await expect(prompt1).not.toHaveClass(/active/);
    });

    test('Should update footer stats in options page on selection', async ({ page, extensionId }) => {
        // 1. Setup - Create a prompt via Sidepanel logic (or assuming storage shared)
        // Since tests isolate context, need to create prompt in this context first? 
        // Actually fixture starts fresh context. Let's create prompt in options page.
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        const newBtn = page.locator('#new-prompt-btn');
        const saveBtn = page.locator('#save-btn');
        const titleIn = page.locator('#prompt-title-input');
        const textIn = page.locator('#prompt-text-area');

        await newBtn.click();
        await titleIn.fill('Stats Test Prompt');
        const promptText = 'One two three four five'; // 5 words
        await textIn.fill(promptText);
        await saveBtn.click();

        // Wait for save visual feedback (pulse-green)
        await expect(textIn).toHaveClass(/pulse-green/, { timeout: 5000 });

        // Verify it appears in the list BEFORE reload to ensure save completion
        await expect(page.locator('.nav-item-prompt', { hasText: 'Stats Test Prompt' })).toBeVisible();

        // Reload page to simulate fresh entry and verifying "selection from list"
        await page.reload();

        // 2. Locate the prompt in list and click it
        // Options page prompt list might load slightly async
        const promptItem = page.locator('.nav-item-prompt', { hasText: 'Stats Test Prompt' });
        await expect(promptItem).toBeVisible({ timeout: 5000 });

        // Initial Footer Word Count should be 0 or empty before selection
        const footerWordCount = page.locator('#footer-word-count');

        // Click to select
        await promptItem.click();

        // 3. Verify Footer Stats updated
        // Expected: "Words: 5"
        await expect(footerWordCount).toHaveText('Words: 5');

        // Verify Size is also present (format: "Size: X.X KB")
        const footerSize = page.locator('#footer-storage-used');
        await expect(footerSize).toContainText('Size:');
        await expect(footerSize).toContainText('KB');
    });

});
