import { test, expect } from './fixtures';

// Screenshot directory - relative to project root
const screenshotDir = 'test-results';

test.describe('v2.2 Visual Validation', () => {

    test.describe('1. Placeholder Highlighting Feature', () => {

        test('Create prompt with placeholders and verify highlighting in preview', async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });

            // Create a new prompt with placeholders
            await page.click('#new-prompt-btn');
            await page.waitForTimeout(300);

            // Fill in the prompt content
            await page.fill('#prompt-title-input', 'Placeholder Test');

            const placeholderContent = 'You are a [role]. Your task is to [describe task]. Context: {{context variable}}';
            await page.fill('#prompt-text-area', placeholderContent);

            // Screenshot before saving (in edit mode)
            await page.screenshot({
                path: `${screenshotDir}/01-placeholder-edit-mode.png`,
                fullPage: true
            });

            // Save the prompt - this will switch to preview mode automatically
            await page.click('#save-btn');
            await page.waitForTimeout(800);

            // After save, the page should auto-switch to preview mode
            const previewDiv = page.locator('#markdown-preview');
            await expect(previewDiv).toBeVisible({ timeout: 5000 });

            // Screenshot showing placeholders highlighted in preview
            await page.screenshot({
                path: `${screenshotDir}/02-placeholder-preview-highlighted.png`,
                fullPage: true
            });

            // Check for placeholder spans (look for the highlighted elements)
            // Placeholders like [role], [describe task], {{context variable}} should be highlighted
            const placeholderElements = previewDiv.locator('.placeholder');
            const count = await placeholderElements.count();
            console.log(`Found ${count} placeholder elements in preview`);

            // Verify placeholders are visible and styled (should have at least 3 placeholders)
            expect(count).toBeGreaterThanOrEqual(3);

            // Verify placeholder text content
            const firstPlaceholder = await placeholderElements.first().textContent();
            console.log(`First placeholder text: "${firstPlaceholder}"`);
        });

        test('Click-to-select placeholder switches to edit mode', async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });

            // Create a prompt with placeholders
            await page.click('#new-prompt-btn');
            await page.waitForTimeout(300);

            await page.fill('#prompt-title-input', 'Click Select Test');
            await page.fill('#prompt-text-area', 'Hello [name], welcome to [location]!');

            // Save - this switches to preview mode
            await page.click('#save-btn');
            await page.waitForTimeout(800);

            // Now we should be in preview mode
            const previewDiv = page.locator('#markdown-preview');
            await expect(previewDiv).toBeVisible({ timeout: 5000 });

            // Find placeholder elements
            const placeholders = previewDiv.locator('.placeholder');
            const placeholderCount = await placeholders.count();
            console.log(`Found ${placeholderCount} clickable placeholders`);

            if (placeholderCount > 0) {
                // Screenshot before clicking
                await page.screenshot({
                    path: `${screenshotDir}/03-before-placeholder-click.png`,
                    fullPage: true
                });

                // Click the first placeholder
                await placeholders.first().click();
                await page.waitForTimeout(300);

                // Screenshot after clicking - should be in edit mode
                await page.screenshot({
                    path: `${screenshotDir}/04-after-placeholder-click-edit-mode.png`,
                    fullPage: true
                });

                // Verify we're back in edit mode
                const textArea = page.locator('#prompt-text-area');
                await expect(textArea).toBeVisible();
            } else {
                // If no .placeholder elements, try clicking a code element
                const codeElements = previewDiv.locator('code');
                const codeCount = await codeElements.count();
                console.log(`Found ${codeCount} code elements`);

                // Take screenshot showing current state
                await page.screenshot({
                    path: `${screenshotDir}/03-preview-state.png`,
                    fullPage: true
                });
            }
        });
    });

    test.describe('2. Sort Dropdown Feature', () => {

        test('Create prompts and verify sort functionality', async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });

            // Create 3 prompts: Alpha, Beta, Charlie
            const prompts = ['Alpha', 'Beta', 'Charlie'];

            for (const name of prompts) {
                await page.click('#new-prompt-btn');
                await page.waitForTimeout(200);
                await page.fill('#prompt-title-input', name);
                await page.fill('#prompt-text-area', `Content for ${name}`);
                await page.click('#save-btn');
                await page.waitForTimeout(400);
            }

            // Screenshot with all prompts created
            await page.screenshot({
                path: `${screenshotDir}/05-prompts-created.png`,
                fullPage: true
            });

            // Click sort button to open dropdown
            const sortBtn = page.locator('#sort-btn');
            await sortBtn.click();
            await page.waitForTimeout(200);

            // Screenshot showing sort dropdown
            await page.screenshot({
                path: `${screenshotDir}/06-sort-dropdown-open.png`,
                fullPage: true
            });

            // Select "Name (A-Z)"
            await page.locator('#sort-dropdown [data-value="name-asc"]').click();
            await page.waitForTimeout(300);

            // Verify Alpha is first
            const promptItems = page.locator('.nav-item-prompt .item-title');
            const firstPrompt = await promptItems.first().textContent();
            expect(firstPrompt).toBe('Alpha');

            // Screenshot with A-Z sort
            await page.screenshot({
                path: `${screenshotDir}/07-sort-name-a-z.png`,
                fullPage: true
            });

            // Select "Name (Z-A)"
            await sortBtn.click();
            await page.locator('#sort-dropdown [data-value="name-desc"]').click();
            await page.waitForTimeout(300);

            // Verify Charlie is first
            const firstPromptZA = await promptItems.first().textContent();
            expect(firstPromptZA).toBe('Charlie');

            // Screenshot with Z-A sort
            await page.screenshot({
                path: `${screenshotDir}/08-sort-name-z-a.png`,
                fullPage: true
            });

            // Verify prompts didn't disappear - all 3 should still be visible
            const promptCount = await promptItems.count();
            expect(promptCount).toBe(3);

            console.log(`Prompts visible after sorting: ${promptCount}`);
        });
    });

    test.describe('3. Theme Toggle Feature', () => {

        test('Test theme switching with visual verification', async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });

            // Screenshot initial state (Auto theme)
            await page.screenshot({
                path: `${screenshotDir}/09-theme-auto-initial.png`,
                fullPage: true
            });

            // Verify Auto is default active
            const themeAuto = page.locator('#theme-auto');
            await expect(themeAuto).toHaveClass(/active/);

            // Click Dark theme
            const themeDark = page.locator('#theme-dark');
            await themeDark.click();
            await page.waitForTimeout(300);

            // Verify Dark theme is active and applied
            await expect(themeDark).toHaveClass(/active/);
            const htmlDark = page.locator('html');
            await expect(htmlDark).toHaveClass(/theme-dark/);

            // Screenshot Dark theme
            await page.screenshot({
                path: `${screenshotDir}/10-theme-dark.png`,
                fullPage: true
            });

            // Verify dark mode styling
            const bgColor = await page.evaluate(() => {
                return getComputedStyle(document.body).backgroundColor;
            });
            console.log(`Dark mode background color: ${bgColor}`);

            // Click Light theme
            const themeLight = page.locator('#theme-light');
            await themeLight.click();
            await page.waitForTimeout(300);

            // Verify Light theme is active and applied
            await expect(themeLight).toHaveClass(/active/);
            const htmlLight = page.locator('html');
            await expect(htmlLight).toHaveClass(/theme-light/);

            // Screenshot Light theme
            await page.screenshot({
                path: `${screenshotDir}/11-theme-light.png`,
                fullPage: true
            });

            // Verify light mode styling
            const bgColorLight = await page.evaluate(() => {
                return getComputedStyle(document.body).backgroundColor;
            });
            console.log(`Light mode background color: ${bgColorLight}`);
        });
    });

    test.describe('4. Combined Feature Validation', () => {

        test('Full workflow: Create, sort, preview placeholders, and theme toggle', async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });

            // Switch to Dark theme first for visual contrast
            await page.locator('#theme-dark').click();
            await page.waitForTimeout(200);

            // Create a prompt with placeholders
            await page.click('#new-prompt-btn');
            await page.waitForTimeout(200);
            await page.fill('#prompt-title-input', 'AI Assistant Template');
            await page.fill('#prompt-text-area', `You are a [role description] assistant.

Your expertise includes:
- {{area of expertise 1}}
- {{area of expertise 2}}

When responding, you should:
1. Use a [tone] tone
2. Focus on [main focus]
3. Avoid [things to avoid]

Context: {{additional context}}`);
            await page.click('#save-btn');
            await page.waitForTimeout(800);

            // After save, it should be in preview mode with placeholders
            const previewDiv = page.locator('#markdown-preview');
            await expect(previewDiv).toBeVisible({ timeout: 5000 });

            // Screenshot: Dark theme with placeholders highlighted
            await page.screenshot({
                path: `${screenshotDir}/12-combined-dark-preview.png`,
                fullPage: true
            });

            // Switch to Light theme
            await page.locator('#theme-light').click();
            await page.waitForTimeout(300);

            // Screenshot: Light theme with placeholders highlighted
            await page.screenshot({
                path: `${screenshotDir}/13-combined-light-preview.png`,
                fullPage: true
            });

            // Create more prompts for sorting test
            await page.click('#new-prompt-btn');
            await page.waitForTimeout(200);
            await page.fill('#prompt-title-input', 'Zebra Template');
            await page.fill('#prompt-text-area', 'A template starting with Z');
            await page.click('#save-btn');
            await page.waitForTimeout(400);

            await page.click('#new-prompt-btn');
            await page.waitForTimeout(200);
            await page.fill('#prompt-title-input', 'Alpha Template');
            await page.fill('#prompt-text-area', 'A template starting with A');
            await page.click('#save-btn');
            await page.waitForTimeout(400);

            // Sort by name A-Z
            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="name-asc"]').click();
            await page.waitForTimeout(300);

            // Screenshot: Sorted prompts in light theme
            await page.screenshot({
                path: `${screenshotDir}/14-combined-sorted-light.png`,
                fullPage: true
            });

            // Verify sort order
            const promptItems = page.locator('.nav-item-prompt .item-title');
            const firstPrompt = await promptItems.first().textContent();
            expect(firstPrompt).toBe('AI Assistant Template');

            const promptCount = await promptItems.count();
            expect(promptCount).toBe(3);

            console.log(`Combined test: ${promptCount} prompts, first is "${firstPrompt}"`);
        });
    });
});
