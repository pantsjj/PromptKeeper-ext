
const { test, expect } = require('./fixtures');
const path = require('path');

test.describe('Workspace Lifecycle & Smart Deletion', () => {
    test.beforeEach(async ({ page, extensionId }) => {
        await page.goto(`chrome-extension://${extensionId}/options.html`);
        await page.waitForLoadState('networkidle');
    });

    test('Smart Delete: Tagging and Restore', async ({ page }) => {
        const workspaceName = 'finance_restore';

        // 1. Create Workspace "finance_restore"
        await page.locator('#add-project-btn').click();
        const input = page.locator('#new-project-input');
        await input.fill(workspaceName);
        await page.keyboard.press('Enter');

        // Verify created
        const wsItem = page.locator(`.nav-item:has-text("${workspaceName}")`);
        await expect(wsItem).toBeVisible();
        await wsItem.click();

        // 2. Add a Prompt to this workspace
        const newPromptBtn = page.locator('#new-prompt-btn');
        await expect(newPromptBtn).toBeVisible();
        await newPromptBtn.click();
        await newPromptBtn.click();
        await page.locator('#prompt-title-input').fill('Budget Prompt');
        await page.locator('#prompt-text-area').fill('Analyze Q4 budget');
        await page.locator('#save-btn').click();

        // Verify prompt is visible in this workspace
        await wsItem.click(); // Click again to ensure list refresh
        await expect(page.locator('.nav-item-prompt:has-text("Budget Prompt")')).toBeVisible();

        // 3. Delete Workspace (Right-click context menu)
        // Handle confirm dialog
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Prompts will NOT be deleted');
            await dialog.accept();
        });

        await wsItem.click({ button: 'right' });
        const deleteOption = page.locator('#ctx-delete-workspace');
        await expect(deleteOption).toBeVisible();
        await deleteOption.click();

        // Verify workspace is gone
        await expect(wsItem).not.toBeVisible();

        // 4. Verify Prompt is ORPHANED (Visible in All Prompts)
        const allPrompts = page.locator('.nav-item[data-id="all"]');
        await allPrompts.click();
        const orphanPrompt = page.locator('.nav-item-prompt:has-text("Budget Prompt")');
        await expect(orphanPrompt).toBeVisible();

        // (Optional: Verification of tag UI would occur here if we exposed tags in the list)

        // 5. Restore: Create Workspace "finance_restore" again
        await page.locator('#add-project-btn').click();
        const restoreInput = page.locator('#new-project-input');
        await restoreInput.fill(workspaceName);
        await page.keyboard.press('Enter');

        // 6. Verify Prompt is RECLAIMED
        // Click the new workspace
        const newWsItem = page.locator(`.nav-item:has-text("${workspaceName}")`).first();
        await newWsItem.click();

        // Prompt should be visible here now!
        await expect(page.locator('.nav-item-prompt:has-text("Budget Prompt")')).toBeVisible();
    });
});

