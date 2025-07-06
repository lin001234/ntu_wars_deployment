// Create/send messages
const express = require('express');
const { supabase } = require('../../config/supabase');
const router = express.Router();

async function getChatMessage(chat_id){
    const {data,error} = await supabase
    .from('messages_with_usernames')
    .select('*')
    .eq('chat_id',chat_id)
    .order('created_at', {ascending:true});

    if(error) throw error;
    return data;
}

async function createChatMessage(chat_id,sender_id,content){
    const {data:insertedMessage,error} = await supabase
    .from('messages')
    .insert([{chat_id,sender_id,content}])
    .select()
    .single();

    if(error) throw error;
    // Optional: Wait for Supabase to update the view/join
    await new Promise((resolve) => setTimeout(resolve, 300)); // 300–500ms

    // Re-fetch the enriched message (from a view or joined query)
    const { data: enrichedMessage, error: fetchError } = await supabase
        .from('messages_with_usernames')
        .select('*')
        .eq('id', insertedMessage.id)
        .single();

    if (fetchError) throw fetchError;

    return enrichedMessage;
}

async function deleteChatMessage(id,sender_id){
    const {data,error} = await supabase
    .from('messages')
    .delete()
    .eq('id', id)
    .eq('sender_id', sender_id)

    if(error) throw error;
    return data;
}

// Get unread message counts for multiple chats
async function getUnreadCounts(userId, chatIds) {
    try {
        const promises = chatIds.map(async (chatId) => {
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('chat_id', chatId)
                .neq('sender_id', userId) // Don't count own messages
                .eq('is_read', false);

            if (error) throw error;
            return { chatId, count: count || 0 };
        });

        const results = await Promise.all(promises);
        
        // Convert array to object format
        const unreadCounts = {};
        results.forEach(({ chatId, count }) => {
            unreadCounts[chatId] = count;
        });

        return unreadCounts;
    } catch (error) {
        console.error('Error getting unread counts:', error);
        throw error;
    }
}

// Mark messages as read for a specific chat and user
async function markMessagesAsRead(chatId, userId) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('chat_id', chatId)
            .neq('sender_id', userId) // Don't mark own messages
            .eq('is_read', false);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error marking messages as read:', error);
        throw error;
    }
}

module.exports={
    getChatMessage,
    createChatMessage,
    deleteChatMessage,
    getUnreadCounts,
    markMessagesAsRead,
};