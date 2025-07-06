const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_backend_URL,
        credentials: true
    }
});

// Middleware
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// Share session with Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Routes
const postsRouter = require('./routes/posts');
const usersRouter = require('./routes/users');

app.use('/api/posts', postsRouter);
app.use('/api/users', usersRouter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve a fallback chat page (optional)
app.get('/chat/post/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'post-chat.html'));
});

// In-memory data stores
const connectedUsers = new Map(); // socket.id -> user info
const chatRooms = new Map();      // postId -> Set of socket ids

// Socket.IO handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join post chat room
    socket.on('join-post-chat', (data) => {
        const { postId, username } = data;

        if (!postId) {
            socket.emit('error', 'Post ID is required');
            return;
        }

        const roomName = `post_${postId}`;
        const user = socket.request.user;

        const displayName = user?.name ||
            user?.user_metadata?.name ||
            user?.email?.split('@')[0] ||
            username ||
            `Anonymous_${socket.id.substring(0, 6)}`;

        connectedUsers.set(socket.id, {
            username: displayName,
            userId: user?.id || null,
            roomName,
            postId,
            isAuthenticated: !!user,
            joinedAt: new Date()
        });

        if (!chatRooms.has(postId)) chatRooms.set(postId, new Set());
        chatRooms.get(postId).add(socket.id);

        socket.join(roomName);

        socket.to(roomName).emit('user-joined-post-chat', {
            username: displayName,
            postId,
            timestamp: new Date().toISOString()
        });

        socket.emit('joined-post-chat', {
            message: `Welcome to the discussion for Post #${postId}!`,
            postId,
            roomName,
            participants: chatRooms.get(postId).size
        });

        const participants = Array.from(chatRooms.get(postId))
            .map(id => connectedUsers.get(id)?.username)
            .filter(Boolean);

        socket.emit('participants-list', {
            postId,
            participants,
            count: participants.length
        });

        console.log(`${displayName} joined post chat ${postId}`);
    });

    // Handle sending message
    socket.on('send-post-message', ({ message }) => {
        const userInfo = connectedUsers.get(socket.id);
        if (!userInfo || !message?.trim()) return;

        const msgData = {
            id: Date.now() + Math.random(),
            username: userInfo.username,
            message: message.trim(),
            postId: userInfo.postId,
            timestamp: new Date().toISOString(),
            userId: userInfo.userId,
            isAuthenticated: userInfo.isAuthenticated
        };

        io.to(userInfo.roomName).emit('post-chat-message', msgData);
        console.log(`Post ${userInfo.postId} - ${userInfo.username}: ${message}`);
    });

    // Typing indicators
    socket.on('typing-in-post', () => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
            socket.to(userInfo.roomName).emit('user-typing-in-post', {
                username: userInfo.username,
                postId: userInfo.postId
            });
        }
    });

    socket.on('stop-typing-in-post', () => {
        const userInfo = connectedUsers.get(socket.id);
        if (userInfo) {
            socket.to(userInfo.roomName).emit('user-stopped-typing-in-post', {
                username: userInfo.username,
                postId: userInfo.postId
            });
        }
    });

    // Leave room
    socket.on('leave-post-chat', () => {
        handleUserLeave(socket);
    });

    // Disconnect
    socket.on('disconnect', () => {
        handleUserLeave(socket);
        console.log('User disconnected:', socket.id);
    });

    function handleUserLeave(socket) {
        const userInfo = connectedUsers.get(socket.id);
        if (!userInfo) return;

        const { roomName, username, postId } = userInfo;

        chatRooms.get(postId)?.delete(socket.id);
        if (chatRooms.get(postId)?.size === 0) {
            chatRooms.delete(postId);
        }

        socket.leave(roomName);

        socket.to(roomName).emit('user-left-post-chat', {
            username,
            postId,
            timestamp: new Date().toISOString()
        });

        connectedUsers.delete(socket.id);
        console.log(`${username} left post chat ${postId}`);
    }
})

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
