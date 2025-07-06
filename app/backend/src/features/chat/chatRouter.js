const express = require('express');
const chatController = require('./chatController');
const message = require('./message');
const router = express.Router();
const {checkToxicity}= require('../checkToxicity');
const { requireAuth } = require('../../middleware/auth');
const {getReceiverSocketId, io} = require('../../middleware/socket');

// Route to get or create chat
router.post('/get-or-create', requireAuth, async(req,res) =>{
    try{
        const user1_id = req.user.id;
        const {user_id:user2_id} = req.body;

        // try and get existing chat
        let chatId;
        try{
            chatId= await chatController.getChatId(user1_id, user2_id);
        } catch(err){
            // If chat doesnt exist, create new one
            if(err.message.includes('Chats not found') || err.message.includes('not found')){
                const newChat=await chatController.createChat(user1_id, user2_id);
                chatId = newChat.id;
            } else{
                throw err;
            }
        }
        res.status(201).json({success:true, chatId:chatId});
        console.log('Sending response:', { success: true, chatId: chatId });
    } catch(err){
        console.error('Failed to create chat:', err.message);
        res.status(500).json({success:false,error:'Failed to create chat:' + err.message});
    }
})

// Get chatId
router.get('/chat-id', requireAuth, async(req,res) =>{
    try{
        const user1_id = req.user.id;
        const {user_id:user2_id} = req.body;
        const chatId = await chatController.getChatId(user1_id,user2_id);
        res.json({success:true,chatId});
    }catch(err){
        console.error("Failed to fetch chatId:", err.message);
        res.status(500).json({success:false,error:'Failed to get chatId'});
    };
})
// Get a user chats
router.get('/UserChat-ids', requireAuth,async(req,res)=>{
    try{
        const user1_username=req.user.username;
        const chats = await chatController.getUserChatIds(user1_username);
        res.json({success:true,chats});
    }catch(err){
        console.error("Failed to fetch chatId")
        res.status(500).json({success:false,error:"Failed to get all chatId for user"});
    }
})

// Get unread message counts for multiple chats
router.post('/unread-counts', requireAuth, async(req, res) => {
    try {
        const { chatIds } = req.body;
        const userId = req.user.id;
        
        if (!Array.isArray(chatIds)) {
            return res.status(400).json({
                success: false,
                error: 'chatIds must be an array'
            });
        }

        const unreadCounts = await message.getUnreadCounts(userId, chatIds);
        res.json({ success: true, unreadCounts });
    } catch (err) {
        console.error("Failed to fetch unread counts:", err.message);
        res.status(500).json({ success: false, error: 'Failed to get unread counts' });
    }
});

// Mark messages as read
router.post('/mark-read', requireAuth, async(req, res) => {
    try {
        const { chatId } = req.body;
        const userId = req.user.id;
        
        if (!chatId) {
            return res.status(400).json({
                success: false,
                error: 'chatId is required'
            });
        }

        await message.markMessagesAsRead(chatId, userId);
        
        res.json({ success: true });
    } catch (err) {
        console.error("Failed to mark messages as read:", err.message);
        res.status(500).json({ success: false, error: 'Failed to mark messages as read' });
    }
});

// Router to get msgs from specific chat
router.get('/:chat_id',async(req,res) =>{
    try{
        const {chat_id} =req.params;
        const messages = await message.getChatMessage(chat_id);
        res.json({success:true,messages});
    } catch(err){
        console.error("Failed to fetch messages:", err.message);
        res.status(500).json({success:false,error:'Failed to get messages'});
    };
})

// create new messages
router.post('/:chat_id',requireAuth, async(req,res) =>{
    try{
        const {chat_id} = req.params;
        const sender_id = req.user.id;
        const {content} = req.body;
        if(!content){
            return res.status(400).json({
                success:false,
                error: 'Insufficient details'
            });
        }
        
        // Check toxicity before creating message
        const toxicityScore = await checkToxicity(content);
        if (toxicityScore > 0.8) {
        return res.status(200).json({
            success: false,
            isToxic: true,
            message: 'Message blocked due to toxicity',
            toxicityScore,
        });
        }

        const newMessage= await message.createChatMessage(chat_id,sender_id,content);

        // get userIds of both users to get receiver_id
        const { user1_id, user2_id }=await chatController.getChatUserIds(chat_id);

        const receiver_Id = sender_id ===user1_id?user2_id:user1_id;
        
        // Socket emitting to receiver socket(Implement how to get receiver_id NOW)
        const receiverSocketId=getReceiverSocketId(receiver_Id);

        console.log("In creating msgs, receiverSocketId is", receiverSocketId);
        console.log("In creating msgs, newMessage is", newMessage);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json({success:true, message:newMessage});
    }catch(err){
        console.error('Error creating message:', err.message);
        res.status(500).json({success:false,error:'Failed to create message'});
    }
})

module.exports=router;