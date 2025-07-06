const express = require('express');
const { supabase } = require('../../config/supabase');
const router = express.Router();

async function getAllPosts(limit,offset){
    const { data, error } = await supabase
    .from('posts_with_usernames')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset,offset+limit-1);

    if(error) throw error;
    return data;
}

async function getOwnPost(userId,limit,offset){
    const {data,error} = await supabase
    .from('posts_with_usernames')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending : false})
    .range(offset,offset+limit-1);;

    if(error) throw error;
    return data;
}
async function getPostbById(id){
    const {data,error} = await supabase
    .from('posts_with_usernames')
    .select('*')
    .eq('id', id)
    .single();

    if (error) throw error;
    return data;
}

async function createPost(user_id,course_id,context,tag,index_id,index_exchange_id){
    const {data, error}= await supabase
    .from('posts')
    .insert([{user_id,course_id,context,tag,index_id,index_exchange_id}])
    .select()
    .single();

    if(error) throw error;
    return data;
}

async function deletePost(id){
    const {data,error}= await supabase
    .from('posts')
    .delete()
    .eq('id', id);
        
    if(error) throw error;
    return data;
}

// Exact string search for filter button
async function searchPosts(filters){
    let query = supabase.from('posts_with_usernames').select('*');
    
    for (const key in filters){
        const value = filters[key];

        if (value === undefined || value === null || value === '' || (Array.isArray(value) && (value.length === 0 || (value.length === 1 && value[0] === '')))){
            continue;
        }

        if(Array.isArray(value)){
            if (key === 'index_exchange_id') {
                // Use OR conditions to check if the array column contains any of the values
                const orConditions = value.map(val => `${key}.cs.{${val}}`);
                query = query.or(orConditions.join(','));
            }else{
                query=query.in(key,value);
            }
        }
        else{
            query = query.eq(key, value);
        }
    }
    const {data,error} =await query.order('updated_at', { ascending: false });
    if(error) throw error;
    return data;
}

//substring search for autosearch
async function filterPosts(filters){
    let query = supabase.from('posts_with_usernames').select('*');
    
    for (const key in filters){
        const value = filters[key];

        if (value === undefined || value === null || value === '' || (Array.isArray(value) && (value.length === 0 || (value.length === 1 && value[0] === '')))){
            continue;
        }

        if(Array.isArray(value)){
            if (key === 'index_exchange_id') {
                // Use OR conditions to check if the array column contains any of the values
                const orConditions = value.map(val => `${key}.cs.{${val}}`);
                query = query.or(orConditions.join(','));
            }
            else{
                query=query.in(key,value);
            }
        }
        else{
            switch(key){
                case 'course_id':
                case 'tag':
                    query=query.textSearch(key, `'${value}':*`);
                    break;
                case 'index_id':
                case 'index_exchange_id':
                    query=query.textSearch(key, `'${value}'`);
                    break;
            }
        }
    }

    // Apply ordering and pagination - FIXED: removed duplicate order() call
    const {data,error} =await query.order('created_at', { ascending: false });
    if(error) throw error;
    return data;
}

async function updatePost(id,course_id,context,tag,index_id,index_exchange_id){
    // Step 1: Check if post exists
    const { data: existing, error: findError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', id)
        .maybeSingle();

    console.log('Supabase find query:', id, existing); // Add this for debugging

    if (findError) throw findError;

    if (!existing) {
        return null; // Not found
    }
    const updated_at = new Date().toISOString().replace('T', ' ').replace('Z', '+00');  // Replacing 'T' with space and 'Z' with '+00'
    
    // Step 2: Proceed with update
    const { data, error } = await supabase
        .from('posts')
        .update({ course_id, context, tag, index_id, index_exchange_id, updated_at})
        .eq('id', id)
        .select();

    if (error) {
    console.error('Error during update:', error);
    throw error;
}

    return data?.[0]; // Return updated or original
}

async function getPostUsername(id){
    const {data,error}=await supabase
    .from('posts_with_usernames')
    .select('username')
    .eq('id',id)
    .single();

    if(error)throw error;
    return data;

}
module.exports = {
  getAllPosts,
  getOwnPost,
  getPostbById,
  createPost,
  updatePost,
  deletePost,
  filterPosts,
  searchPosts,
  getPostUsername,
};