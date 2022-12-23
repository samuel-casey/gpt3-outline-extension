const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      if (result['openai-key']) {
        const decodedKey = atob(result['openai-key'])
        resolve(decodedKey)
      }
      reject('No key found')
    })
  })
}

const generate = async (prompt) => {
  // Get your API key from storage
  const key = await getKey()
  const url = 'https://api.openai.com/v1/completions'

  // Call completions endpoint
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1250,
      temperature: 0.7,
    }),
  })

  // Select the top choice and send back
  const completion = await completionResponse.json()
  return completion.choices.pop()
}

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (!response) {
          console.log('injection failed: NO RESPONSE');
        }
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
};

const outlineUrl = 'http://localhost:3000/api/outlines';

const generateOutline = async (selection) => {
  return await fetch(outlineUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      passage: selection,
      url: 'https://www.test.com',
      userId: 'abc123'
    }),
  });
}

const generateCompletionAction = async (info) => {
  sendMessage('Generating...');
  
  try {
    const { selectionText } = info
    
    const newOutline = await generateOutline(selectionText)
    sendMessage(newOutline);
  } catch (error) {
    console.log(error)
    sendMessage(error.toString());
  }
}

// Add this in scripts/contextMenuServiceWorker.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'context-run',
    title: 'Generate Outline from Selection',
    contexts: ['selection'],
  })
})

// Add listener
chrome.contextMenus.onClicked.addListener(generateCompletionAction)
