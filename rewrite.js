// rewrite.js

let aiProcessing = false; // Flag to indicate if AI is processing
let abortController; // For aborting the AI process

// Function to show spinner
function showSpinner() {
  const aiCapability = document.getElementById('ai-capability');
  let spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.id = 'ai-spinner';
  aiCapability.appendChild(spinner);
}

// Function to remove spinner
function removeSpinner() {
  const spinner = document.getElementById('ai-spinner');
  if (spinner) {
    spinner.parentNode.removeChild(spinner);
  }
}

// AI-Optimize Button
document.getElementById('ai-optimize-button').addEventListener('click', function () {
  // Call the asynchronous function
  aiOptimizeHandler();
});

async function aiOptimizeHandler() {
  const promptTextArea = document.getElementById('prompt-text');
  const promptText = promptTextArea.value.trim();
  const wordCount = promptText.split(/\s+/).filter(Boolean).length;

  // Get the selected rewrite option
  const rewriteOption = document.getElementById('rewrite-options').value;

  const aiOptimizeButton = document.getElementById('ai-optimize-button');

  if (aiProcessing) {
    // Abort the AI process
    if (abortController) {
      abortController.abort();
    }
    aiProcessing = false;
    aiOptimizeButton.textContent = 'AI-Optimize';
    removeSpinner();
    return;
  }

  if (wordCount < 6) {
    alert('Please provide more context in your prompt (at least 6 words).');
    return;
  }

  if (!promptText) {
    alert('Please enter a prompt to optimize.');
    return;
  }

  // Indicate that AI processing has started
  aiProcessing = true;
  aiOptimizeButton.textContent = 'Abort';
  showSpinner();

  // Attempt AI optimization
  await attemptOptimize(promptText, rewriteOption);
}

async function attemptOptimize(promptText, rewriteOption, retryCount = 0) {
  const promptTextArea = document.getElementById('prompt-text');
  const aiOptimizeButton = document.getElementById('ai-optimize-button');

  try {
    // Check if window.ai and window.ai.languageModel are available
    if (!window.ai || !window.ai.languageModel) {
      console.log('window.ai.languageModel is not available.');
      throw new Error('AI features are not available in this browser.');
    }

    // Create a new abort controller
    abortController = new AbortController();
    const signal = abortController.signal;

    // Create a new language model session
    const session = await window.ai.languageModel.create({
      signal,
      expectedContext: 'en',
      outputLanguage: 'en'
    });

    // Map rewriteOption to instructions
    let rewriteInstruction = '';
    switch (rewriteOption) {
      case 'more-creative':
        rewriteInstruction = 'Rewrite and Optimise the following LLM text Prompt to be  creative.';
        break;
      case 'more-concise':
        rewriteInstruction = 'Rewrite and Optimise the following LLM text Prompt to be  concise.';
        break;
      case 'shorter':
        rewriteInstruction = 'Rewrite and Optimise the following LLM text Prompt to be shorter.';
        break;
      case 'longer':
        rewriteInstruction = 'RRewrite and Optimise the following LLM text Prompt to be longer.';
        break;
      default:
        // For 'retry' or any unsupported option
        rewriteInstruction = 'Improve the following LLM text Prompt.';
        break;
    }

    // Construct the AI prompt
    let aiPrompt = `${rewriteInstruction}\n\n"${promptText}"`;

    // Call the AI model to get the optimized prompt
    const optimizedPrompt = await session.prompt(aiPrompt, { signal });

    // AI processing complete
    aiProcessing = false;
    aiOptimizeButton.textContent = 'AI-Optimize';
    removeSpinner();

    // Append the optimized prompt to the text area
    promptTextArea.value = promptText + '\n\n---\n\n' + optimizedPrompt;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('AI optimization aborted.');
    } else {
      console.error('Error optimizing prompt:', error.message, error);

      if (retryCount < 2) { // Retry up to 2 times
        console.warn(`Retrying AI optimization (attempt ${retryCount + 1})...`);
        await attemptOptimize(promptText, rewriteOption, retryCount + 1);
        return;
      }

      // Change the button to red for 1 second to indicate an error
      aiOptimizeButton.style.backgroundColor = '#dc3545'; // Bootstrap's danger color
      setTimeout(() => {
        aiOptimizeButton.style.backgroundColor = '';
      }, 1000);
    }

    // AI processing complete
    aiProcessing = false;
    aiOptimizeButton.textContent = 'AI-Optimize';
    removeSpinner();
  }
}