import AIService from '../services/AIService.js';

describe('AIService with Hidden Tab', () => {
    beforeEach(() => {
        // Mock chrome APIs
        global.chrome = {
            runtime: {
                sendMessage: jest.fn().mockResolvedValue({ tabId: 123 }),
                lastError: null
            },
            tabs: {
                sendMessage: jest.fn()
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getAvailability returns correct status', async () => {
        // Mock tabs.sendMessage for AI check
        global.chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
            callback({ available: 'readily' });
        });

        const status = await AIService.getAvailability();

        expect(status).toBe('readily');
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
            123,
            { action: 'checkAIAvailability' },
            expect.any(Function)
        );
    });

    test('getAvailability handles errors gracefully', async () => {
        global.chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
            global.chrome.runtime.lastError = { message: 'Tab not ready' };
            callback(null);
        });

        const status = await AIService.getAvailability();

        expect(status).toBe('no');
    });

    test('getDiagnostic returns diagnostic string', async () => {
        global.chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
            callback('PromptAPI:readily RewriterAPI:Present');
        });

        const diag = await AIService.getDiagnostic();

        expect(diag).toContain('PromptAPI:readily');
    });

    test('getDetailedStatus returns status object', async () => {
        global.chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
            callback({
                prompt: 'readily',
                rewriter: 'readily',
                summarizer: 'no'
            });
        });

        const status = await AIService.getDetailedStatus();

        expect(status.prompt).toBe('readily');
        expect(status.rewriter).toBe('readily');
    });

    test('refinePrompt sends correct message and returns result', async () => {
        global.chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
            callback({
                success: true,
                result: 'Refined prompt text'
            });
        });

        const result = await AIService.refinePrompt('test prompt', 'formalize');

        expect(result).toBe('Refined prompt text');
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
            123,
            {
                action: 'refinePrompt',
                promptText: 'test prompt',
                refinementType: 'formalize'
            },
            expect.any(Function)
        );
    });

    test('refinePrompt throws error on failure', async () => {
        global.chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
            callback({
                success: false,
                error: 'AI model not available'
            });
        });

        await expect(
            AIService.refinePrompt('test', 'formalize')
        ).rejects.toThrow('AI model not available');
    });

    test('handles chrome.runtime.lastError in message passing', async () => {
        global.chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
            global.chrome.runtime.lastError = { message: 'Message port closed' };
            callback(null);
        });

        await expect(
            AIService.refinePrompt('test', 'formalize')
        ).rejects.toThrow('Message port closed');
    });
});
