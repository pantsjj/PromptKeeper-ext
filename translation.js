// translation.js

// List of supported languages during the origin trial
const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ru', name: 'Russian' },
    { code: 'hi', name: 'Hindi' },
    // Add more languages as needed, respecting the origin trial limitations
  ];
  
  // Function to populate the language dropdown
  function populateLanguageOptions() {
    const languageSelect = document.getElementById('language-options');
    supportedLanguages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.name;
      languageSelect.appendChild(option);
    });
  }
  
  // Check if the Translation API is supported
  if (!('translation' in self) || !('createTranslator' in self.translation)) {
    alert('Translation API is not supported in this browser.');
    // Optionally, disable the Translate-Paste button
    document.getElementById('translate-paste-button').disabled = true;
  } else {
    // Call populateLanguageOptions when the script loads
    populateLanguageOptions();
  
    // Translate-Paste Button Event Listener
    document.getElementById('translate-paste-button').addEventListener('click', translatePasteHandler);
  }
  
  // Function to handle the Translate-Paste button click
  function translatePasteHandler() {
    const text = document.getElementById('prompt-text').value.trim();
    const targetLanguage = document.getElementById('language-options').value;
  
    if (!text) {
      alert('Please enter some text to translate.');
      return;
    }
  
    translateText(text, targetLanguage).then(translatedText => {
      if (translatedText) {
        pasteTranslatedText(translatedText);
      }
    });
  }
  
  // Function to translate text using the Translator API
  async function translateText(text, targetLanguage) {
    const sourceLanguage = await detectLanguage(text);
    if (!sourceLanguage) {
      alert('Could not detect the source language.');
      return null;
    }
  
    // Check if translation is possible
    const canTranslateResult = await self.translation.canTranslate({
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });
  
    if (canTranslateResult === 'no') {
      alert(`Cannot translate from ${sourceLanguage} to ${targetLanguage}.`);
      return null;
    } else if (canTranslateResult === 'after-download') {
      alert('Translation model needs to be downloaded. This may take some time.');
    }
  
    // Create a translator instance
    const translator = await self.translation.createTranslator({
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
    });
  
    // Handle model download progress
    translator.ondownloadprogress = progressEvent => {
      // You can implement a progress bar here
      console.log(`Download progress: ${progressEvent.loaded} / ${progressEvent.total}`);
    };
  
    try {
      // Perform the translation
      const translatedText = await translator.translate(text.trim());
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      alert('An error occurred during translation.');
      return null;
    }
  }
  
  // Function to detect the language of the text
  async function detectLanguage(text) {
    if (!('translation' in self) || !('createDetector' in self.translation)) {
      // If Language Detector API is not available, default to English
      return 'en';
    }
  
    try {
      const detector = await self.translation.createDetector();
      const detections = await detector.detect(text.trim());
      const result = detections[0]; // Get the most probable detection
      return result.detectedLanguage || 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }
  
  // Function to paste the translated text into the focused input field on the web page
  function pasteTranslatedText(text) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && !tabs[0].url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "pastePrompt", text: text }, function (response) {
          if (chrome.runtime.lastError || (response && response.status !== 'success')) {
            // Content script might not be injected yet; inject it and try again
            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id },
                files: ['contentScript.js'],
              },
              () => {
                // After injecting, try sending the message again
                chrome.tabs.sendMessage(tabs[0].id, { action: "pastePrompt", text: text }, function (response) {
                  if (chrome.runtime.lastError || (response && response.status !== 'success')) {
                    console.error(chrome.runtime.lastError);
                    alert(response && response.message ? response.message : 'Error: Unable to paste the translated text. Please make sure an input field is focused.');
                  } else {
                    console.log('Translated text pasted successfully.');
                  }
                });
              }
            );
          } else {
            console.log('Translated text pasted successfully.');
          }
        });
      } else {
        alert('Cannot paste into a chrome:// page.');
      }
    });
  }