// Create chat table when user start texting
const express = require('express');
const { supabase } = require('../../config/supabase');
const router = express.Router();

async function createChat(user1_id,user2_id){
    // Ensure both are strings
    if (typeof user1_id !== 'string' || typeof user2_id !== 'string') {
        throw new Error(`Invalid user IDs: ${JSON.stringify({ user1_id, user2_id })}`);
    }

    // Have to ensure user1_id is smaller than 2, cus easier to grp
    const [u1,u2] = [user1_id,user2_id].sort((a, b) => a.localeCompare(b));

    const chatPayload = { user1_id: u1, user2_id: u2 };

    const {data,error} =await supabase
    .from('chats')
    .insert([chatPayload])
    .select()
    .maybeSingle();

    if(error) throw error;
    if (!data) throw new Error("Insert succeeded but no data returned.");
    return data;
}

async function getChatId(user1_id,user2_id){
    const [u1,u2] = [user1_id,user2_id].sort((a, b) => a.localeCompare(b));

    const {data,error} = await supabase
    .from('chats')
    .select('id')
    .eq('user1_id',u1)
    .eq('user2_id',u2)
    .maybeSingle();
    
    if(error) throw error;
    if(!data) throw new Error('Chats not found');
    return data.id;
}

async function getUserChatIds(user1_username){
    const {data,error} = await supabase
    .from('chat_with_usernames')
    .select('*')
    .or(`user1_username.eq.${user1_username},user2_username.eq.${user1_username}`);
    if(error) throw error;
    return data;
}

async function getChatUserIds(id){
    const {data,error} = await supabase
    .from('chats')
    .select('user1_id,user2_id')
    .eq('id',id)
    .single();

    if(error) throw error;
    return data;
}
module.exports={
    createChat,
    getChatId,
    getUserChatIds,
    getChatUserIds
}