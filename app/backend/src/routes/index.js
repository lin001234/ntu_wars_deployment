const express=require('express');
const router = express.Router();

const authRoutes = require('../features/auth/authRouter');
const profileRoutes = require('../features//profile/profileRouter');
const userRoute = require('./users');
const postRoutes = require('../features/posts/postRouter');
const chatRoutes = require('../features/chat/chatRouter');

router.use('/auth', authRoutes);

router.use('/profile', profileRoutes)

router.use('/user', userRoute);

router.use('/posts', postRoutes);

router.use('/chats', chatRoutes);
module.exports= router;