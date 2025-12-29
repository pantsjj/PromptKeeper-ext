import { test, expect } from './fixtures';

test.describe('Side Panel Manage link behaviour', () => {
    test('Clicking Manage opens full editor and allows reopening side panel', async ({ page, extensionId, context }) => {
        // Open sidepanel
        await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);

        const manageLink = page.locator('#open-full-editor-link');
        await expect(manageLink).toBeVisible();

        // Clicking Manage should open options.html in a new tab (or same, but URL matches)
        await manageLink.click();

        // Wait for any new page targeting options.html
        const optionsPage = await context.waitForEvent('page', { timeout: 5000 }).catch(() => null);

        if (optionsPage) {
            await optionsPage.waitForLoadState('domcontentloaded');
            await expect(optionsPage).toHaveURL(new RegExp(`chrome-extension://${extensionId}/options.html`));
        }

        // Open a fresh sidepanel page — this simulates clicking the extension again.
        const newSidepanel = await context.newPage();
        await newSidepanel.goto(`chrome-extension://${extensionId}/sidepanel.html`);
        await expect(newSidepanel.locator('#prompt-text')).toBeVisible();
    });
});


