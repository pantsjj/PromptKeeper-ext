describe('PKBuiltinAI wrapper', () => {
  beforeEach(() => {
    jest.resetModules();
    // Reset globals
    global.window = global;
    delete global.window.PKBuiltinAI;
    delete global.window.LanguageModel;
    global.window.ai = { languageModel: {} };
  });

  test('getAvailability uses window.LanguageModel.availability when present', async () => {
    global.window.LanguageModel = {
      availability: jest.fn().mockResolvedValue('available'),
      create: jest.fn(),
    };

    require('../builtin-ai.js');

    const status = await global.window.PKBuiltinAI.getAvailability();
    expect(status).toBe('available');
    expect(global.window.LanguageModel.availability).toHaveBeenCalled();
  });

  test('getAvailability uses window.ai.languageModel.capabilities when LanguageModel is absent', async () => {
    global.window.ai.languageModel.capabilities = jest.fn().mockResolvedValue({ available: 'readily' });
    global.window.ai.languageModel.create = jest.fn();

    require('../builtin-ai.js');

    const status = await global.window.PKBuiltinAI.getAvailability();
    expect(status).toBe('readily');
    expect(global.window.ai.languageModel.capabilities).toHaveBeenCalled();
  });

  test('createSession prefers window.LanguageModel.create when present', async () => {
    const session = { destroy: jest.fn() };
    global.window.LanguageModel = {
      create: jest.fn().mockResolvedValue(session),
      availability: jest.fn().mockResolvedValue('available'),
    };

    require('../builtin-ai.js');

    const { session: created, source } = await global.window.PKBuiltinAI.createSession({
      signal: { aborted: false },
      monitor: () => {},
    });

    expect(source).toBe('LanguageModel');
    expect(created).toBe(session);
    expect(global.window.LanguageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedContext: 'en',
        outputLanguage: 'en',
        signal: expect.any(Object),
        monitor: expect.any(Function),
      })
    );
  });

  test('getCachedSession caches session for TTL window', async () => {
    const session = { destroy: jest.fn() };
    global.window.LanguageModel = {
      create: jest.fn().mockResolvedValue(session),
    };

    require('../builtin-ai.js');

    const first = await global.window.PKBuiltinAI.getCachedSession({ ttlMs: 60_000 });
    const second = await global.window.PKBuiltinAI.getCachedSession({ ttlMs: 60_000 });

    expect(first.session).toBe(session);
    expect(second.session).toBe(session);
    expect(global.window.LanguageModel.create).toHaveBeenCalledTimes(1);
  });
});


