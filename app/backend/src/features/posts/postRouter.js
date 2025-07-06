const express = require('express');
const posts = require('./posts');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth');

// Route to get all posts
router.get('/', async(req,res)=>{
    try{
        const limit = parseInt(req.query.limit)||15;
        const offset = parseInt(req.query.offset)||0;

        const allposts = await posts.getAllPosts(limit,offset);
        res.json({success:true,allposts});
    } catch(err){
        console.error('Failed to fetch all posts:', err.message);
        res.status(500).json({success:false, error:'Failed to get all posts'});
    }
})

//Route to get current user post
router.get('/self', requireAuth, async(req,res) =>{
    try{
        const limit = parseInt(req.query.limit)||15;
        const offset = parseInt(req.query.offset)||0;

        const userId = req.user.id;
        const self_posts = await posts.getOwnPost(userId,limit,offset);
        res.json({success:true, self_posts});
    } catch(err){
        console.error('Failed to fetch user posts:', err.message);
        res.status(500).json({success:false, error: 'Failed to get posts'});
    }
})

//Get filtered post(For substring search)
router.get('/filter', async(req,res) =>{
    try{
        const filters={
            course_id:req.query.course_id,
            tag:req.query.tag,
            index_id: Array.isArray(req.query.index_id) ? req.query.index_id: req.query.index_id?.split(','),
            index_exchange_id: req.query.index_exchange_id ? 
                (Array.isArray(req.query.index_exchange_id) ? 
                    req.query.index_exchange_id : 
                    (typeof req.query.index_exchange_id === 'string' ? 
                        req.query.index_exchange_id.split(',').map(id => id.trim()).filter(id => id !== '') :
                        [req.query.index_exchange_id]
                    )
                ) : undefined,
                
        };

        const filteredPosts = await posts.filterPosts(filters);

        res.json({
            success:true,
            posts:filteredPosts,
            count: filteredPosts.length 
        })
    }catch (err) {
    console.error('Filter posts error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to filter posts',
      details: err.message 
    });
    }
})

//Get filtered post(for exact string search)
router.get('/search', async(req,res) =>{
    try{
        const filters={
            course_id:req.query.course_id,
            tag:req.query.tag,
            index_id: Array.isArray(req.query.index_id) ? req.query.index_id: req.query.index_id?.split(','),
            index_exchange_id: req.query.index_exchange_id ? 
                (Array.isArray(req.query.index_exchange_id) ? 
                    req.query.index_exchange_id : 
                    (typeof req.query.index_exchange_id === 'string' ? 
                        req.query.index_exchange_id.split(',').map(id => id.trim()).filter(id => id !== '') :
                        [req.query.index_exchange_id]
                    )
                ) : undefined,
                
        };

        const filteredPosts = await posts.searchPosts(filters);

        res.json({
            success:true,
            posts:filteredPosts,
            count: filteredPosts.length 
        })
    }catch (err) {
    console.error('Filter posts error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to filter posts',
      details: err.message 
    });
    }
})

//Router to get specific post
router.get('/:id', async(req,res) =>{
    try{
        const {id} = req.params;
        const id_post = await posts.getPostbById(id);
        res.json({success:true, id_post});
    }catch (err){
        console.error('Failed to fetch id post:',err.message);
        res.status(500).json({success:false, error:'Failed to get post'});
    }
})


// Update post
router.put('/:id', requireAuth,async(req,res) => {
    try{
        const { id } =req.params;
        const {course_id,context,tag,index_id,index_exchange_id} = req.body;
        const userId = req.user.id;

        if (!course_id || !context || !tag || !index_id || !index_exchange_id){
            return res.status(400).json({
                success: false,
                error: 'Insufficient details'
            });
        }

        const existingPost = await posts.getPostbById(id);
        if (!existingPost){
            return res.status(404).json({success:false, error: 'Post not found'});
        }

        if (existingPost.user_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                error: 'You can only update your own posts' 
            });
        }

        const updatedPost = await posts.updatePost(id,course_id,context,tag,index_id,index_exchange_id);

        if (!updatedPost){
            return res.status(404).json({ success: false, error:'Post not found'});
        }

        res.json({success:true, post:updatedPost});
    }catch (err){
        console.error('Error updating post:', err);
        res.status(500).json({success:false,error:'Failed to update post'});
    }
})

//Route to create new post
router.post('/', requireAuth, async(req,res) =>{
    try{
        const userId=req.user.id;
        const {course_id,context,tag,index_id,index_exchange_id} = req.body;
        
        if (!course_id || !context || !tag || !index_id || !index_exchange_id){
            return res.status(400).json({
                success: false,
                error: 'Insufficient details'
            });
        }

        const newPost= await posts.createPost(userId,course_id,context,tag,index_id,index_exchange_id);
        res.status(201).json({success: true, post:newPost});
    }catch(err){
        console.error('Error creating post:', err.message);
        res.status(500).json({success:false,error:'Failed to create post'});
    }
})

//delete post
router.delete('/:id', requireAuth, async(req,res) => {
    try {
        const {id} = req.params;
        const userId = req.user.id;

        const existingPost = await posts.getPostbById(id);
        if (!existingPost){
            return res.status(404).json({success:false, error: 'Post not found'});
        }
        
        if (existingPost.user_id !== userId) {
            return res.status(403).json({ 
                success: false, 
                error: 'You can only delete your own posts' 
            });
        }

        await posts.deletePost(id);
        res.json({success: true, message: `Post with ID ${id} deleted successfully`});
    } catch (err){
        console.error('Error deleting post:', err.message);
        res.status(500).json({success:false,error:'Failed to delete post'});
    }
})

router.get('/username', requireAuth, async(req,res) =>{
    try{
        const {id}=req.query;
        const username=await posts.getPostUsername(id);
        res.json({success:true,username});
    }catch (err){
        console.error('Error getting username',err.message);
        res.status(500).json({success:false,error:'Failed to get username'});
    }
})



module.exports=router;