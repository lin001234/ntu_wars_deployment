import { useState, useEffect, useRef, use } from "react";
//import { Card, Form, Button, ListGroup, Spinner, Container, Row, Col, Badge } from "react-bootstrap";
import "../server.css";
import { useParams,useNavigate } from "react-router-dom";
import { axiosInstance } from "../../../components/axios";
import { useChatStore } from "../../../store/useChatStore";
import { useAuthStore } from "../../../store/useAuthStore";

function Chat() {
  const { chatId,postOwnerUsername } = useParams();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [PostAvatar_url,setAvatarUrl] =useState("");
  const [online, setOnline] = useState(false);
  const{
    messages,
    setSelectedId,
    getMessages,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    isMessageLoading,
  } = useChatStore();

  const{socket,authUser,onlineUsers} = useAuthStore();
  const socketRef = useRef(socket);

  useEffect(() =>{
    socketRef.current=socket;
  }, [chatId, socket]);

  useEffect(()=>{
    const fetchAvatar=async()=>{
      try{
        const profile=await axiosInstance.get('/profile/getProfileUseName',{
            withCredentials:true,
            params: {username:postOwnerUsername},
        })
        const avatar_url=profile.data.profile.avatar_url;
        setAvatarUrl(avatar_url);
      } catch (err){
        console.error('Error fetching avatar:',err);
      }
    }
    fetchAvatar();
  }, []);

  // Function to mark messages as read
  const markMessagesAsRead = async () => {
    if (!chatId || !socketRef.current){
      console.warn("Cannot mark messages as read: socket/chatId not ready");
      return;
    }
    try {
      // Mark as read in backend database
      await axiosInstance.post('/chats/mark-read', 
        { chatId }, 
        { withCredentials: true }
      );
      
      // Emit socket event to update real-time UI
      socketRef.current.emit("markMessagesRead", { chatId });
      
      console.log(`Messages marked as read for chat: ${chatId}`);
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  // Check if user is online 
  useEffect(() => {
      const isOnline = onlineUsers.some(user=> user.username === postOwnerUsername);
      setOnline(isOnline);
  }, [onlineUsers, postOwnerUsername]);
  
  // clear selectedUser when component is unmounted
  useEffect(() =>{
    return() =>{
      setSelectedId(null);
      unsubscribeFromMessages();
      markMessagesAsRead();
    }
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages on load
  useEffect(() => {
    const fetchAndSub=async()=>{
      if(!chatId) return;

      setSelectedId(chatId);
      await getMessages();
      subscribeToMessages();
    }

    fetchAndSub();
  },[chatId]);

  // Mark as read when user scrolls to bottom or interacts with chat
  useEffect(() => {
    const handleUserInteraction = () => {
      markMessagesAsRead();
    };

    // Mark as read when user clicks anywhere in the messages container
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.addEventListener('click', handleUserInteraction);
      
      return () => {
        messagesContainer.removeEventListener('click', handleUserInteraction);
      };
    }
  }, [chatId, socket]);

  const HandleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    await sendMessage({content:input});
    setInput("")
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupMessagesByDate = (msgs = []) => {
    const groups = {};
    msgs.forEach((msg) => {
      const date = formatDate(msg.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  // check if message is from current user
  const isCurrentUser=(message)=>{
    return authUser && message.sender_username ===authUser.user.username;
  }

  const messageGroups = groupMessagesByDate(messages|| []);

    // Send icon component
  const SendIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m22 2-7 20-4-9-9-4zm0 0-10 10"/>
    </svg>
  );

  return (
  <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
      {/* Chat Header */}
      <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
              onClick={() => navigate(-1)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold border-2 border-white/30">
              {PostAvatar_url ? (
                <img
                  src={PostAvatar_url}
                  alt={postOwnerUsername}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-600">
                  {postOwnerUsername?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{postOwnerUsername}</h3>
                {online ? (
                  <p className="text-blue-100 text-sm">Active now</p>
                ) : (
                 <p className="text-gray-300 text-sm">Offline</p>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 messages-container">
        {isMessageLoading ? (
          <div className="flex items-center justify-center h-full flex-col">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full flex-col text-gray-500">
            <div className="text-6xl mb-4 opacity-30">💬</div>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message below</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className="mb-8">
              {/* Date Separator */}
              <div className="flex justify-center my-6">
                <div className="bg-white px-4 py-2 rounded-full text-sm text-gray-600 shadow-sm border border-gray-200">
                  {date}
                </div>
              </div>
              
              {/* Messages */}
              {msgs.map((message, index) => (
                
                <div
                  key={index}
                  ref={
                    date === Object.keys(messageGroups)[Object.keys(messageGroups).length - 1] &&
                    index === msgs.length - 1 ? messagesEndRef : null
                  }
                >
                  {message.system ? (
                    <div className="flex justify-center my-3">
                      <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm italic border border-blue-200">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-start gap-3 mb-4 ${isCurrentUser(message) ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 border border-gray-300">
                        {message.sender_avatar_url ? (
                          <img
                            src={message.sender_avatar_url}
                            alt={message.sender_username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {message.sender_username?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      
                      {/* Message Content */}
                      <div className={`flex flex-col max-w-xs lg:max-w-md ${isCurrentUser(message) ? 'items-end' : 'items-start'}`}>
                        {/* Header */}
                        <div className={`flex items-center gap-2 mb-1 ${isCurrentUser(message) ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className={`text-sm font-semibold ${isCurrentUser(message) ? 'text-blue-600' : 'text-gray-700'}`}>
                            {message.sender_username || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(message.created_at)}
                          </span>
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                          isCurrentUser(message)
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-6 bg-white border-t border-gray-200">
        <form onSubmit={HandleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            className="flex-1 px-6 py-3 bg-gray-100 border border-gray-300 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isMessageLoading}
            ref={inputRef}
          />
          <button
            type="submit"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-none ${
              !input.trim() || isMessageLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
            } text-white`}
            disabled={!input.trim() || isMessageLoading}
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;

