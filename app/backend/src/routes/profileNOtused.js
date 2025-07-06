// profile.js (or inside server.js)
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

router.get('/profile', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.user_metadata?.full_name || req.user.user_metadata?.name,
    avatar: req.user.user_metadata?.avatar_url,
    provider: req.user.app_metadata?.provider,
    created_at: req.user.created_at,
    updated_at: req.user.updated_at
  });
});

// Update profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      user_metadata: {
        ...req.user.user_metadata,
        name: name,
        full_name: name
      }
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
      avatar: data.user.user_metadata?.avatar_url,
      provider: data.user.app_metadata?.provider
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;
