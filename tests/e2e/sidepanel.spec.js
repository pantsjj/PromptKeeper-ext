
import { test, expect } from './fixtures';

test.describe('Side Panel', () => {

    test.beforeEach(async ({ page, extensionId }) => {
        // Navigate to the sidepanel.html directly
        await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    });

    test('Side Panel layout and components', async ({ page }) => {
        // 1. Verify search bar exists
        const searchInput = page.locator('#popup-search');
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toHaveAttribute('placeholder', 'Search prompts...');

        // 2. Verify sidebar sections exist
        const workspaceToggle = page.locator('#workspace-toggle');
        await expect(workspaceToggle).toBeVisible();

        const promptsToggle = page.locator('#prompts-toggle');
        await expect(promptsToggle).toBeVisible();

        const workspaceList = page.locator('#workspace-list');
        await expect(workspaceList).toBeVisible();

        const promptList = page.locator('#prompt-list');
        await expect(promptList).toBeVisible();

        // 3. Verify editor elements
        const titleInput = page.locator('#prompt-title');
        await expect(titleInput).toBeVisible();

        const textArea = page.locator('#prompt-text');
        await expect(textArea).toBeVisible();

        // 4. Verify action buttons
        await expect(page.locator('#new-prompt-button')).toBeVisible();
        await expect(page.locator('#save-button')).toBeVisible();
        await expect(page.locator('#delete-prompt-button')).toBeVisible();
        await expect(page.locator('#paste-prompt-button')).toBeVisible();

        // 5. Verify Google sign-in section
        await expect(page.locator('#google-signin-btn')).toBeVisible();
        await expect(page.locator('#drive-signed-out')).toBeVisible();
        await expect(page.locator('#drive-signed-in')).toHaveClass(/hidden/);

        // 6. Verify footer elements
        const footer = page.locator('footer#stats');
        await expect(footer).toBeVisible();

        await expect(page.locator('#word-count')).toBeVisible();
        await expect(page.locator('#version-selector')).toBeVisible();
        await expect(page.locator('#storage-used')).toBeVisible();
        await expect(page.locator('#backup-link')).toBeVisible();
        await expect(page.locator('#restore-link')).toBeVisible();
        await expect(page.locator('#open-full-editor-link')).toBeVisible();
    });

    test('Editor interactivity', async ({ page }) => {
        // 1. Type in title input
        const titleInput = page.locator('#prompt-title');
        await titleInput.fill('Test Prompt Title');
        await expect(titleInput).toHaveValue('Test Prompt Title');

        // 2. Type in text area
        const textArea = page.locator('#prompt-text');
        await textArea.fill('This is some test prompt content for verification.');
        await expect(textArea).toHaveValue('This is some test prompt content for verification.');

        // 3. Verify sidebar sections are visible by default (not collapsed)
        const workspacesSection = page.locator('#workspaces-section');
        await expect(workspacesSection).toBeVisible();

        const promptsSection = page.locator('#prompts-section');
        await expect(promptsSection).toBeVisible();

        // 4. Verify buttons are clickable (UI interaction, no side effects expected in this test)
        const saveButton = page.locator('#save-button');
        await expect(saveButton).toBeEnabled();

        const newButton = page.locator('#new-prompt-button');
        await expect(newButton).toBeEnabled();

        const deleteButton = page.locator('#delete-prompt-button');
        await expect(deleteButton).toBeEnabled();

        const pasteButton = page.locator('#paste-prompt-button');
        await expect(pasteButton).toBeEnabled();
    });

    test('Sidebar controls: plus buttons and chevrons visible in side panel', async ({ page }) => {
        const workspaceHeader = page.locator('#workspace-toggle');
        const promptsHeader = page.locator('#prompts-toggle');

        const workspacePlus = workspaceHeader.locator('#add-project-btn');
        const workspaceChevron = workspaceHeader.locator('.section-toggle');
        const promptsPlus = promptsHeader.locator('#add-prompt-btn-sidebar');
        const promptsChevron = promptsHeader.locator('.section-toggle');

        await expect(workspacePlus).toBeVisible();
        await expect(workspaceChevron).toBeVisible();
        await expect(promptsPlus).toBeVisible();
        await expect(promptsChevron).toBeVisible();
    });

    test('Collapsible sections toggle correctly in side panel', async ({ page }) => {
        const workspaceHeader = page.locator('#workspace-toggle');
        const promptsHeader = page.locator('#prompts-toggle');

        const workspacesSection = page.locator('#workspaces-section');
        const promptsSection = page.locator('#prompts-section');

        const workspaceTitle = workspaceHeader.locator('.section-title');
        const workspaceChevron = workspaceHeader.locator('.section-toggle');
        const promptsTitle = promptsHeader.locator('.section-title');
        const promptsChevron = promptsHeader.locator('.section-toggle');

        // Initially not collapsed
        await expect(workspacesSection).not.toHaveClass(/collapsed/);
        await expect(promptsSection).not.toHaveClass(/collapsed/);

        // Workspace: toggle via title
        await workspaceTitle.click();
        await expect(workspacesSection).toHaveClass(/collapsed/);

        // Workspace: toggle back via chevron
        await workspaceChevron.click();
        await expect(workspacesSection).not.toHaveClass(/collapsed/);

        // Prompts: toggle via title
        await promptsTitle.click();
        await expect(promptsSection).toHaveClass(/collapsed/);

        // Prompts: toggle back via chevron
        await promptsChevron.click();
        await expect(promptsSection).not.toHaveClass(/collapsed/);

        // Plus buttons should not collapse when clicked
        const workspacePlus = workspaceHeader.locator('#add-project-btn');
        const promptsPlus = promptsHeader.locator('#add-prompt-btn-sidebar');

        await workspacePlus.click();
        await expect(workspacesSection).not.toHaveClass(/collapsed/);

        await promptsPlus.click();
        await expect(promptsSection).not.toHaveClass(/collapsed/);
    });

    test('Revision dropdown updates immediately after saving multiple times in side panel', async ({ page }) => {
        const titleInput = page.locator('#prompt-title');
        const textArea = page.locator('#prompt-text');
        const saveButton = page.locator('#save-button');
        const versionSelect = page.locator('#version-selector');

        // Create a new prompt
        await page.locator('#new-prompt-button').click();
        await titleInput.fill('Revision Test');
        await textArea.fill('v1');
        await saveButton.click();

        // Save a second version
        // Save defaults to preview mode, so switch back to edit
        await page.click('#toggle-preview-btn');
        await textArea.fill('v2');
        await saveButton.click();

        // Save a third version
        await page.click('#toggle-preview-btn');
        await textArea.fill('v3');
        await saveButton.click();

        // Revision dropdown should list at least 3 versions without reselecting from the list
        const options = versionSelect.locator('option');
        await expect(await options.count()).toBeGreaterThan(2);
    });

    test('Responsive Layout Check', async ({ page }) => {
        // 1. Check layout at normal width
        await page.setViewportSize({ width: 500, height: 600 });

        const sidebar = page.locator('#sidebar');
        const editorPanel = page.locator('#editor-panel');

        await expect(sidebar).toBeVisible();
        await expect(editorPanel).toBeVisible();

        // 2. Check that main elements remain accessible at narrow width
        await page.setViewportSize({ width: 350, height: 600 });

        // All key elements should still be visible
        await expect(page.locator('#popup-search')).toBeVisible();
        await expect(page.locator('#prompt-title')).toBeVisible();
        await expect(page.locator('#prompt-text')).toBeVisible();
        await expect(page.locator('footer#stats')).toBeVisible();
    });
});
