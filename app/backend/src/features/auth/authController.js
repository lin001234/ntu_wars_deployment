const profiles = require('../profile/profiles');
const { supabase }=require('../../config/supabase');

// Login
exports.handleOauthCallback = async(req, res) =>{
    try{
        const user= req.user;
        const{ data:profile,error }=await supabase
        .from('user_profiles')
        .select('username,avatar_url')
        .eq('user_id',user.id)
        .single();
        
        if(error){
            console.error('Error fetching user profile:', error.message);
        }

        // set session data
        req.session.user ={ 
            ...user,
            username:profile?.username||null,
            avatar_url:profile?.avatar_url||null,
            online: true,
        };
        // save session
        req.session.save(async (err) => {
            if (err){
                console.error('Session save error:', err);
                return res.status(500).send('Session save failed');
            }

            // Update online status in db
            const {error:updateError}=await supabase
                .from('user_profiles')
                .update({online: true})
                .eq('user_id', user.id);

            if (updateError){
                console.error('Error updating user online status:',updateError);
            }

            // Check if this is a new user and redirect accordingly
            if (req.user.isNewUser) {
                res.redirect(`${process.env.CLIENT_URL}/auth/success?newUser=true` || 'http://localhost:5173/auth/success?newUser=true');
            } else {
                res.redirect(`${process.env.CLIENT_URL}/auth/success?newUser=false` || 'http://localhost:5173/auth/success?newUser=false');
            }
        });
    }catch (err){
        console.error('Oauth callback error:', err.message);
        res.status(500).send('Internal server error during OAuth callback');
    }

};

exports.logout = async (req,res)=>{

    try {
        const user=req.session.user;

        if (user){
            const {error} = await supabase
            .from('user_profiles')
            .update({online:false})
            .eq('user_id', user.id);

            if(error){
                console.error("Error updating user online status on logout", error);
            }
        }
        req.logout((err) => {
            if(err){
                return res.status(500).json({ error : 'Logout failed'});
            }
            //Clear session cookie
            res.clearCookie('connect.sid',{
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none':'lax',
                httpOnly : true,
                path:'/',
            });

            req.session.destroy((err) =>{
                if(err){
                    console.error('Session destruction error:', err);
                    return;
                }
                return res.status(200).json({ message: 'Logged out successfully' });
            });
        });
    } catch (err){
        console.error('Logout error',err.message);
        return res.status(500).json({error: 'Error during logout'});
    }
};

exports.status = async(req,res)=>{
    if (req.isAuthenticated()) {
        try{
            const profile=await profiles.getprofile(req.user.id);
            res.json({ authenticated: true,
             user: {
                ...req.user,
                username: profile?.username,
                avatar_url:profile?.avatar_url
             }});
        } catch(err){
            console.error("Error fetching profile:", err);
            res.status(500).json({ 
                authenticated: true,  // Still authenticated, but profile fetch failed
                user: req.user,       // Fall back to basic user data
                error: "Failed to load profile details" 
            });
        }
    }
    else{
        res.json({authenticated:false});
    }
}
exports.profile = async(req,res)=>{
    if (req.isAuthenticated()) {
        try{
            const profile=await profiles.getprofile(req.user.id);
            res.json({ 
             user: {
                ...req.user,
                username: profile?.username,
                avatar_url:profile?.avatar_url,
                online: profile?.online,
             }});
        } catch(err){
            console.error("Error fetching profile:", err);
            res.status(500).json({ 
                user: req.user,       // Fall back to basic user data
                error: "Failed to load profile details" 
            });
        }
        
    }
    else{
        res.json({authenticated:false});
    }
}