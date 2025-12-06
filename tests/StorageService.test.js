import StorageService from '../services/StorageService.js';

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation for each test
    chrome.storage.local.get.mockImplementation((keys, cb) => cb({ prompts: [] }));
    chrome.storage.local.set.mockImplementation((items, cb) => cb());
  });

  test('addPrompt creates a valid Prompt object', async () => {
    const prompt = await StorageService.addPrompt('Test Content');
    
    expect(prompt).toHaveProperty('id');
    expect(prompt.title).toBe('Test Content');
    expect(prompt.versions).toHaveLength(1);
    expect(prompt.versions[0].content).toBe('Test Content');
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });

  test('updatePrompt adds a new version', async () => {
    // 1. Create initial prompt
    const p1 = await StorageService.addPrompt('Version 1');
    const id = p1.id;

    // Mock storage to return this prompt for the next get() call
    chrome.storage.local.get.mockImplementation((keys, cb) => cb({ prompts: [p1] }));

    // 2. Update it
    const updated = await StorageService.updatePrompt(id, 'Version 2');

    expect(updated.versions).toHaveLength(2);
    expect(updated.versions[1].content).toBe('Version 2');
    expect(updated.currentVersionId).toBe(updated.versions[1].id);
  });

  test('renamePrompt updates title', async () => {
    const p1 = await StorageService.addPrompt('Old Title');
    chrome.storage.local.get.mockImplementation((keys, cb) => cb({ prompts: [p1] }));

    const updated = await StorageService.renamePrompt(p1.id, 'New Title');
    
    expect(updated.title).toBe('New Title');
  });

  test('Legacy Migration: Converts strings to objects', async () => {
    // Mock legacy data
    chrome.storage.local.get.mockImplementation((keys, cb) => cb({ 
      prompts: ['Legacy String 1', 'Legacy String 2'] 
    }));

    const prompts = await StorageService.getPrompts();
    
    expect(prompts).toHaveLength(2);
    expect(prompts[0]).toHaveProperty('id');
    expect(prompts[0].versions[0].content).toBe('Legacy String 1');
    
    // Verify it tried to save the migrated data back
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });

  test('Import/Export Compatibility', async () => {
    // 1. Simulate Export
    const p1 = await StorageService.addPrompt('Exportable Content');
    // Mock get to return this
    chrome.storage.local.get.mockImplementation((keys, cb) => cb({ prompts: [p1] }));
    
    const allPrompts = await StorageService.getPrompts();
    const jsonExport = JSON.stringify(allPrompts);
    
    // Verify JSON structure matches expectations (Prompt objects)
    const parsed = JSON.parse(jsonExport);
    expect(parsed[0]).toHaveProperty('id');
    expect(parsed[0].title).toBe('Exportable Content');

    // 2. Simulate Import (Adding prompts from JSON)
    // We simulate importing by iterating and adding.
    // Note: In a real import, we might want to preserve IDs if we had a 'bulkAdd' method,
    // but current UI implementation creates new copies. We test that flow.
    
    const importData = JSON.parse(jsonExport);
    const importedPrompt = await StorageService.addPrompt(importData[0].versions[0].content);
    
    expect(importedPrompt.versions[0].content).toBe('Exportable Content');
    // ID should be new (different from exported one) because we created a copy
    expect(importedPrompt.id).not.toBe(p1.id);
  });
});
