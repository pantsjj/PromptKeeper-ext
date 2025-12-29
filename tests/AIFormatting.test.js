// Test just the meta-prompt assembly by invoking the internal helper via a small wrapper
describe('AIService prompt formatting meta-prompt', () => {
    test('magic_enhance meta-prompt forbids personal names and uses markdown rules', async () => {
        // Use the existing jsdom + setup.js environment and override ai.languageModel.create
        const promptSpy = jest.fn().mockResolvedValue('OUTPUT');
        const session = { prompt: promptSpy, destroy: jest.fn() };

        global.window.ai = global.window.ai || {};
        global.window.ai.languageModel = {
            ...(global.window.ai.languageModel || {}),
            capabilities: jest.fn().mockResolvedValue({ available: 'readily' }),
            create: jest.fn().mockResolvedValue(session)
        };

        const { default: AIService } = await import('../services/AIService.js');

        const resultPromise = AIService.refinePrompt('test prompt', 'magic_enhance');

        expect(global.window.ai.languageModel.create).toHaveBeenCalledWith(
            expect.objectContaining({
                expectedContext: 'en',
                outputLanguage: 'en'
            })
        );

        const result = await resultPromise;
        expect(result).toEqual('OUTPUT');

        const metaPrompt = promptSpy.mock.calls[0][0];
        expect(metaPrompt).toContain('Do NOT invent or include any personal names');
        expect(metaPrompt).toContain('wrap that placeholder text in single backticks');
        expect(metaPrompt).toContain('format each option as a level-1 markdown heading');
    });
});

