import { create } from "zustand";
import {persist} from 'zustand/middleware';
import { axiosInstance } from "../components/axios";
import { io } from "socket.io-client";

export const useAuthStore = create(persist(
    (set,get) =>({
        authUser:null,
        isCheckingAuth: true,
        onlineUsers: [],
        socket: null,

        checkAuth: async () => {
            try {
            const res = await axiosInstance.get("/profile");
            
            console.log('checkAuth: Response from /profile:', res.data);
            // Only set authUser and connect socket if we have valid user data
            if (res.data && res.data.user && res.data.user.id) {
                set({ authUser: res.data });
                get().connectSocket();
                console.log('checkAuth: authUser set:', get().authUser);
            } else {
                console.log('checkAuth: Invalid user data received');
                set({ authUser: null });
                get().disconnectSocket();
            }
            } catch (error) {
            console.log("Error in checkAuth:", error);
            set({ authUser: null });
            get().disconnectSocket();
            } finally {
            set({ isCheckingAuth: false });
            }
        },

        logout: async () => {
            try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
            get().disconnectSocket();
            } catch (error) {
            toast.error(error.response.data.message);
            }
        },

        connectSocket: () => {
            const { authUser,socket } = get();
            const userId = authUser?.user?.id; 
            const username= authUser?.user?.username;
            const avatar_url=authUser?.user?.avatar_url;
            // More robust validation
            if (!authUser || !authUser.user || !authUser.user.id || !authUser.user.username) {
                console.log('connectSocket: Invalid authUser data, not connecting');
                return;
            }

            // Check if already connected
            if (socket?.connected) {
                console.log('connectSocket: Socket already connected');
                return;
            }

            if(socket && !socket.connected){
                console.log('connectSocket: Reconnecting existing socket');
                socket.connect();
                return;
            }
            console.log('connectSocket: Creating new socket connection for user:', userId, username);

            const newSocket = io(process.env.CLIENT_backend_URL, {
                withCredentials:true,
                query: {
                    userId,
                    username,
                    avatar_url,
                },
                autoConnect:true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            newSocket.on('connect', ()=>{
                console.log('Socket connected,', newSocket.id);
            })

            newSocket.on("getOnlineUsers", (users) => {
                console.log('connectSocket: Received online users:', users);
                set({ onlineUsers: users });
            });

            set({socket:newSocket});
        },

        disconnectSocket: () => {
            const socket=get().socket;
            if (socket?.connected) {
                console.log('disconnectSocket: Disconnecting socket');
                socket.disconnect();
            }
            set({ socket: null });
        },
    }),{
        name:'auth-storage',
        partialize:(state)=>({authUser:state.authUser}),
    }
));