// CONSTANTS
const OUTLINE_URL = 'https://outline-next-4068o1v96-samuel-casey.vercel.app/api/outlines';
const WEB_APP_URL = 'https://outline-next-4068o1v96-samuel-casey.vercel.app/outlines';

// Send a message to the user's current tab with status of outline generation
const sendMessage = (content, type) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    // log in users's console that the outline is being generated
    if (type === 'log') {
      chrome.tabs.sendMessage(
        activeTab,
        { message: 'log', content },
        (response) => {
          if (!response) {
            console.log('injection failed: NO RESPONSE');
          }
          if (response.status === 'failed') {
            console.log('injection failed.');
          }
          console.log(response);
        },
      );
    } else {
      // after outline generated, redirect user to the new outline
      chrome.tabs.sendMessage(
        activeTab,
        { message: 'redirect', content },
        (response) => {
          if (!response) {
            console.log('injection failed: NO RESPONSE');
          }
          console.log(response);
        },
      );

      // redirect user to the new outline once it is generated
      chrome.tabs.create({ url: content });
    }
  });
}

const readStream = async (reader) => {
  const { done, value } = await reader.read();

  // Convert the value to a string
  const str = String.fromCharCode.apply(null, value);

  // Process the value
  console.log({ str });
  const { id } = JSON.parse(str);
  console.log(id);
  sendMessage(`${WEB_APP_URL}/${id}`, 'alert');

  if (done) {
    // The stream has been fully read
    console.log('Done reading stream');
    return;
  }

  // Read the next chunk of data
  readStream();
}

// generate an outline from the user's selection and URL
const generateOutline = async (url = 'n/a', selection) => {
  return await fetch(OUTLINE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      passage: selection,
      url: url,
      userId: 'abc123', // Demo user -- no authentication used in Alpha version of extension
    }),
  });
}

const generateCompletionAction = async (url, info) => {
  sendMessage('Generating...', 'log');
  console.log({ info });

  try {
    const { selectionText } = info;

    // generate an outline based on the user's selection using Outline API
    const newOutline = await generateOutline(url, selectionText);
    const stream = newOutline.body;

    // read response stream
    const reader = stream.getReader();
    readStream(reader);

    // sendMessage(newOutline)
  } catch (error) {
    console.log(error);
    sendMessage(error.toString());
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'context-run',
    title: 'Generate Outline from Selection',
    contexts: ['selection', 'page'],
  });
});

// add listener to context menu
// generate an outline from the user's selection
// send selection and URL to Outline API
// redirect user to the new outline
chrome.contextMenus.onClicked.addListener((info) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    generateCompletionAction(currentUrl, info);
  });
});
