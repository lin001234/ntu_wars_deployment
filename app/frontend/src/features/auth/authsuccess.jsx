import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContext,useState } from 'react';
import { AuthContext } from './authContext';
import { useAuthStore } from '../../store/useAuthStore';

function AuthSuccess(){
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const isNewUser=searchParams.get('newUser') === 'true';
    // Socket
    const { authUser, checkAuth, onlineUsers, isCheckingAuth } = useAuthStore();
    const [isReady,setIsReady] = useState(false);

    useEffect(() => {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
        credentials: 'include', // sends the cookie automatically
      })
      .then(res => {
        console.log('AuthSuccess: Response status:', res.status);
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((userData) => {
        console.log('AuthSuccess: User data received:', userData);
        // update user state in authcontext with fetched user data
        setUser(userData);

        // using of socket
        checkAuth();
      })
      .catch((error) => {
        // If token invalid or no token, redirect to login page
        console.log('AuthSuccess: Error:', error);
        setUser(null);
        navigate('/login', { replace: true });
      });
  }, [navigate, setUser,isNewUser,checkAuth]);

  useEffect(() =>{

    console.log('AuthSuccess: Checking state...');
    console.log('authUser:', authUser);
    console.log('onlineUsers:', onlineUsers);
    console.log('isCheckingAuth:', isCheckingAuth);

    if (!isCheckingAuth && authUser){
      console.log('AuthSuccess: authUser:', authUser);
      console.log('AuthSuccess: onlineUsers:', onlineUsers);

      setIsReady(true);
    }
  }, [authUser, onlineUsers, isCheckingAuth]);

  useEffect(() =>{
    if(isReady){
        console.log({ authUser })
        console.log({ onlineUsers });

        // Use a small delay to ensure state is updated before navigation
        setTimeout(() => {
            console.log('AuthSuccess: Navigating to /home');
            if(isNewUser){
              navigate('/profile', {replace:true});
            }else{
              navigate('/home', { replace: true });
            }
        }, 100);
    }
  },[isReady, authUser, onlineUsers, isNewUser, navigate])
  
    
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
        }}>
            <div>
                <p>Processing authentication...</p>
                <p>Please wait...</p>
            </div>
        </div>
    );
}
export default AuthSuccess;