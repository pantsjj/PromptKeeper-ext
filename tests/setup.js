// Mock Chrome Storage API
global.chrome = {
  runtime: {
    lastError: null,
    getURL: (path) => `chrome-extension://mock-id/${path}`,
    openOptionsPage: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => callback({})),
      set: jest.fn((items, callback) => callback && callback()),
      getBytesInUse: jest.fn((keys, callback) => callback(0))
    }
  }
};

// Mock crypto.randomUUID
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  };
}

// Mock window.ai (Gemini Nano)
global.window = global;
global.window.ai = {
  languageModel: {
    capabilities: jest.fn().mockResolvedValue({ available: 'readily' }),
    create: jest.fn().mockResolvedValue({
      prompt: jest.fn().mockImplementation((text) => {
        // Simple mock responses based on input keywords
        if (text.includes('SCORE:')) {
            return Promise.resolve("SCORE: 8\nFEEDBACK: Good persona.");
        }
        if (text.includes('Rewrite')) {
            return Promise.resolve("Refined Prompt Content");
        }
        return Promise.resolve("AI Response");
      }),
      destroy: jest.fn()
    })
  }
};