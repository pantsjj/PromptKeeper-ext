
import { test, expect } from './fixtures';

test.describe('End-to-End User Journey', () => {

    test.beforeEach(async ({ page, extensionId }) => {
        // Load the options page from the extension
        await page.goto(`chrome-extension://${extensionId}/options.html`);
    });

    test('Full User Journey: Create Workspace -> Create Prompt -> Switch -> Verify', async ({ page }) => {
        // 1. Create a New Workspace using the Modal
        const addBtn = page.locator('#add-project-btn');
        // Ensure scripts loaded
        await expect(addBtn).toBeVisible({ timeout: 10000 });

        await addBtn.click();

        // Wait for modal
        const modal = page.locator('#modal-overlay');
        await expect(modal).not.toHaveClass(/hidden/);
        await expect(page.locator('#modal-title')).toHaveText('New Workspace');

        // Fill modal
        await page.fill('#modal-input-name', 'Journey Workspace');
        await page.fill('#modal-input-desc', 'Testing end to end journey');
        await page.click('#modal-confirm-btn');

        // Verify Workspace is created and active
        const workspaceItem = page.locator('.nav-item', { hasText: 'Journey Workspace' });
        await expect(workspaceItem).toBeVisible();
        await expect(page.locator('#project-label')).toHaveText('Workspace: Journey Workspace');

        // 2. Create a New Prompt in this Workspace
        await page.click('#new-prompt-btn');
        const titleInput = page.locator('#prompt-title-input');
        await expect(titleInput).toBeVisible();

        await titleInput.fill('My First Prompt');
        await page.fill('#prompt-text-area', 'This is the content of my first prompt.');

        // Save
        await page.click('#save-btn');
        // Visual feedback check (pulse-green is hard to catch, but we verify list update)

        // Verify prompt appears in list
        const promptItem = page.locator('.nav-item-prompt', { hasText: 'My First Prompt' });
        await expect(promptItem).toBeVisible();

        // 3. Switch Workspaces (go to All then back)
        await page.click('#workspace-all');
        await expect(page.locator('#project-label')).toHaveText('Workspace: All Prompts');
        // Prompt should still be visible because All shows all
        await expect(promptItem).toBeVisible();

        // Go back to specific workspace
        await workspaceItem.click();
        await expect(page.locator('#project-label')).toHaveText('Workspace: Journey Workspace');
        await expect(promptItem).toBeVisible();

        // 4. Edit Prompt
        await promptItem.click();
        await page.fill('#prompt-text-area', 'Updated content for my prompt.');

        // Keyboard shortcut save (Meta+S)
        await page.keyboard.press('Meta+s');

        // Check word count update to verify logic ran
        // "Updated content for my prompt." = 5 words
        await expect(page.locator('#word-count')).toContainText('Words: 5');

    });

    test('Cancel Modal should not create workspace', async ({ page }) => {
        await page.click('#add-project-btn');
        await expect(page.locator('#modal-overlay')).toBeVisible();

        await page.fill('#modal-input-name', 'Cancelled Workspace');
        await page.click('#modal-cancel-btn');

        await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);
        // Wait a bit to ensure it doesn't appear
        await page.waitForTimeout(500);
        await expect(page.locator('.nav-item', { hasText: 'Cancelled Workspace' })).not.toBeVisible();
    });
});
