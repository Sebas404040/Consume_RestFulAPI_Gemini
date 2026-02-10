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
      avatar.textContent = msg.role === 'user' ? 'Tú' : 'G';

      let bubble = document.createElement('div');
      bubble.className = 'bubble';
      if (isError && i === errorIndex) {
        bubble.className += ' error';
      }

      let bubbleText = '';
      if (msg && msg.parts && msg.parts[0] && msg.parts[0].text) {
        bubbleText = msg.parts[0].text;
      }
      bubble.textContent = bubbleText;

      wrapper.appendChild(avatar);
      wrapper.appendChild(bubble);
      elements.messages.appendChild(wrapper);

      i++;
    }
  }

  function scrollToBottom() {
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  function generateContent(model, contents, callback) {
    let url = 'http://localhost:3000/chat';

    let lastMessage = contents[contents.length - 1].parts[0].text;
    
    let history = contents.slice(0, -1);

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: lastMessage, 
        history: history 
      })
    })
      .then(res => {
        if (!res.ok) {
            return res.text().then(text => { throw new Error(text) });
        }
        return res.json();
      })
      .then(data => {
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            let text = data.candidates[0].content.parts[0].text;
            callback(null, text);
        } else if (data.error) {
            callback(data.error, null);
        } else {
            callback("Respuesta inesperada del servidor", null);
        }
      })
      .catch(err => {
        console.error("Error en fetch:", err);
        callback(err.message || "Error de conexión con el servidor", null);
      });
  }
});