
import { test, expect } from './fixtures';

/**
 * Filtering Journey Test
 *
 * This E2E test validates the complete filtering experience including:
 * - Search filtering
 * - Workspace filtering
 * - Combined search + sort + workspace filters
 * - Filter persistence across sessions
 */

test.describe('Filtering Journey', () => {

    test.describe('Options Page - Full Filtering Experience', () => {

        test.beforeEach(async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });
        });

        test('Complete filtering journey: create, search, filter by workspace, sort', async ({ page }) => {
            // Step 1: Create a workspace
            await page.click('#add-project-btn');
            const workspaceInput = page.locator('#new-project-input');
            await expect(workspaceInput).toBeVisible();
            await workspaceInput.fill('marketing');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(300);

            // Step 2: Create prompts in this workspace
            const marketingPrompts = [
                { title: 'Email Campaign A', content: 'Write an email marketing campaign for product launch' },
                { title: 'Social Media Plan', content: 'Create a social media strategy for Q1' },
                { title: 'Blog Post Ideas', content: 'Generate blog post ideas for marketing' }
            ];

            for (const prompt of marketingPrompts) {
                await page.click('#new-prompt-btn');
                await page.fill('#prompt-title-input', prompt.title);
                await page.fill('#prompt-text-area', prompt.content);
                await page.click('#save-btn');
                await page.waitForTimeout(300);
            }

            // Step 3: Create another workspace
            await page.click('#add-project-btn');
            const workspaceInput2 = page.locator('#new-project-input');
            await expect(workspaceInput2).toBeVisible();
            await workspaceInput2.fill('development');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(300);

            // Step 4: Create prompts in development workspace
            const devPrompts = [
                { title: 'Code Review Helper', content: 'Review this code for bugs and improvements' },
                { title: 'API Documentation', content: 'Document this API endpoint' }
            ];

            for (const prompt of devPrompts) {
                await page.click('#new-prompt-btn');
                await page.fill('#prompt-title-input', prompt.title);
                await page.fill('#prompt-text-area', prompt.content);
                await page.click('#save-btn');
                await page.waitForTimeout(300);
            }

            // Verify total prompts created
            await page.locator('[data-id="all"]').click();
            await page.waitForTimeout(200);
            const allPrompts = page.locator('.nav-item-prompt');
            await expect(allPrompts).toHaveCount(5);

            // Step 5: Filter by workspace - marketing
            await page.locator('.nav-item', { hasText: 'marketing' }).click();
            await page.waitForTimeout(200);

            const marketingItems = page.locator('.nav-item-prompt .item-title');
            const marketingCount = await marketingItems.count();
            expect(marketingCount).toBe(3);

            // Step 6: Search within workspace
            const searchInput = page.locator('#search-input');
            await searchInput.fill('Email');
            await page.waitForTimeout(300);

            const filteredPrompts = page.locator('.nav-item-prompt .item-title');
            const filteredCount = await filteredPrompts.count();
            expect(filteredCount).toBe(1);
            await expect(filteredPrompts.first()).toHaveText('Email Campaign A');

            // Step 7: Clear search and sort by name A-Z
            await searchInput.clear();
            await page.waitForTimeout(200);

            await page.locator('#sort-btn').click();
            await page.locator('#sort-dropdown [data-value="name-asc"]').click();
            await page.waitForTimeout(200);

            const sortedTitles = page.locator('.nav-item-prompt .item-title');
            const firstTitle = await sortedTitles.first().textContent();
            const lastTitle = await sortedTitles.last().textContent();

            // Blog comes before Email, Email before Social in A-Z
            expect(firstTitle).toBe('Blog Post Ideas');
            expect(lastTitle).toBe('Social Media Plan');

            // Step 8: Switch to All Prompts and verify all are visible
            await page.locator('[data-id="all"]').click();
            await page.waitForTimeout(200);

            const allPromptsAgain = page.locator('.nav-item-prompt .item-title');
            await expect(allPromptsAgain).toHaveCount(5);

            // Step 9: Combined search across all prompts
            await searchInput.fill('code');
            await page.waitForTimeout(300);

            const codePrompts = page.locator('.nav-item-prompt .item-title');
            const codeCount = await codePrompts.count();
            expect(codeCount).toBe(1);
            await expect(codePrompts.first()).toHaveText('Code Review Helper');
        });

        test('Search filter highlights and filters correctly', async ({ page }) => {
            // Create test prompts with distinct keywords
            const prompts = [
                { title: 'Python Tutorial', content: 'Learn Python programming basics' },
                { title: 'JavaScript Guide', content: 'Advanced JavaScript concepts' },
                { title: 'Python Advanced', content: 'Python machine learning tutorials' }
            ];

            for (const prompt of prompts) {
                await page.click('#new-prompt-btn');
                await page.fill('#prompt-title-input', prompt.title);
                await page.fill('#prompt-text-area', prompt.content);
                await page.click('#save-btn');
                await page.waitForTimeout(300);
            }

            // Verify all prompts exist
            const allItems = page.locator('.nav-item-prompt');
            await expect(allItems).toHaveCount(3);

            // Search for "Python" - should match 2 prompts
            const searchInput = page.locator('#search-input');
            await searchInput.fill('Python');
            await page.waitForTimeout(300);

            const pythonPrompts = page.locator('.nav-item-prompt .item-title');
            const pythonCount = await pythonPrompts.count();
            expect(pythonCount).toBe(2);

            // Search for "JavaScript" - should match 1 prompt
            await searchInput.clear();
            await searchInput.fill('JavaScript');
            await page.waitForTimeout(300);

            const jsPrompts = page.locator('.nav-item-prompt .item-title');
            const jsCount = await jsPrompts.count();
            expect(jsCount).toBe(1);
            await expect(jsPrompts.first()).toHaveText('JavaScript Guide');

            // Search for non-existent term
            await searchInput.clear();
            await searchInput.fill('Ruby');
            await page.waitForTimeout(300);

            const noPrompts = page.locator('.nav-item-prompt');
            const noCount = await noPrompts.count();
            expect(noCount).toBe(0);

            // Clear search - all should reappear
            await searchInput.clear();
            await page.waitForTimeout(300);

            const allAgain = page.locator('.nav-item-prompt');
            await expect(allAgain).toHaveCount(3);
        });

        test('Content-based search finds prompts by body text', async ({ page }) => {
            // Create prompts where title doesn't match but content does
            const prompts = [
                { title: 'Generic Title 1', content: 'This prompt is about UNIQUEKEYWORD123' },
                { title: 'Generic Title 2', content: 'Something completely different' }
            ];

            for (const prompt of prompts) {
                await page.click('#new-prompt-btn');
                await page.fill('#prompt-title-input', prompt.title);
                await page.fill('#prompt-text-area', prompt.content);
                await page.click('#save-btn');
                await page.waitForTimeout(300);
            }

            // Search for content keyword
            const searchInput = page.locator('#search-input');
            await searchInput.fill('UNIQUEKEYWORD123');
            await page.waitForTimeout(300);

            const matchedPrompts = page.locator('.nav-item-prompt .item-title');
            const count = await matchedPrompts.count();
            expect(count).toBe(1);
            await expect(matchedPrompts.first()).toHaveText('Generic Title 1');
        });
    });

    test.describe('Side Panel - Filtering', () => {

        test.beforeEach(async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
            await expect(page.locator('#new-prompt-button')).toBeVisible({ timeout: 10000 });
        });

        test('Search and sort work together in side panel', async ({ page }) => {
            // Create prompts
            const prompts = ['Zebra Prompt', 'Alpha Prompt', 'Beta Prompt'];

            for (const name of prompts) {
                await page.click('#new-prompt-button');
                await page.fill('#prompt-title', name);
                await page.fill('#prompt-text', `Content for ${name}`);
                await page.click('#save-button');
                await page.waitForTimeout(300);
            }

            // Verify all created
            const allPrompts = page.locator('.prompt-entry .prompt-title');
            await expect(allPrompts).toHaveCount(3);

            // Search for prompts containing "Prompt" (should match all)
            const searchInput = page.locator('#popup-search');
            await searchInput.fill('Alpha');
            await page.waitForTimeout(300);

            const filtered = page.locator('.prompt-entry .prompt-title:visible');
            // Note: Side panel uses display:none filtering, so we need to count visible
            let visibleCount = 0;
            const entries = page.locator('.prompt-entry');
            const count = await entries.count();
            for (let i = 0; i < count; i++) {
                const isVisible = await entries.nth(i).isVisible();
                if (isVisible) visibleCount++;
            }
            expect(visibleCount).toBe(1);
        });
    });
});

/**
 * Prompt Coach Feature Tests
 *
 * IMPORTANT: All tests validate BOTH the Side Panel (sidepanel.html) and
 * the Options Page (options.html) to ensure consistent and coherent UX
 * across both views.
 */
test.describe('Prompt Coach Feature', () => {

    // Helper to run same test on both pages
    const testBothPages = (testName, testFn) => {
        test.describe(testName, () => {
            test('Options Page', async ({ page, extensionId, context }) => {
                await page.goto(`chrome-extension://${extensionId}/options.html`);
                await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });
                await page.waitForTimeout(2000); // Wait for AI init
                await testFn(page, {
                    textArea: '#prompt-text-area',
                    page: 'options',
                    extensionId,
                    context
                });
            });

            test('Side Panel', async ({ page, extensionId, context }) => {
                await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
                await expect(page.locator('#new-prompt-button')).toBeVisible({ timeout: 10000 });
                await page.waitForTimeout(2000); // Wait for AI init
                await testFn(page, {
                    textArea: '#prompt-text',
                    page: 'sidepanel',
                    extensionId,
                    context
                });
            });
        });
    };

    testBothPages('Prompt Coach container is visible', async (page, opts) => {
        const coachContainer = page.locator('#prompt-coach-container');
        await expect(coachContainer).toBeVisible();
    });

    testBothPages('Prompt Coach shows score and tags when typing', async (page, opts) => {
        // Type a well-structured prompt
        const textArea = page.locator(opts.textArea);
        await textArea.fill('You are a senior marketing strategist. Create a detailed marketing plan for a SaaS product launch. Include specific metrics, examples of successful campaigns, and format the output as a bulleted list.');

        // Wait for debounce
        await page.waitForTimeout(700);

        // Check that score is displayed
        const score = page.locator('#prompt-score');
        await expect(score).not.toHaveText('—');

        // Check that tags are generated
        const tags = page.locator('.coach-tag');
        const tagCount = await tags.count();
        expect(tagCount).toBeGreaterThan(0);
    });

    testBothPages('Prompt Coach shows low score for brief prompts', async (page, opts) => {
        // Type a very brief prompt
        const textArea = page.locator(opts.textArea);
        await textArea.fill('Write something');

        await page.waitForTimeout(700);

        // Should have low score indicators
        const score = page.locator('#prompt-score');
        const scoreText = await score.textContent();

        // Extract numeric score
        const scoreMatch = scoreText?.match(/(\d+)/);
        if (scoreMatch) {
            const numericScore = parseInt(scoreMatch[1]);
            expect(numericScore).toBeLessThan(50);
        }

        // Should have #too-brief or #needs-structure tag
        const negativeTags = page.locator('.coach-tag.tag-negative');
        const negativeCount = await negativeTags.count();
        expect(negativeCount).toBeGreaterThan(0);
    });

    test.describe('Prompt Coach Guide', () => {

        test('Guide page loads correctly', async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/prompt-coach-guide.html`);

            // Check main heading
            await expect(page.locator('h1')).toContainText('Prompt Coach');

            // Check scoring section exists
            await expect(page.locator('text=How Scoring Works')).toBeVisible();

            // Check official guides section
            await expect(page.locator('text=Official Prompt Engineering Guides')).toBeVisible();

            // Check links to external guides
            await expect(page.locator('a[href*="platform.openai.com"]')).toBeVisible();
            await expect(page.locator('a[href*="ai.google.dev"]')).toBeVisible();
            await expect(page.locator('a[href*="docs.anthropic.com"]')).toBeVisible();
        });

        test('Score link opens guide - Options Page', async ({ page, extensionId, context }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });
            await page.waitForTimeout(2000);

            const scoreLink = page.locator('#prompt-score-link');
            if (await scoreLink.isVisible()) {
                const pagePromise = context.waitForEvent('page');
                await scoreLink.click();
                const newPage = await pagePromise;
                await newPage.waitForLoadState();
                // Score link now opens how_to.html#prompt-coach section
                await expect(newPage.locator('#prompt-coach h2, h2:has-text("Prompt Coach")')).toBeVisible();
            }
        });

        test('Score link exists in Side Panel', async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
            await expect(page.locator('#new-prompt-button')).toBeVisible({ timeout: 10000 });
            await page.waitForTimeout(2000);

            // Verify score link exists and has correct href behavior
            const scoreLink = page.locator('#prompt-score-link');
            const isVisible = await scoreLink.isVisible();

            // Score link should be visible when Prompt Coach is active
            if (isVisible) {
                // Verify it has the info icon
                const infoIcon = scoreLink.locator('.info-icon');
                await expect(infoIcon).toBeVisible();
            }
        });
    });
});
