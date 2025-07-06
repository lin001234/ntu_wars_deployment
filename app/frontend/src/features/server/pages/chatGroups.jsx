import { useState, useEffect } from "react";
import { Card, Button, ListGroup, Spinner, Container, Row, Col, Badge, Alert } from "react-bootstrap";
import "../server.css";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../../components/axios";
import { useAuthStore } from "../../../store/useAuthStore";

function ChatGroups() {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUsername,setCurrentUser]=useState('');
    const [unreadCounts, setUnreadCounts] = useState({});
    const { onlineUsers,socket }= useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChats = async () => {
            try {
                setLoading(true);
                const res = await axiosInstance.get(`/chats/UserChat-ids`, {
                    withCredentials: true
                });
                const userData= await axiosInstance.get(`/profile`);
                const currentUser=userData.data.user.username;
                setCurrentUser(currentUser);
                
                const chatData = res.data?.chats || [];
                const enhancedChats = await Promise.all(
                    chatData.map(async (chat) => {
                        const otherUsername = chat.user1_username === currentUser
                            ? chat.user2_username
                            : chat.user1_username;
                        const profile=await axiosInstance.get('/profile/getProfileUseName',{
                            withCredentials:true,
                            params: {username:otherUsername},
                        })
                        const avatar_url=profile.data.profile.avatar_url;
                        const isOnline = onlineUsers.some(user=> user.username===otherUsername);
                        return {
                            id: chat.chat_id,
                            title: `${otherUsername}`,
                            otherUsername,
                            avatar_url,
                            lastMessage: "Click to view messages...",
                            timestamp: new Date().toLocaleDateString(),
                            isOnline,
                        };
                    }
                ));
                
                setChats(enhancedChats);
                // Fetch unread counts for all chats
                fetchUnreadCounts(enhancedChats.map(chat => chat.id));
            } catch (err) {
                console.error("Failed to load chats", err);
                setError("Failed to load your chats. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchChats();
    }, [onlineUsers]);

    // Fetch unread counts from backend
    const fetchUnreadCounts = async (chatIds) => {
        try {
            const response = await axiosInstance.post('/chats/unread-counts', 
                { chatIds }, 
                { withCredentials: true }
            );
            if (response.data.success) {
                setUnreadCounts(response.data.unreadCounts);
            }
        } catch (err) {
            console.error("Failed to fetch unread counts", err);
        }
    };

    // Socket listener for new messages (increment unread count)
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            console.log("New message received in ChatGroups:", newMessage);
            
            // Only increment if user is not currently in that chat
            const currentPath = window.location.pathname;
            const isInChat = currentPath.includes(`/chat/${newMessage.chat_id}/`);
            
            if (!isInChat) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [newMessage.chat_id]: (prev[newMessage.chat_id] || 0) + 1
                }));
            }
        };

        const handleMessageRead = (data) => {
            console.log("Message read event:", data);
            setUnreadCounts(prev => ({
                ...prev,
                [data.chatId]: 0
            }));
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("messagesRead", handleMessageRead);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messagesRead", handleMessageRead);
        };
    }, [socket]);

    const handleChatClick = async (chatId,otherUsername) => {
        // Mark messages as read when entering chat
        try {
            await axiosInstance.post('/chats/mark-read', 
                { chatId }, 
                { withCredentials: true }
            );
            
            // Reset unread count locally
            setUnreadCounts(prev => ({
                ...prev,
                [chatId]: 0
            }));

            // Emit to socket that messages are read
            if (socket) {
                socket.emit("markMessagesRead", { chatId });
            }
        } catch (err) {
            console.error("Failed to mark messages as read", err);
        }

        // Navigate to the specific chat
        navigate(`/chat/${chatId}/${otherUsername}`);
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading your chats...</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    {error}
                    <div className="mt-2">
                        <Button variant="outline-danger" size="sm" onClick={() => window.location.reload()}>
                            Try Again
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    return (
    <Container className="mt-4">
            <Row>
                <Col md={12} lg={10} xl={8} className="mx-auto">
                    <Card className="shadow-sm">
                        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">
                                <i className="fas fa-comments me-2"></i>
                                Your Chats
                            </h4>
                        </Card.Header>
                        
                        <Card.Body className="p-0">
                            {chats.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="fas fa-comment-slash fa-3x text-muted mb-3"></i>
                                    <h5 className="text-muted">No chats yet</h5>
                                </div>
                            ) : (
                                <ListGroup variant="flush">
                                    {chats.map((chat) => (
                                        <ListGroup.Item 
                                            key={chat.id}
                                            className="chat-item border-0 border-bottom p-3"
                                            action
                                            onClick={() => handleChatClick(chat.id, chat.otherUsername)}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="position-relative me-3">
                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 border border-gray-300">
                                                        {chat.avatar_url ? (
                                                        <img
                                                            src={chat.avatar_url}
                                                            alt={chat.username}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.style.display = 'none';
                                                            }}
                                                        />
                                                        ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-600">
                                                            {chat.title.charAt(0)}
                                                        </div>
                                                        )}
                                                    </div>
                                                    {chat.isOnline && (
                                                        <div 
                                                            className="position-absolute rounded-circle"
                                                            style={{
                                                                width: '12px',
                                                                height: '12px',
                                                                backgroundColor: '#28a745',
                                                                border: '2px solid white',
                                                                bottom: '0',
                                                                right: '0'
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                
                                                <div className="flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h6 className="mb-0 fw-bold text-dark">
                                                            {chat.title}
                                                        </h6>
                                                        <div className="d-flex align-items-center">
                                                            <small className="text-muted me-2">
                                                                {chat.timestamp}
                                                            </small>
                                                            {unreadCounts[chat.id] > 0 && (
                                                                <Badge 
                                                                    bg="danger" 
                                                                    className="rounded-pill"
                                                                    style={{ fontSize: '0.7rem' }}
                                                                >
                                                                    {unreadCounts[chat.id] > 99 ? '99+' : unreadCounts[chat.id]}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="mb-0 text-muted small">
                                                        {chat.lastMessage}
                                                    </p>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Card.Body>
                        
                        {chats.length > 0 && (
                            <Card.Footer className="text-center bg-light py-2">
                                <small className="text-muted">
                                    Showing {chats.length} chat{chats.length !== 1 ? 's' : ''}
                                </small>
                            </Card.Footer>
                        )}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ChatGroups;