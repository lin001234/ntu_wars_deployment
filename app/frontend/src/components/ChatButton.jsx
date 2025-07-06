import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from './axios';

const ChatButton = ({ postOwnerId,postOwnerUsername, currentUserId, className = '', size = 'sm', variant = 'primary' }) => {
	const [isLoading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleStartChat = async() =>{
        console.log('Chat button clicked with:', { postOwnerId, currentUserId }); // Debug log

        if (postOwnerId === currentUserId) {
            alert("You can't message yourself!");
            return;
        }
        setLoading(true);

        try{
            console.log('Sending request with user_id:', postOwnerId); // Debug log

            const response = await axiosInstance.post('/chats/get-or-create',
                {
                    user_id:String(postOwnerId)
                }
            );

            console.log('Chat response:', response.data); // Debug log

            if(response.data.success){
                navigate(`/chat/${response.data.chatId}/${postOwnerUsername}`);
            }
            else{
                console.error('Failed to start chat:', response.data.error);
                alert('Failed to start chat: ' + response.data.error);
            }
        } catch(err){
            console.error('Error starting chat', err);
            console.error('Error response:', err.response?.data); // Debug log
            const errorMessage = err.response? err.response?.data?.error ||'Unknown error': err.message || 'Failed to start chat';
            alert(`Failed to start chat: ${errorMessage}`);
        } finally{
            setLoading(false);
        }
    };

    //No button is user is viewing his own post/ not logged in
    if(postOwnerId===currentUserId){
        return null;
    }

    return (
        <Button 
            variant={variant}
            size={size}
            onClick={handleStartChat}
            disabled={isLoading}
            className={className}
        >
            {isLoading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Starting Chat...
                </>
            ) : (
                'Message Owner'
            )}
        </Button>
    );
}

export default ChatButton;