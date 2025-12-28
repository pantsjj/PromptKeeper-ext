
import { test, expect } from './fixtures';

test.describe('End-to-End User Journey', () => {

    test.beforeEach(async ({ page, extensionId }) => {
        // Load the options page from the extension
        await page.goto(`chrome-extension://${extensionId}/options.html`);
    });

    test('Full User Journey: Create Workspace -> Create Prompt -> Switch -> Verify', async ({ page }) => {
        // 1. Create a New Workspace (Inline)
        const addBtn = page.locator('#add-project-btn');
        await expect(addBtn).toBeVisible({ timeout: 10000 });

        await addBtn.click();

        // Expect inline input
        const inlineInput = page.locator('#new-project-input');

        // Wait for input to be visible
        await expect(inlineInput).toBeVisible();
        await expect(inlineInput).toBeFocused();

        // Fill Input and Enter
        await inlineInput.fill('Journey Workspace');
        await page.keyboard.press('Enter');

        // Wait for list to update and input to disappear
        await expect(inlineInput).not.toBeVisible();

        // Verify Workspace is created and active
        // Logic enforces snake_case
        const workspaceItem = page.locator('.nav-item', { hasText: 'journey_workspace' });
        await expect(workspaceItem).toBeVisible();
        // Check active class logic instead of project-label text if that's more reliable, 
        // but label update should also work if options.js supports it.
        // Let's assume options page logic updates the label too or check active class.
        // await expect(page.locator('#project-label')).toHaveText('Workspace: journey_workspace'); 
        // Let's rely on list item presence for now.

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
        // Label likely reflects the project name exactly
        await expect(page.locator('#project-label')).toHaveText('Workspace: journey_workspace');
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

    test('Cancel Inline Creation should not create workspace', async ({ page }) => {
        await page.click('#add-project-btn');
        const inlineInput = page.locator('#new-project-input');

        await expect(inlineInput).toBeVisible();

        await inlineInput.fill('Cancelled Workspace');
        await page.keyboard.press('Escape');

        // Verify input is removed
        await expect(inlineInput).not.toBeVisible();
        // Wait a bit to ensure it doesn't appear
        await page.waitForTimeout(500);
        await expect(page.locator('.nav-item', { hasText: 'Cancelled Workspace' })).not.toBeVisible();
    });
});
