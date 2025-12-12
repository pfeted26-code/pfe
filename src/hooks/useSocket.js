// hooks/useSocket.js
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const useSocket = (userId) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Connexion au serveur Socket.IO
    socketRef.current = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    // Rejoindre la room de l'utilisateur
    socketRef.current.emit('joinRoom', userId);

    console.log(`✅ Socket connecté pour utilisateur ${userId}`);

    // Cleanup à la déconnexion
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('❌ Socket déconnecté');
      }
    };
  }, [userId]);

  return socketRef.current;
};
