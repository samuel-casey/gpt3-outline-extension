// const getKey = () => {
//   return new Promise((resolve, reject) => {
//     chrome.storage.local.get(['openai-key'], (result) => {
//       if (result['openai-key']) {
//         const decodedKey = atob(result['openai-key'])
//         resolve(decodedKey)
//       }
//       reject('No key found')
//     })
//   })
// }

// const generate = async (prompt) => {
//   // Get your API key from storage
//   const key = await getKey()
//   const url = 'https://api.openai.com/v1/completions'

//   // Call completions endpoint
//   const completionResponse = await fetch(url, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${key}`,
//     },
//     body: JSON.stringify({
//       model: 'text-davinci-003',
//       prompt: prompt,
//       max_tokens: 1250,
//       temperature: 0.7,
//     }),
//   })

//   // Select the top choice and send back
//   const completion = await completionResponse.json()
//   return completion.choices.pop()
// }

const sendMessage = (content, type) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id

    if (type === 'log') {
      chrome.tabs.sendMessage(
        activeTab,
        { message: 'log', content },
        (response) => {
          if (!response) {
            console.log('injection failed: NO RESPONSE')
          }
          if (response.status === 'failed') {
            console.log('injection failed.')
          }
          console.log(response)
        },
      )
    } else {
      chrome.tabs.sendMessage(
        activeTab,
        { message: 'alert', content },
        (response) => {
          if (!response) {
            console.log('injection failed: NO RESPONSE')
          }
          if (response.status === 'failed') {
            console.log('injection failed.')
          }
          console.log(response)
        },
      )

      chrome.tabs.create({ url: content });
    }
  })
}

const outlineUrl = 'http://localhost:3000/api/outlines'
const webAppUrl = 'http://localhost:3000/outlines'

const generateOutline = async (url = 'n/a', selection) => {
  return await fetch(outlineUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      passage: selection,
      url: url,
      userId: 'abc123',
    }),
  })
}

const generateCompletionAction = async (url, info) => {
  sendMessage('Generating...', 'log')
  console.log({ info })

  try {
    const { selectionText } = info

    const newOutline = await generateOutline(url, selectionText)
    console.log({ newOutline })
    const stream = newOutline.body

    const reader = stream.getReader()

    async function readStream() {
      // 'done' is a boolean that is true when the stream has been fully read
      // 'value' is the current chunk of data being read from the stream
      const { done, value } = await reader.read()

      // Convert the value to a string
      const str = String.fromCharCode.apply(null, value)

      // Process the value
      console.log(str)
      const { id } = JSON.parse(str)
      console.log(id)
      sendMessage(`${webAppUrl}/${id}`, 'alert', )

      if (done) {
        // The stream has been fully read
        console.log('Done reading stream')
        return
      }

      // Read the next chunk of data
      readStream()
    }

    readStream()

    // sendMessage(newOutline)
  } catch (error) {
    console.log(error)
    sendMessage(error.toString())
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'context-run',
    title: 'Generate Outline from Selection',
    contexts: ['selection', 'page'],
  })
})

chrome.contextMenus.onClicked.addListener((info) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url
    generateCompletionAction(currentUrl, info)
  })
})
