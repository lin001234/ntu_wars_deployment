import { create } from "zustand";
import { axiosInstance } from "../components/axios";
import { useAuthStore } from './useAuthStore';


export const useChatStore = create((set,get) =>({
    messages:[],
    users: [],
    selectedChatId: null,
    isUserLoading: false,
    isMessageLoading: false,

    getUsers:async() =>{
        set({isUserLoading:true});
        try{
            const res= await axiosInstance.get("/profile/getotherUsers");
            set({users:res.data});
        } catch(err){
            console.error('Error getting users', err)
        } finally{
            set({isUserLoading:false});
        }
    },

    getMessages: async()=>{
        set({isMessageLoading:true});
        const {selectedChatId}=get();
        try{
            const res= await axiosInstance.get(`/chats/${selectedChatId}`,{
                withCredentials:true
            });

            const msgs = Array.isArray(res.data?.messages) ? res.data.messages : [];
            console.log("GETMESSAGES", msgs)
            set({messages:msgs});
        } catch(err){
            console.error('Error getting messages', err);
        } finally{
            set({isMessageLoading:false});
        }
    },

    sendMessage:async(messageData) =>{
        const{messages,selectedChatId} = get();
        try{
            const res=await axiosInstance.post(`/chats/${selectedChatId}`,
                messageData,
                { withCredentials:true },
            );

            if(res.data.isToxic){
                alert("Message is toxic, please be nicer");
                return;
            }
            set({messages:[...messages,res.data.message]});
        } catch(err){
            console.error("Error sending messages", err);
        }
    },

    subscribeToMessages:()=>{
        const {selectedChatId}=get();

        console.log("ChatId:",selectedChatId);

        if(!selectedChatId) return;

        const socket=useAuthStore.getState().socket;

        console.log("Socket from subtomsg:",socket);

        // Remove any existing listeners to prevent duplicates
        socket.off("newMessage");

        socket.on("newMessage",(newMessage) =>{
            console.log("Subscribe to message message",newMessage);
            const isMessageForChat=newMessage.chat_id===selectedChatId;
            console.log("Is message for current chat:", isMessageForChat, "newMessage.chat_id:", newMessage.chat_id, "selectedChatId:", selectedChatId);
            
            if(!isMessageForChat) return;

            set({
                messages:[...get().messages,newMessage],
            });
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
    },

    setSelectedId:(selectedChatId) =>set({selectedChatId}),
}))