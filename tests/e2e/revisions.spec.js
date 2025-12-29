
import { test, expect } from './fixtures';

test.describe('Revisions and Markdown Sync', () => {

    test.beforeEach(async ({ page, extensionId }) => {
        // Setup: Create a clean workspace to avoid "All Prompts" ambiguity
        await page.goto(`chrome-extension://${extensionId}/options.html`);
        await page.locator('#add-project-btn').click();
        await page.locator('#new-project-input').fill('revision_test_ws');
        await page.keyboard.press('Enter');
        await expect(page.locator('.nav-item').filter({ hasText: 'revision_test_ws' })).toBeVisible();
    });

    test('Should increment version on save and allow restore', async ({ page }) => {
        // 1. Create Prompt in new workspace
        await page.locator('#new-prompt-btn').click();

        // 1. Version 1
        await page.fill('#prompt-title', 'Revision Test'); // Correct ID from options.html
        await page.fill('#prompt-text', 'Version 1 Content'); // Correct ID
        await page.click('#save-button'); // Correct ID
        await expect(page.locator('#footer-version-selector')).toContainText('v1');

        // 2. Version 2
        // Check if in preview mode and toggle if needed
        const textArea = page.locator('#prompt-text');
        if (await textArea.isHidden()) {
            await page.click('#toggle-preview-btn');
        }

        await page.fill('#prompt-text', 'Version 2 Content');
        await page.click('#save-button');
        // Wait for save sync
        await page.waitForTimeout(500);

        // Check selector has v2 and v1
        const selector = page.locator('#footer-version-selector');
        await expect(selector).toContainText('v2');

        // 3. Restore Version 1
        // Select v1 from dropdown (by text content matching 'v1')
        // We can get all option texts and select based on that
        const options = selector.locator('option');
        const count = await options.count();
        // Assuming v1 is at index 1 (0 is HEAD/Current?) OR v1, v2... 
        // Let's assume standard behavior: new versions at top or bottom?
        // We'll select the one containing 'v1'
        await selector.selectOption({ label: 'v1' }); // Attempt by label
        // If label doesn't match 'v1' exactly (might be 'v1 - <date>'), we use value or index.
        // Let's force value selection if possible, or just select the second option (history).

        // Try fallback if label fails? No, let's assume 'v1' text is part of label? 
        // options.js logic: `option.textContent = v${v.versionNumber} - ${dateStr}`;`
        // So selectOption({ label: 'v1...' }) using regex? 
        // Playwright selectOption supports label with glob/regex? No, string exact or substring?
        // It says "Matches by label".
        // Let's find the element value first.
        const v1Option = options.filter({ hasText: 'v1' }).first();
        const v1Value = await v1Option.getAttribute('value');
        await selector.selectOption(v1Value);

        // Wait for restore
        await page.waitForTimeout(500);

        // Verify Content
        await expect(page.locator('#prompt-text')).toHaveValue('Version 1 Content');
    });

    test('Markdown Preview should update immediately', async ({ page }) => {
        await page.locator('#new-prompt-btn').click();

        await page.fill('#prompt-text', '# Title\n**Bold**'); // Correct ID

        // Toggle Preview
        await page.click('#toggle-preview-btn');

        const preview = page.locator('#markdown-preview');
        await expect(preview).toBeVisible();
        await expect(preview.locator('h1')).toHaveText('Title');
        await expect(preview.locator('strong')).toHaveText('Bold');

        // Toggle Edit
        await page.click('#toggle-preview-btn');
        await expect(page.locator('#prompt-text')).toBeVisible();
    });

});
