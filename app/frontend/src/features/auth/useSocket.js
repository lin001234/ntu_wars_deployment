import { useEffect } from "react";
import io from 'socket.io-client';

const useSocket =(userId)=>{
    useEffect(() =>{
        const socket = io(process.env.CLIENT_URL,{
            query:{
                userId: userId,
            },
        });

        socket.on('connect',() =>{
            console.log('Socket connected to server');

            socket.emit('join,')
        })
    })
}