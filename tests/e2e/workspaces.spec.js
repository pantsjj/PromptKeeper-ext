import { test, expect } from './fixtures';

test.describe('Workspace Management', () => {

    test.beforeEach(async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);
    });

    test('Inline Creation: Create valid workspace', async ({ page }) => {
        const addBtn = page.locator('#add-project-btn');
        await expect(addBtn).toBeVisible();
        await addBtn.click();

        // Expect inline input
        const input = page.locator('#new-project-input');
        await expect(input).toBeVisible();
        await expect(input).toBeFocused();

        // Type valid name
        await input.fill('test_project');
        await page.keyboard.press('Enter');

        // Verify creation
        const item = page.locator('.nav-item', { hasText: 'test_project' });
        await expect(item).toBeVisible();
        await expect(input).not.toBeVisible();

        // Check active state logic (it should auto-switch)
        await expect(item).toHaveClass(/active/);
    });

    test('Inline Creation: Validation (snake_case conversion)', async ({ page }) => {
        await page.locator('#add-project-btn').click();
        const input = page.locator('#new-project-input');

        // Input with spaces and caps
        await input.fill('My Cool Project');
        await page.keyboard.press('Enter');

        // Should convert to my_cool_project
        const item = page.locator('.nav-item', { hasText: 'my_cool_project' });
        await expect(item).toBeVisible();
    });

    test('Inline Creation: Enforce max words', async ({ page }) => {
        // Mock window.alert
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Max 3 words allowed');
            await dialog.dismiss();
        });

        await page.locator('#add-project-btn').click();
        const input = page.locator('#new-project-input');

        // 4 words
        await input.fill('one two three four');
        await page.keyboard.press('Enter');

        // Input should still be there (not submitted)
        await expect(input).toBeVisible();
    });

    test('Inline Creation: Escape cancels', async ({ page }) => {
        await page.locator('#add-project-btn').click();
        const input = page.locator('#new-project-input');

        await input.fill('cancelled_proj');
        await page.keyboard.press('Escape');

        await expect(input).not.toBeVisible();
        await expect(page.locator('.nav-item', { hasText: 'cancelled_proj' })).not.toBeVisible();
    });
});
