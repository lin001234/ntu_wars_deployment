import { Server } from "socket.io";
import http from "http";
import express from"express";
import { Server as SocketServer } from "socket.io";

const app = express();
const server=http.createServer(app);

const io = new SocketServer(server, {
  path: "/api/socket.io",
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

const userSocketMap={}; // {[userId]:{socketId,username}}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId]?.socketId;
}

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('New client connected',socket.id);

  const userId = socket.handshake.query.userId;
  const username= socket.handshake.query.username;
  const avatar_url=socket.handshake.query.avatar_url;
  console.log("Connection attempt - userId:", userId, "username:", username);

  // Only add to socket map if we have valid userId and username
  if (userId && username && userId !== 'undefined' && username !== 'undefined') {
    userSocketMap[userId] = { socketId: socket.id, username,avatar_url};
    console.log(`User ${username} (${userId},${avatar_url}) connected with socket ${socket.id}`);
    console.log("Current userSocketMap:", Object.keys(userSocketMap));
    
    // Emit updated online users list
    emitOnlineUsers();
  } else {
    console.log("Invalid connection attempt - missing or invalid userId/username");
    console.log("Received userId:", userId, "username:", username);
    // Optionally disconnect invalid connections
    socket.disconnect(true);
    return;
  }

  socket.on("markMessagesRead", (data) => {
  
    const { chatId } = data;
    console.log(`User ${socket.id} marked messages as read in chat ${chatId}`);
    
    // Emit to all clients in the chat that messages have been read
    // This helps synchronize read status across multiple devices/tabs
    socket.emit('messagesRead', { 
      chatId, 
      readBy: userId 
    });
});

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (userId && userSocketMap[userId]) {
      console.log(`User ${username} (${userId}) disconnected`);
      delete userSocketMap[userId];
      emitOnlineUsers();
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.log('Socket error:', error);
  });
});

function emitOnlineUsers(){
  const onlineUsers= Object.entries(userSocketMap).map(([userId,data]) =>({
    userId,
    username: data.username,
    avatar_url:data.avatar_url
  }));
  console.log("Emitting online users:", onlineUsers);
  io.emit("getOnlineUsers", onlineUsers);
}

export {io,app,server};