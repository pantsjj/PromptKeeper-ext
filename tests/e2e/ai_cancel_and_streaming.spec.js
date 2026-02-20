import { test, expect } from './fixtures';

test.describe('AI Streaming + Cancel', () => {
  test('Options: cancel reverts editor content and does not mark unsaved', async ({ page, extensionId }) => {
    await page.addInitScript(() => {
      window.LanguageModel = {
        availability: async () => 'readily',
        create: async () => ({
          promptStreaming: async function* (_input, opts) {
            const signal = opts?.signal;
            const chunks = ['PART1 ', 'PART2 ', 'PART3'];
            for (const c of chunks) {
              if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
              await new Promise(r => setTimeout(r, 50));
              yield c;
            }
          },
          prompt: async () => 'FINAL',
          destroy: () => {}
        })
      };
    });

    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Create prompt
    await page.locator('#new-prompt-btn').click();
    await page.locator('#prompt-title-input').fill('Cancel Test');
    const editor = page.locator('#prompt-text-area');
    await editor.fill('ORIGINAL');
    await page.locator('#save-btn').click();

    const magicBtn = page.locator('.refine-btn[data-type="magic_enhance"]');
    await magicBtn.click();

    // Button should flip to Stop quickly (indicates AI is running)
    await expect(magicBtn).toHaveText(/Stop/i);

    // Cancel while streaming
    await magicBtn.click();

    // Editor should revert to original text (no partial remnants)
    await expect(editor).toHaveValue('ORIGINAL');
    await expect(editor).not.toHaveClass(/unsaved-glow/);
  });
});


