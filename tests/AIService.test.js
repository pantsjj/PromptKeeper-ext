import AIService from '../services/AIService.js';

describe('AIService with Offscreen', () => {
    beforeEach(() => {
        // Mock chrome APIs
        global.chrome = {
            runtime: {
                sendMessage: jest.fn(),
                lastError: null
            }
        };
        // Force offscreen/bridge path by disabling local detection
        delete global.window.LanguageModel;
        delete global.window.ai;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getAvailability returns correct status', async () => {
        // Mock runtime.sendMessage for broadcast
        global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
            if (message.action === 'checkAIAvailability') {
                if (typeof callback === 'function') callback({ available: 'readily' });
            }
        });

        const status = await AIService.getAvailability();

        expect(status).toBe('readily');
        expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
            { action: 'checkAIAvailability' },
            expect.any(Function)
        );
    });

    test('getAvailability handles errors gracefully', async () => {
        jest.useFakeTimers();
        global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
            // Simulate missing offscreen (connection error) by setting lastError
            global.chrome.runtime.lastError = { message: 'Could not establish connection' };
            if (typeof callback === 'function') setTimeout(() => callback(undefined), 10);
        });

        const statusPromise = AIService.getAvailability();

        // Fast-forward through retries
        // Total retry wait is approx 500 + 1000 + 1500 + 1000 (healing) = ~4000ms
        await jest.advanceTimersByTimeAsync(5000);

        const status = await statusPromise;
        expect(status).toBe('no');
        jest.useRealTimers();
    });

    test('getDiagnostic returns diagnostic string', async () => {
        global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
            if (message.action === 'getDiagnostic') {
                if (typeof callback === 'function') callback({ diagnostic: 'PromptAPI:readily' }); // mock return obj
            }
        });

        const diag = await AIService.getDiagnostic();
        expect(diag).toBe(' | Offscreen: PromptAPI:readily');
    });

    test('getDetailedStatus returns status object', async () => {
        global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
            if (typeof callback === 'function') {
                callback({
                    prompt: 'readily',
                    rewriter: 'readily'
                });
            }
        });

        const status = await AIService.getDetailedStatus();
        expect(status.prompt).toBe('readily');
        expect(status.rewriter).toBe('readily');
    });

    test('refinePrompt sends correct message and returns result', async () => {
        global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
            if (typeof callback === 'function') {
                callback({
                    success: true,
                    result: 'Refined prompt text'
                });
            }
        });

        const result = await AIService.refinePrompt('test prompt', 'formalize');

        expect(result).toBe('Refined prompt text');
        expect(global.chrome.runtime.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'refinePrompt',
                promptText: 'test prompt',
                refinementType: 'formalize',
                requestId: expect.any(String),
                stream: false
            }),
            expect.any(Function)
        );
    });

    test('refinePrompt handles runtime.lastError (retries then healing)', async () => {
        // We need to simulate retries. 
        // 1. First call fails (connection error)
        // 2. Second call fails
        // 3. Third call fails
        // 4. Healing call
        // 5. Final attempt fails or succeeds

        // To keep test simple and fast, we can verify that it attempts to retry.
        // Or we can mock the sendMessage to succeed on the 2nd attempt.

        let attempt = 0;
        global.chrome.runtime.sendMessage.mockImplementation((message, callback) => {
            attempt++;
            if (attempt === 1) {
                global.chrome.runtime.lastError = { message: 'Could not establish connection' };
                if (typeof callback === 'function') callback(undefined);
            } else {
                global.chrome.runtime.lastError = null;
                if (typeof callback === 'function') callback({ success: true, result: 'Recovered' });
            }
        });

        const result = await AIService.refinePrompt('test', 'formalize');
        expect(result).toBe('Recovered');
        expect(attempt).toBe(2);
    });
    test('refinePrompt passes language options when running locally', async () => {
        // Mock window.LanguageModel
        const mockPrompt = jest.fn().mockResolvedValue('Local response');
        const mockCreate = jest.fn().mockResolvedValue({
            prompt: mockPrompt,
            destroy: jest.fn()
        });

        global.window.LanguageModel = {
            create: mockCreate
        };

        // Ensure PKBuiltinAI doesn't interfere (force fallback to LanguageModel logic in _runLocally)
        delete global.window.PKBuiltinAI;

        await AIService.refinePrompt('test', 'formalize');

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            outputLanguage: 'en',
            expectedOutputLanguage: 'en'
        }));
    });
});
