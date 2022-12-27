chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // log content for debugging/support purposes while in alpha testing
  const { content } = request;

  if (request.message === 'log') {
    console.log(content);
    alert(content);
    sendResponse({ status: 'success; generating outline...' });
  } else if (request.message === 'redirect') {
    // redirect to the new outline from contextMenuServiceWorker.js
    console.log('Outline generated; redirecting.', content);
    sendResponse({ status: 'success; redirecting to: ', content });
  }
});
