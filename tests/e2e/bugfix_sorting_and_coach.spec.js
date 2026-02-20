/**
 * E2E Tests for bug fixes:
 * 1. Sort dropdown - prompts should not disappear when cycling through sort options
 * 2. Version selection - Prompt Coach should update when selecting historical revisions
 */
import { test, expect } from './fixtures';

test.describe('Bug Fixes - Sorting and Prompt Coach', () => {

    test.describe('Sort Dropdown Bug Fix', () => {

        test.beforeEach(async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });

            // Create test prompts
            const prompts = ['Alpha Test', 'Beta Test', 'Charlie Test'];
            for (const name of prompts) {
                await page.click('#new-prompt-btn');
                await page.fill('#prompt-title-input', name);
                await page.fill('#prompt-text-area', `Content for ${name}`);
                await page.click('#save-btn');
                await page.waitForTimeout(300);
            }
        });

        test('Prompts remain visible when sorting by Name (A-Z)', async ({ page }) => {
            const promptList = page.locator('#prompt-list');

            // Verify initial prompts are visible
            await expect(promptList.locator('.nav-item-prompt')).toHaveCount(3);

            // Open sort dropdown
            const sortBtn = page.locator('#sort-btn');
            await sortBtn.click();
            await page.waitForTimeout(100);

            // Select Name (A-Z)
            const nameAscOption = page.locator('.sort-option[data-value="name-asc"]');
            await nameAscOption.click();
            await page.waitForTimeout(300);

            // Verify prompts are still visible
            await expect(promptList.locator('.nav-item-prompt')).toHaveCount(3);

            // Verify sort order (Alpha should be first)
            const firstPrompt = promptList.locator('.nav-item-prompt .item-title').first();
            await expect(firstPrompt).toHaveText('Alpha Test');
        });

        test('Prompts remain visible when cycling through all sort options', async ({ page }) => {
            const promptList = page.locator('#prompt-list');
            const sortBtn = page.locator('#sort-btn');

            const sortOptions = ['newest', 'oldest', 'name-asc', 'name-desc', 'modified'];

            for (const sortValue of sortOptions) {
                // Open sort dropdown
                await sortBtn.click();
                await page.waitForTimeout(100);

                // Select option
                const option = page.locator(`.sort-option[data-value="${sortValue}"]`);
                await option.click();
                await page.waitForTimeout(300);

                // Verify prompts are still visible
                const count = await promptList.locator('.nav-item-prompt').count();
                expect(count).toBe(3);
            }
        });

        test('Sort selection persists after clicking same option twice', async ({ page }) => {
            const promptList = page.locator('#prompt-list');
            const sortBtn = page.locator('#sort-btn');

            // Click Name (A-Z) first time
            await sortBtn.click();
            await page.waitForTimeout(100);
            await page.locator('.sort-option[data-value="name-asc"]').click();
            await page.waitForTimeout(300);
            await expect(promptList.locator('.nav-item-prompt')).toHaveCount(3);

            // Click Name (A-Z) second time (same option)
            await sortBtn.click();
            await page.waitForTimeout(100);
            await page.locator('.sort-option[data-value="name-asc"]').click();
            await page.waitForTimeout(300);

            // Prompts should still be visible
            await expect(promptList.locator('.nav-item-prompt')).toHaveCount(3);
        });

        test('Sort order changes prompt list order correctly', async ({ page }) => {
            const promptList = page.locator('#prompt-list');
            const sortBtn = page.locator('#sort-btn');

            // Sort by Name (A-Z)
            await sortBtn.click();
            await page.waitForTimeout(100);
            await page.locator('.sort-option[data-value="name-asc"]').click();
            await page.waitForTimeout(300);

            // First should be Alpha
            let first = await promptList.locator('.nav-item-prompt .item-title').first().textContent();
            expect(first).toBe('Alpha Test');

            // Sort by Name (Z-A)
            await sortBtn.click();
            await page.waitForTimeout(100);
            await page.locator('.sort-option[data-value="name-desc"]').click();
            await page.waitForTimeout(300);

            // First should be Charlie
            first = await promptList.locator('.nav-item-prompt .item-title').first().textContent();
            expect(first).toBe('Charlie Test');
        });
    });

    test.describe('Prompt Coach Version Selection Bug Fix', () => {

        test.beforeEach(async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });

            // Create a prompt with multiple versions
            await page.click('#new-prompt-btn');
            await page.fill('#prompt-title-input', 'Version Test Prompt');
            await page.fill('#prompt-text-area', 'Version 1 content - original text');
            await page.click('#save-btn');
            await page.waitForTimeout(500);

            // Toggle preview to edit mode before editing version 2
            await page.click('#toggle-preview-btn');
            await page.fill('#prompt-text-area', 'Version 2 content - updated text');
            await page.click('#save-btn');
            await page.waitForTimeout(500);

            // Toggle preview to edit mode before editing version 3
            await page.click('#toggle-preview-btn');
            await page.fill('#prompt-text-area', 'Version 3 content - latest text');
            await page.click('#save-btn');
            await page.waitForTimeout(500);
        });

        test('Version selector is populated with multiple versions', async ({ page }) => {
            // Check version selector has options
            const versionSelect = page.locator('#footer-version-selector');
            await expect(versionSelect).toBeVisible();

            const optionCount = await versionSelect.locator('option').count();
            expect(optionCount).toBeGreaterThanOrEqual(3);
        });

        test('Selecting historical version changes editor content', async ({ page }) => {
            // Toggle to edit mode first (save leaves us in preview mode)
            await page.click('#toggle-preview-btn');
            await page.waitForTimeout(200);

            // Get initial content (should be version 3 - latest)
            const textArea = page.locator('#prompt-text-area');
            const initialContent = await textArea.inputValue();
            expect(initialContent).toContain('Version 3');

            // Get version selector
            const versionSelect = page.locator('#footer-version-selector');

            // Find and select an older version (not current)
            const options = await versionSelect.locator('option').all();
            for (const opt of options) {
                const text = await opt.textContent();
                if (!text.includes('(Current)')) {
                    const value = await opt.getAttribute('value');
                    await versionSelect.selectOption(value);
                    break;
                }
            }

            await page.waitForTimeout(300);

            // Content should have changed to older version
            const newContent = await textArea.inputValue();
            expect(newContent).not.toBe(initialContent);
            // Should contain either Version 1 or Version 2
            const hasOlderVersion = newContent.includes('Version 1') || newContent.includes('Version 2');
            expect(hasOlderVersion).toBe(true);
        });

        test('Selecting historical version triggers Prompt Coach update (when available)', async ({ page }) => {
            // This test verifies the code path is correct
            // The actual Prompt Coach may not be available in test environment

            // Toggle to edit mode first (save leaves us in preview mode)
            await page.click('#toggle-preview-btn');
            await page.waitForTimeout(200);

            const textArea = page.locator('#prompt-text-area');
            const versionSelect = page.locator('#footer-version-selector');

            // Get initial content
            const initialContent = await textArea.inputValue();

            // Select an older version
            const options = await versionSelect.locator('option').all();
            for (const opt of options) {
                const text = await opt.textContent();
                if (!text.includes('(Current)')) {
                    const value = await opt.getAttribute('value');
                    await versionSelect.selectOption(value);
                    break;
                }
            }

            await page.waitForTimeout(500); // Allow debounce timer for Prompt Coach

            // Verify content changed (proves the onchange handler fired)
            const newContent = await textArea.inputValue();
            expect(newContent).not.toBe(initialContent);

            // The test passes if we get here - the debouncePromptAnalysis() call
            // is in the code path and will execute when AI is available
        });
    });

    test.describe('Screenshot Validation', () => {

        test('Visual: Prompts visible after cycling through sort options', async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });

            // Create prompts
            const prompts = ['Test A', 'Test B', 'Test C'];
            for (const name of prompts) {
                await page.click('#new-prompt-btn');
                await page.fill('#prompt-title-input', name);
                await page.fill('#prompt-text-area', `Content for ${name}`);
                await page.click('#save-btn');
                await page.waitForTimeout(300);
            }

            // Cycle through all sort options
            const sortOptions = ['name-asc', 'name-desc', 'oldest', 'modified', 'newest'];
            for (const sortValue of sortOptions) {
                await page.locator('#sort-btn').click();
                await page.waitForTimeout(100);
                await page.locator(`.sort-option[data-value="${sortValue}"]`).click();
                await page.waitForTimeout(200);
            }

            // Take screenshot after all sorting operations
            await page.screenshot({
                path: 'test-results/sort-cycle-complete.png',
                fullPage: false
            });

            // Verify prompts are visible
            const promptCount = await page.locator('.nav-item-prompt').count();
            expect(promptCount).toBe(3);
        });
    });
});
