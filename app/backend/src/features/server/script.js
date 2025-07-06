const socket = io(process.env.CLIENT_backend_URL);
const messageForm = document.getElementById('send-container');
const messageContainer = document.getElementById('message-container');
const messageInput = document.getElementById('message-input');
let username = null;

// Method 1: Get username from authenticated user profile
async function getCurrentUser() {
    try {
        const response = await fetch('/api/users/profile', {
            method: 'GET',
            credentials: 'include' // Include cookies for authentication
        });
        
        if (response.ok) {
            const user = await response.json();
            username = user.name || user.email.split('@')[0]; // Use name or email prefix
            
            // Join the chat room with the authenticated username
            socket.emit('join-room', username);
            
            return username;
        } else {
            // User not authenticated, prompt for username
            return promptForUsername();
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return promptForUsername();
    }
}

// Method 2: Prompt user for username if not authenticated
function promptForUsername() {
    const name = prompt('Enter your name:');
    if (name && name.trim()) {
        username = name.trim();
        socket.emit('join-room', username);
        return username;
    } else {
        return promptForUsername(); // Keep asking until valid name is provided
    }
}

socket.on('message', (data) => {
  appendMessage(`${data.username}: ${data.message}`)
})

socket.on('user-connected', (username) => {
    appendMessage(`${username} joined the chat`)
})

socket.on('user-disconnected', (username) => {
    appendMessage(`${username} is offline`)
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const message = messageInput.value
    appendMessage(`You: ${message}`)
    socket.emit('send-chat-message', message)
    messageInput.value = ''
})

function appendMessage(message) {
    const messageElement = document.createElement('div')
    messageElement.innerText = message
    messageContainer.append(messageElement)
}