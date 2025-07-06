import NavigationBar from './components/Navbar';
import { Container } from 'react-bootstrap';
import { AuthProvider } from './features/auth/authContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginPage from './features/auth/pages/signup'
import AuthSuccess from './features/auth/authsuccess'
import Home from './features/posts/pages/home';
import CreatePost from './features/posts/pages/createPost';
import PrivateRoute from './components/PrivateRoute';
import PostDetail from './features/posts/pages/postDetail';
import Self_page from './features/posts/pages/self_page';
import Chat from './features/server/pages/server';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import Filtered_posts from './features/posts/pages/filter_page';
import ChatGroups from './features/server/pages/chatGroups';
import UpdateProfile from './features/auth/pages/profile'
import { useAuthStore } from './store/useAuthStore';
import {useEffect} from 'react';
function App() {
  const { authUser, checkAuth, connectSocket, disconnectSocket, socket, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    // Only check auth on initial load
    if (isCheckingAuth) {
      checkAuth();
    }
  }, []); // Empty dependency array for initial load only

   useEffect(() => {
    // Handle socket connection based on auth state
    if (authUser && authUser.user && authUser.user.id) {
      // User is authenticated, ensure socket is connected
      if (!socket?.connected) {
        console.log('App: User authenticated, connecting socket');
        connectSocket();
      }
    } else if (!authUser && socket?.connected) {
      // User is not authenticated but socket is connected, disconnect
      console.log('App: User not authenticated, disconnecting socket');
      disconnectSocket();
    }
  }, [authUser, socket?.connected]); // Only depend on authUser and socket connection state

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <AuthProvider>
    <BrowserRouter>
      <NavigationBar />
        <Container className="py-4">
          <Routes>
            <Route path='/auth/success' element={<AuthSuccess />} />
            <Route path='/login' element={<LoginPage />}></Route>
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path='/profile' element={<UpdateProfile />} />
              <Route path='/' element={<Home />} />
              <Route path='/home' element={<Home />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path='/post/self' element={<Self_page />} />
              <Route path='/post/filter' element={<Filtered_posts />} />
              <Route path='/chats' element={<ChatGroups />}/>
              <Route path='/chat/:chatId/:postOwnerUsername' element={<Chat />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
    </BrowserRouter>
    </AuthProvider>
  )
}

export default App
