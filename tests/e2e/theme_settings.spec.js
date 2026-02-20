
import { test, expect } from './fixtures';

/**
 * Theme Settings Tests
 *
 * Tests the theme toggle functionality (Light/Dark/Auto) that ensures
 * consistency between the options page and side panel.
 */

test.describe('Theme Settings', () => {

    test.describe('Options Page', () => {

        test.beforeEach(async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });
        });

        test('Theme controls are visible in OPTIONS section', async ({ page }) => {
            // Theme control buttons should be visible
            const themeLight = page.locator('#theme-light');
            const themeDark = page.locator('#theme-dark');
            const themeAuto = page.locator('#theme-auto');

            await expect(themeLight).toBeVisible();
            await expect(themeDark).toBeVisible();
            await expect(themeAuto).toBeVisible();

            // Verify button text
            await expect(themeLight).toContainText('Light');
            await expect(themeDark).toContainText('Dark');
            await expect(themeAuto).toContainText('Auto');
        });

        test('Default theme is Auto', async ({ page }) => {
            const themeAuto = page.locator('#theme-auto');
            await expect(themeAuto).toHaveClass(/active/);

            // No theme class on html element for auto mode
            const html = page.locator('html');
            await expect(html).not.toHaveClass(/theme-light/);
            await expect(html).not.toHaveClass(/theme-dark/);
        });

        test('Selecting Light theme applies theme-light class', async ({ page }) => {
            const themeLight = page.locator('#theme-light');
            await themeLight.click();

            // Button should be active
            await expect(themeLight).toHaveClass(/active/);

            // HTML should have theme-light class
            const html = page.locator('html');
            await expect(html).toHaveClass(/theme-light/);
            await expect(html).not.toHaveClass(/theme-dark/);
        });

        test('Selecting Dark theme applies theme-dark class', async ({ page }) => {
            const themeDark = page.locator('#theme-dark');
            await themeDark.click();

            // Button should be active
            await expect(themeDark).toHaveClass(/active/);

            // HTML should have theme-dark class
            const html = page.locator('html');
            await expect(html).toHaveClass(/theme-dark/);
            await expect(html).not.toHaveClass(/theme-light/);
        });

        test('Selecting Auto theme removes theme classes', async ({ page }) => {
            // First set to dark
            await page.locator('#theme-dark').click();
            await expect(page.locator('html')).toHaveClass(/theme-dark/);

            // Then switch to auto
            const themeAuto = page.locator('#theme-auto');
            await themeAuto.click();

            // Button should be active
            await expect(themeAuto).toHaveClass(/active/);

            // HTML should not have forced theme classes
            const html = page.locator('html');
            await expect(html).not.toHaveClass(/theme-light/);
            await expect(html).not.toHaveClass(/theme-dark/);
        });

        test('Theme preference persists after reload', async ({ page, extensionId }) => {
            // Set to dark theme
            await page.locator('#theme-dark').click();
            await expect(page.locator('html')).toHaveClass(/theme-dark/);

            // Reload the page
            await page.reload();
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });

            // Theme should still be dark
            await expect(page.locator('html')).toHaveClass(/theme-dark/);
            await expect(page.locator('#theme-dark')).toHaveClass(/active/);
        });
    });

    test.describe('Side Panel Theme Sync', () => {

        test('Theme set in options syncs to side panel', async ({ page, extensionId, context }) => {
            // Set theme to dark in options page
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });
            await page.locator('#theme-dark').click();

            // Open side panel in new page
            const sidePanelPage = await context.newPage();
            await sidePanelPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);
            await expect(sidePanelPage.locator('#new-prompt-button')).toBeVisible({ timeout: 10000 });

            // Side panel should have dark theme
            await expect(sidePanelPage.locator('html')).toHaveClass(/theme-dark/);
        });

        test('Side panel loads with persisted theme preference', async ({ page, extensionId }) => {
            // First set theme in options
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });
            await page.locator('#theme-light').click();

            // Navigate to side panel
            await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
            await expect(page.locator('#new-prompt-button')).toBeVisible({ timeout: 10000 });

            // Should have light theme
            await expect(page.locator('html')).toHaveClass(/theme-light/);
        });
    });

    test.describe('Keyboard Shortcut Settings', () => {

        test('Keyboard shortcut settings link is visible', async ({ page, extensionId }) => {
            await page.goto(`chrome-extension://${extensionId}/options.html`);
            await expect(page.locator('#new-prompt-btn')).toBeVisible({ timeout: 10000 });

            const shortcutLink = page.locator('#open-shortcuts-link');
            await expect(shortcutLink).toBeVisible();
            await expect(shortcutLink).toContainText('Configure in Chrome Settings');
        });
    });
});
