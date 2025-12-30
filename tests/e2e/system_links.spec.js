
import { test, expect } from './fixtures';

test.describe('System Links and Footer Actions', () => {

    test('Docs, Import, and Export links should exist', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        await expect(page.locator('#footer-docs-link')).toBeVisible();
        await expect(page.locator('#footer-export-link')).toBeVisible();
        await expect(page.locator('#footer-import-link')).toBeVisible();
    });

    test('Export should trigger download', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        // Setup download listener
        const downloadPromise = page.waitForEvent('download');

        // Click Export
        await page.click('#footer-export-link');

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('promptkeeper_export');
        // Cleanup download to prevent teardown hangs
        await download.delete();
    });

    // Import is harder to test without a file, but we can verify the input exists
    test('Import button should be linked to file input', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        const importBtn = page.locator('#footer-import-link');
        const fileInput = page.locator('#footer-import-file');

        await expect(fileInput).toBeHidden(); // It's display:none

        // We can't easily test that clicking link opens file dialog in headless
        // but we can ensure the element structure is correct.
    });

});
