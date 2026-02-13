const HISTORY_URL = 'https://unlicentiously-hedonistic-kristy.ngrok-free.dev/webhook/get-history';

document.addEventListener('DOMContentLoaded', function () {
  let elements = {
    modelSelect: document.getElementById('modelSelect'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    messages: document.getElementById('messages'),
    composer: document.getElementById('composer'),
    prompt: document.getElementById('prompt'),
    sendBtn: document.getElementById('sendBtn')
  };

  let DEFAULT_MODEL = 'gemini-2.5-flash';

  let conversation = [];

  elements.clearChatBtn.addEventListener('click', function () {
    let confirmDelete = confirm('¿Borrar toda la conversación?');
    if (!confirmDelete) return;
    conversation = [];
    renderMessages();
  });

  elements.prompt.addEventListener('input', function () {
    elements.prompt.style.height = 'auto';
    let newHeight = elements.prompt.scrollHeight;
    if (newHeight > 200) newHeight = 200;
    elements.prompt.style.height = newHeight + 'px';
  });

  elements.composer.addEventListener('submit', function (e) {
    e.preventDefault();
    let text = elements.prompt.value.trim();
    if (!text) return;

    let model = elements.modelSelect.value || DEFAULT_MODEL;

    appendMessage('user', text, false);
    elements.prompt.value = '';
    elements.prompt.style.height = 'auto';

    setSendingState(true);

    generateContent(model, conversation, function (error, replyText) {
      if (error) {
        appendMessage('model', 'Error: ' + error, true);
      } else {
        appendMessage('model', replyText, false);
      }
      setSendingState(false);
    });
  });

  function setSendingState(isSending) {
    elements.sendBtn.disabled = isSending;
    elements.prompt.disabled = isSending;
  }

  function appendMessage(role, text, isError) {
    conversation.push({ role: role, parts: [{ text: text }] });
    renderMessages(isError ? (conversation.length - 1) : null, isError);
    scrollToBottom();
  }

  function renderMessages(errorIndex, isError) {
    elements.messages.innerHTML = '';
    let i = 0;
    while (i < conversation.length) {
      let msg = conversation[i];
      let wrapper = document.createElement('div');
      wrapper.className = 'message ' + (msg.role === 'user' ? 'user' : 'model');

      let avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = msg.role === 'user' ? 'Tú' : 'U';

      let bubble = document.createElement('div');
      bubble.className = 'bubble';
      if (isError && i === errorIndex) {
        bubble.className += ' error';
      }

      let bubbleText = '';
      if (msg && msg.parts && msg.parts[0] && msg.parts[0].text) {
        bubbleText = msg.parts[0].text;
      }
      if (msg.role === 'model') {
        bubble.innerHTML = marked.parse(bubbleText);
      } else {
        bubble.textContent = bubbleText;
      }

      wrapper.appendChild(avatar);
      wrapper.appendChild(bubble);
      elements.messages.appendChild(wrapper);

      i++;
    }
  }

  function scrollToBottom() {
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  let sessionId = localStorage.getItem('chatSessionId');

  if (!sessionId) {
    sessionId = 'session-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatSessionId', sessionId);
  }

  function generateContent(model, contents, callback) {
    let url = 'https://unlicentiously-hedonistic-kristy.ngrok-free.dev/webhook/chat-23';

    let lastMessage = contents[contents.length - 1].parts[0].text;

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatInput: lastMessage,
        sessionId: sessionId
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.respuesta) {
          callback(null, data.respuesta);
        } else {
          callback("Error en respuesta", null);
        }
      })
      .catch(err => callback(err.message, null));
  }

  function loadChatHistory() {
    let currentSession = localStorage.getItem('chatSessionId');
    if (!currentSession) return;

    fetch(`${HISTORY_URL}?sessionId=${currentSession}`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true' 
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.history && Array.isArray(data.history)) {
          elements.messages.innerHTML = '';

          data.history.forEach(msg => {
            let role = 'model';
            if (msg.role === 'user' || msg.type === 'human') {
              role = 'user';
            }
            
            let content = msg.content || (msg.data && msg.data.content) || "";

            appendMessage(role, content, false);
          });
        }
      })
      .catch(err => console.error("Error recuperando chat:", err));
  }
});