// routes/posts.js
const express = require('express');
const posts = require('../models/posts'); // Your posts model
const router = express.Router();

// Middleware to check authentication (if needed)
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get chat page for specific post
router.get('/:id/chat', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ success: false, error: 'Valid post ID is required' });
        }
        
        const post = await posts.getPostById(id);
        
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // You can serve a chat HTML page or return data for frontend routing
        res.json({ 
            success: true, 
            chatRoom: `post_${id}`,
            post: post,
            chatUrl: `/chat/post/${id}`
        });
        
    } catch (err) {
        console.error('Failed to access post chat:', err.message);
        res.status(500).json({ success: false, error: 'Failed to access chat' });
    }
});

// Get chat messages for specific post
router.get('/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        
        // Validate ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ success: false, error: 'Valid post ID is required' });
        }
        
        // Check if post exists
        const post = await posts.getPostById(id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // Get chat messages for this post (you'll need to implement this in your model)
        const messages = await posts.getChatMessages(id, { page, limit });
        
        res.json({ 
            success: true, 
            messages: messages.data,
            pagination: {
                page,
                limit,
                total: messages.total,
                pages: Math.ceil(messages.total / limit)
            }
        });
        
    } catch (err) {
        console.error('Failed to fetch chat messages:', err.message);
        res.status(500).json({ success: false, error: 'Failed to get messages' });
    }
});

// Join post chat (POST request)
router.post('/:id/join', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Validate ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ success: false, error: 'Valid post ID is required' });
        }
        
        // Check if post exists
        const post = await posts.getPostById(id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // Optional: Check if user has permission to join this chat
        // const canJoin = await posts.checkChatPermission(userId, id);
        // if (!canJoin) {
        //     return res.status(403).json({ success: false, error: 'No permission to join this chat' });
        // }
        
        // Add user to post chat participants (optional)
        await posts.addChatParticipant(id, userId);
        
        res.json({ 
            success: true, 
            message: 'Successfully joined chat',
            chatRoom: `post_${id}`,
            post: post
        });
        
    } catch (err) {
        console.error('Failed to join post chat:', err.message);
        res.status(500).json({ success: false, error: 'Failed to join chat' });
    }
});

// Leave post chat (POST request)
router.post('/:id/leave', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Remove user from post chat participants
        await posts.removeChatParticipant(id, userId);
        
        res.json({ 
            success: true, 
            message: 'Successfully left chat'
        });
        
    } catch (err) {
        console.error('Failed to leave post chat:', err.message);
        res.status(500).json({ success: false, error: 'Failed to leave chat' });
    }
});

// Get active participants in post chat
router.get('/:id/participants', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if post exists
        const post = await posts.getPostById(id);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // Get active participants
        const participants = await posts.getChatParticipants(id);
        
        res.json({ 
            success: true, 
            participants: participants,
            count: participants.length
        });
        
    } catch (err) {
        console.error('Failed to get chat participants:', err.message);
        res.status(500).json({ success: false, error: 'Failed to get participants' });
    }
});

module.exports = router;