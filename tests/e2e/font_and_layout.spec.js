import { test, expect } from './fixtures';

test.describe('Editor font size and layout', () => {
    test('Footer stats show words, chars and size', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        // Create a simple prompt
        await page.locator('#new-prompt-btn').click();
        await page.locator('#prompt-title-input').fill('Stats Test Prompt');
        await page.locator('#prompt-text-area').fill('one two three four five');
        await page.locator('#save-btn').click();

        // Select it to ensure stats update
        await page.locator('.nav-item', { hasText: 'Stats Test Prompt' }).click();

        const footerWordCount = page.locator('#footer-word-count');
        const footerCharCount = page.locator('#footer-char-count');
        const footerSize = page.locator('#footer-storage-used');

        await expect(footerWordCount).toHaveText('Words: 5');
        await expect(footerCharCount).toContainText('Chars:');
        await expect(footerSize).toContainText('Size:');
    });

    test('Font size control adjusts editor and preview, propagates to side panel', async ({ page, extensionId, context }) => {
        // Open options and set a distinctive font size
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        const fontDisplay = page.locator('#font-size-display');
        const preset = page.locator('#font-size-preset');

        await preset.selectOption('18');
        await expect(fontDisplay).toHaveText('18px');

        // Editor textarea should reflect via computed style
        const editor = page.locator('#prompt-text-area');
        await expect(editor).toHaveCSS('font-size', /18px/);

        // Open a new sidepanel.html tab to verify it picked up the same size
        const sidepanelPage = await context.newPage();
        await sidepanelPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);
        const sideText = sidepanelPage.locator('#prompt-text');
        await expect(sideText).toHaveCSS('font-size', /18px/);
    });

    test('Right sidebar is scrollable and resizable', async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);

        const sidebar = page.locator('#sidebar-right');
        const handle = page.locator('#editor-right-resize-handle');

        const initialWidth = await sidebar.boundingBox().then(b => b?.width ?? 0);

        // Drag handle a bit to the left
        const box = await handle.boundingBox();
        if (!box) throw new Error('Resize handle not found');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x - 40, box.y + box.height / 2);
        await page.mouse.up();

        const newWidth = await sidebar.boundingBox().then(b => b?.width ?? 0);
        expect(newWidth).toBeGreaterThan(0);
        expect(newWidth).not.toBe(initialWidth);

        // Ensure sidebar content can scroll
        await sidebar.evaluate((el) => { el.scrollTop = el.scrollHeight; });
        const scrollTop = await sidebar.evaluate(el => el.scrollTop);
        expect(scrollTop).toBeGreaterThan(0);
    });
});


