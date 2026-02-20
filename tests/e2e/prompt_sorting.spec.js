
import { test, expect } from './fixtures';

test.describe('Prompt Sorting Feature', () => {

    test.describe('Options Page (Full IDE)', () => {

        test.beforeEach(async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            // Wait for page to be ready - use the new prompt button as indicator
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });
        });

        test('Sort icon and dropdown are visible with correct options', async ({ page }) => {
            const sortBtn = page.locator('#sort-btn');
            await expect(sortBtn).toBeVisible();

            // Click to open dropdown
            await sortBtn.click();

            const sortDropdown = page.locator('#sort-dropdown');
            await expect(sortDropdown).toBeVisible();

            // Verify all sort options exist
            const options = sortDropdown.locator('.sort-option');
            await expect(options).toHaveCount(5);

            // Check option values
            await expect(sortDropdown.locator('[data-value="newest"]')).toHaveText('Newest First');
            await expect(sortDropdown.locator('[data-value="oldest"]')).toHaveText('Oldest First');
            await expect(sortDropdown.locator('[data-value="name-asc"]')).toHaveText('Name (A-Z)');
            await expect(sortDropdown.locator('[data-value="name-desc"]')).toHaveText('Name (Z-A)');
            await expect(sortDropdown.locator('[data-value="modified"]')).toHaveText('Recently Modified');

            // Default "newest" should be active
            await expect(sortDropdown.locator('[data-value="newest"]')).toHaveClass(/active/);
        });

        test('Sort prompts by name A-Z and Z-A', async ({ page }) => {
            // Create prompts with names that sort differently
            const prompts = ['Zebra Prompt', 'Apple Prompt', 'Mango Prompt'];

            for (const name of prompts) {
                await page.click('#new-prompt-btn');
                await page.fill('#prompt-title-input', name);
                await page.fill('#prompt-text-area', `Content for ${name}`);
                await page.click('#save-btn');
                // Wait for save to complete
                await page.waitForTimeout(300);
            }

            // Sort by Name (A-Z)
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="name-asc"]').click();

            // Wait for re-render
            await page.waitForTimeout(200);

            // Get prompt titles in order
            const promptItems = page.locator('.nav-item-prompt .item-title');
            const firstPrompt = await promptItems.first().textContent();
            const lastPrompt = await promptItems.last().textContent();

            // Apple should be first, Zebra should be last
            expect(firstPrompt).toBe('Apple Prompt');
            expect(lastPrompt).toBe('Zebra Prompt');

            // Now sort by Name (Z-A)
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="name-desc"]').click();
            await page.waitForTimeout(200);

            const firstPromptDesc = await promptItems.first().textContent();
            const lastPromptDesc = await promptItems.last().textContent();

            // Zebra should be first, Apple should be last
            expect(firstPromptDesc).toBe('Zebra Prompt');
            expect(lastPromptDesc).toBe('Apple Prompt');
        });

        test('Sort preference is persisted', async ({ page, extensionId }) => {
            // Select a sort option using icon dropdown
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="name-asc"]').click();

            // Reload the page
            await page.reload();

            // Wait for page to load
            await expect(page.locator('#sort-btn')).toBeVisible({ timeout: 10000 });

            // Open dropdown and verify name-asc is active
            await page.locator('#sort-btn').click();
            await expect(page.locator('#sort-dropdown [data-value="name-asc"]')).toHaveClass(/active/);
        });

        test('Sorting works with workspace filter', async ({ page }) => {
            // Create a workspace
            await page.click('#add-project-btn');
            const inlineInput = page.locator('#new-project-input');
            await expect(inlineInput).toBeVisible();
            await inlineInput.fill('Sort Test Workspace');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(300);

            // Create prompts in this workspace
            const prompts = ['Beta Prompt', 'Alpha Prompt'];
            for (const name of prompts) {
                await page.click('#new-prompt-btn');
                await page.fill('#prompt-title-input', name);
                await page.fill('#prompt-text-area', `Content for ${name}`);
                await page.click('#save-btn');
                await page.waitForTimeout(300);
            }

            // Sort by name A-Z
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="name-asc"]').click();
            await page.waitForTimeout(200);

            // Alpha should be first
            const promptItems = page.locator('.nav-item-prompt .item-title');
            const firstPrompt = await promptItems.first().textContent();
            expect(firstPrompt).toBe('Alpha Prompt');
        });

        test('Sorting works with search filter', async ({ page }) => {
            // Create prompts
            const prompts = ['Test Zebra', 'Test Apple', 'Other Prompt'];
            for (const name of prompts) {
                await page.click('#new-prompt-btn');
                await page.fill('#prompt-title-input', name);
                await page.fill('#prompt-text-area', `Content for ${name}`);
                await page.click('#save-btn');
                await page.waitForTimeout(300);
            }

            // Verify all 3 prompts were created before filtering
            const allPrompts = page.locator('.nav-item-prompt .item-title');
            await expect(allPrompts).toHaveCount(3);

            // Search for "Test" - trigger input event explicitly
            const searchInput = page.locator('#search-input');
            await searchInput.fill('Test');
            // Dispatch input event to ensure filter triggers
            await searchInput.dispatchEvent('input');
            await page.waitForTimeout(500);

            // Sort by name A-Z
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="name-asc"]').click();
            await page.waitForTimeout(300);

            // Only Test prompts should be visible, sorted alphabetically
            const visiblePrompts = page.locator('.nav-item-prompt .item-title');
            const count = await visiblePrompts.count();

            // Should only show 2 prompts (Test Apple, Test Zebra)
            expect(count).toBe(2);

            // First should be Test Apple
            const firstPrompt = await visiblePrompts.first().textContent();
            expect(firstPrompt).toBe('Test Apple');
        });
    });

    test.describe('Side Panel', () => {

        test.beforeEach(async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
            // Wait for page to be ready
            await expect(page.locator('#new-prompt-button')).toBeVisible({ timeout: 10000 });
        });

        test('Sort dropdown is visible in side panel', async ({ page }) => {
            const sortBtn = page.locator('#sort-btn');
            await expect(sortBtn).toBeVisible();

            // Click to open dropdown
            await sortBtn.click();

            const sortDropdown = page.locator('#sort-dropdown');
            await expect(sortDropdown).toBeVisible();

            // Verify all sort options exist
            const options = sortDropdown.locator('.sort-option');
            await expect(options).toHaveCount(5);
        });

        test('Sort prompts by name in side panel', async ({ page }) => {
            // Create prompts with different names
            const prompts = ['Zebra Side', 'Apple Side'];

            for (const name of prompts) {
                await page.click('#new-prompt-button');
                await page.fill('#prompt-title', name);
                await page.fill('#prompt-text', `Content for ${name}`);
                await page.click('#save-button');
                await page.waitForTimeout(300);
            }

            // Sort by Name (A-Z)
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="name-asc"]').click();
            await page.waitForTimeout(200);

            // Get prompt titles
            const promptItems = page.locator('.prompt-entry .prompt-title');
            const firstPrompt = await promptItems.first().textContent();

            // Apple should be first
            expect(firstPrompt).toBe('Apple Side');
        });

        test('Sort preference syncs between pages', async ({ page, extensionId }) => {
            // Set sort in side panel using icon dropdown
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="name-desc"]').click();

            // Navigate to options page
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#sort-btn')).toBeVisible({ timeout: 10000 });

            // Open dropdown and verify name-desc is active
            await page.locator('#sort-btn').click();
            await expect(page.locator('#sort-dropdown [data-value="name-desc"]')).toHaveClass(/active/);
        });
    });

    test.describe('Sort by Date', () => {

        test.beforeEach(async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });
        });

        test('Newest first shows most recent prompt at top', async ({ page }) => {
            // Create prompts in sequence
            await page.click('#new-prompt-btn');
            await page.fill('#prompt-title-input', 'First Created');
            await page.fill('#prompt-text-area', 'First content');
            await page.click('#save-btn');
            await page.waitForTimeout(500);

            await page.click('#new-prompt-btn');
            await page.fill('#prompt-title-input', 'Second Created');
            await page.fill('#prompt-text-area', 'Second content');
            await page.click('#save-btn');
            await page.waitForTimeout(500);

            await page.click('#new-prompt-btn');
            await page.fill('#prompt-title-input', 'Third Created');
            await page.fill('#prompt-text-area', 'Third content');
            await page.click('#save-btn');
            await page.waitForTimeout(300);

            // Set sort to newest first
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="newest"]').click();
            await page.waitForTimeout(200);

            // Third Created should be first
            const promptItems = page.locator('.nav-item-prompt .item-title');
            const firstPrompt = await promptItems.first().textContent();
            expect(firstPrompt).toBe('Third Created');
        });

        test('Oldest first shows oldest prompt at top', async ({ page }) => {
            // Create prompts in sequence
            await page.click('#new-prompt-btn');
            await page.fill('#prompt-title-input', 'Old Prompt');
            await page.fill('#prompt-text-area', 'Old content');
            await page.click('#save-btn');
            await page.waitForTimeout(500);

            await page.click('#new-prompt-btn');
            await page.fill('#prompt-title-input', 'New Prompt');
            await page.fill('#prompt-text-area', 'New content');
            await page.click('#save-btn');
            await page.waitForTimeout(300);

            // Set sort to oldest first
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="oldest"]').click();
            await page.waitForTimeout(200);

            // Old Prompt should be first
            const promptItems = page.locator('.nav-item-prompt .item-title');
            const firstPrompt = await promptItems.first().textContent();
            expect(firstPrompt).toBe('Old Prompt');
        });

        test('Recently modified shows edited prompt at top', async ({ page }) => {
            // Create two prompts
            await page.click('#new-prompt-btn');
            await page.fill('#prompt-title-input', 'Original Prompt');
            await page.fill('#prompt-text-area', 'Original content');
            await page.click('#save-btn');
            await page.waitForTimeout(500);

            await page.click('#new-prompt-btn');
            await page.fill('#prompt-title-input', 'Later Prompt');
            await page.fill('#prompt-text-area', 'Later content');
            await page.click('#save-btn');
            await page.waitForTimeout(500);

            // Now edit the Original Prompt
            await page.locator('.nav-item-prompt', { hasText: 'Original Prompt' }).click();
            await page.waitForTimeout(200);

            // Toggle to edit mode if in preview
            const textArea = page.locator('#prompt-text-area');
            if (await textArea.isHidden()) {
                await page.locator('#toggle-preview-btn').click();
            }

            await textArea.fill('Updated content - this was modified');
            await page.click('#save-btn');
            await page.waitForTimeout(300);

            // Set sort to recently modified
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="modified"]').click();
            await page.waitForTimeout(200);

            // Original Prompt should now be first (most recently modified)
            const promptItems = page.locator('.nav-item-prompt .item-title');
            const firstPrompt = await promptItems.first().textContent();
            expect(firstPrompt).toBe('Original Prompt');
        });
    });
});
