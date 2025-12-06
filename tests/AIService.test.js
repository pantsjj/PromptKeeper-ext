import AIService from '../services/AIService.js';

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('scorePrompt returns parsed score and feedback', async () => {
    const result = await AIService.scorePrompt("Test Prompt");
    
    expect(result).toEqual({
      score: 8,
      feedback: "Good persona."
    });
    
    // Verify the system prompt was constructed correctly
    // We can't easily inspect the internal `session.prompt` call argument because `AIService` creates the session internally.
    // However, we mock the return based on input content in setup.js, so getting the correct result implies the prompt structure triggered the mock.
  });

  test('refinePrompt calls prompt with instruction', async () => {
    const result = await AIService.refinePrompt("Rough draft", "formalize");
    expect(result).toBe("Refined Prompt Content");
  });

  test('getAvailability checks capabilities', async () => {
    const status = await AIService.getAvailability();
    expect(status).toBe('readily');
    expect(window.ai.languageModel.capabilities).toHaveBeenCalled();
  });
});
