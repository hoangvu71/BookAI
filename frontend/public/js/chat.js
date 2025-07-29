// BookAI Chat Interface JavaScript
const API_BASE = '/api/v1';
let socket = null;
let currentChatId = null;
let currentUserId = 'user_' + Date.now(); // Simple user ID for demo

// DOM Elements
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const newChatButton = document.getElementById('new-chat');
const chatListEl = document.getElementById('chat-list');
const modelNameEl = document.getElementById('model-name');
const testConnectionBtn = document.getElementById('test-connection');
const streamModeCheckbox = document.getElementById('stream-mode');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeSocket();
    loadModels();
    loadChats();
    setupEventListeners();
});

// Initialize WebSocket connection
function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('WebSocket connected');
    });
    
    socket.on('new_message', (data) => {
        if (data.chatId === currentChatId) {
            // Update UI with new message if in same chat
            loadMessages(currentChatId);
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    newChatButton.addEventListener('click', createNewChat);
    testConnectionBtn.addEventListener('click', testConnection);
}

// Load available models
async function loadModels() {
    try {
        const response = await fetch(`${API_BASE}/models`);
        const data = await response.json();
        
        if (data.success && data.current) {
            modelNameEl.textContent = data.current.name;
        }
    } catch (error) {
        console.error('Failed to load models:', error);
        modelNameEl.textContent = 'Model unavailable';
    }
}

// Load user's chats
async function loadChats() {
    try {
        const response = await fetch(`${API_BASE}/chat/list?userId=${currentUserId}`);
        const data = await response.json();
        
        if (data.success) {
            displayChats(data.chats);
        }
    } catch (error) {
        console.error('Failed to load chats:', error);
    }
}

// Display chat list
function displayChats(chats) {
    chatListEl.innerHTML = '';
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        if (chat.id === currentChatId) {
            chatItem.classList.add('active');
        }
        
        chatItem.innerHTML = `
            <div class="chat-item-title">${chat.title}</div>
            <div class="chat-item-date">${formatDate(chat.created_at)}</div>
        `;
        
        chatItem.addEventListener('click', () => selectChat(chat.id));
        chatListEl.appendChild(chatItem);
    });
}

// Create new chat
async function createNewChat() {
    try {
        const response = await fetch(`${API_BASE}/chat/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'New Chat ' + new Date().toLocaleTimeString(),
                userId: currentUserId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentChatId = data.chat.id;
            loadChats();
            selectChat(currentChatId);
            showSuccess('New chat created');
        }
    } catch (error) {
        console.error('Failed to create chat:', error);
        showError('Failed to create new chat');
    }
}

// Select and load a chat
async function selectChat(chatId) {
    currentChatId = chatId;
    
    // Update UI
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Join WebSocket room
    if (socket) {
        socket.emit('join_chat', { chatId, userId: currentUserId });
    }
    
    // Enable input
    messageInput.disabled = false;
    sendButton.disabled = false;
    
    // Load messages
    await loadMessages(chatId);
}

// Load messages for a chat
async function loadMessages(chatId) {
    try {
        const response = await fetch(`${API_BASE}/chat/${chatId}`);
        const data = await response.json();
        
        if (data.success) {
            displayMessages(data.messages);
            
            // Update active chat in sidebar
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
                if (item.textContent.includes(data.chat.title)) {
                    item.classList.add('active');
                }
            });
        }
    } catch (error) {
        console.error('Failed to load messages:', error);
        showError('Failed to load messages');
    }
}

// Display messages
function displayMessages(messages) {
    messagesEl.innerHTML = '';
    
    messages.forEach(message => {
        addMessageToUI(message);
    });
    
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Add single message to UI
function addMessageToUI(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.role}`;
    
    messageEl.innerHTML = `
        <div class="message-header">${message.role === 'user' ? 'You' : 'Assistant'}</div>
        <div class="message-content">${escapeHtml(message.content)}</div>
    `;
    
    messagesEl.appendChild(messageEl);
}

// Send message
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !currentChatId) return;
    
    // Clear input and disable
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;
    
    // Add user message to UI immediately
    addMessageToUI({
        role: 'user',
        content: message
    });
    
    try {
        const streamMode = streamModeCheckbox.checked;
        
        if (streamMode) {
            // Handle streaming response
            await sendStreamingMessage(message);
        } else {
            // Handle regular response
            await sendRegularMessage(message);
        }
    } catch (error) {
        console.error('Failed to send message:', error);
        showError('Failed to send message');
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

// Send regular message
async function sendRegularMessage(message) {
    const response = await fetch(`${API_BASE}/chat/${currentChatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            userId: currentUserId,
            stream: false
        })
    });
    
    const data = await response.json();
    
    if (data.success) {
        addMessageToUI(data.assistantMessage);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    } else {
        throw new Error(data.error || 'Failed to get response');
    }
}

// Send streaming message
async function sendStreamingMessage(message) {
    // Create assistant message element for streaming
    const assistantMessageEl = document.createElement('div');
    assistantMessageEl.className = 'message assistant streaming';
    assistantMessageEl.innerHTML = `
        <div class="message-header">Assistant</div>
        <div class="message-content"></div>
    `;
    messagesEl.appendChild(assistantMessageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    const contentEl = assistantMessageEl.querySelector('.message-content');
    let fullContent = '';
    
    // Fetch with streaming
    const response = await fetch(`${API_BASE}/chat/${currentChatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            userId: currentUserId,
            stream: true
        })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.chunk) {
                        fullContent += data.chunk;
                        contentEl.textContent = fullContent;
                        messagesEl.scrollTop = messagesEl.scrollHeight;
                    }
                    
                    if (data.done) {
                        assistantMessageEl.classList.remove('streaming');
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
    }
}

// Test connection
async function testConnection() {
    testConnectionBtn.disabled = true;
    testConnectionBtn.textContent = 'Testing...';
    
    try {
        const response = await fetch(`${API_BASE}/models/${process.env.AI_MODEL || 'gemini-2.0-flash-exp'}/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(`Connection successful! Response time: ${data.test.responseTime}`);
        } else {
            showError(data.error || 'Connection test failed');
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        showError('Connection test failed');
    } finally {
        testConnectionBtn.disabled = false;
        testConnectionBtn.textContent = 'Test Connection';
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    messagesEl.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 5000);
}

function showSuccess(message) {
    const successEl = document.createElement('div');
    successEl.className = 'success-message';
    successEl.textContent = message;
    messagesEl.appendChild(successEl);
    setTimeout(() => successEl.remove(), 3000);
}