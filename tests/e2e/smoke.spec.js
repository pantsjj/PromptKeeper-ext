
import { test, expect } from './fixtures';

test('Extension loads and popup opens', async ({ page, extensionId }) => {
    // 1. Navigate to the extension popup or options page
    // Note: Extensions often don't allow direct navigation to popup.html in a tab,
    // but options.html is usually accessible.
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // 2. Check title
    await expect(page).toHaveTitle(/PromptKeeper/);

    // 3. Verify key UI elements exist
    // Sidebar should be present
    const sidebar = page.locator('#sidebar-left');
    await expect(sidebar).toBeVisible();

    // Footer status should be present
    const footer = page.locator('footer#stats');
    await expect(footer).toBeVisible();
});
