import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useStoriesSocket = (userLocation) => {
  const [stories, setStories] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const token = localStorage.getItem('token');
    
    if (!token) return;

    // Use environment variable for URL or fallback
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ceusgame.com:5522'; 

    socketRef.current = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to stories shared socket');
    });

    socketRef.current.on('stories-update', (updatedStories) => {
      console.log('Received stories update via socket', updatedStories);
      setStories(updatedStories);
    });

    socketRef.current.on('error', (err) => {
      console.error('Socket error:', err);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Emit location update when userLocation changes
  useEffect(() => {
    if (socketRef.current && userLocation) {
        // Emit update immediately when location changes
        const emitLocation = () => {
            socketRef.current.emit('update-location', {
                latitude: userLocation.lat,
                longitude: userLocation.lng,
                radius: 10
            });
        };

        emitLocation();

        // Set up interval to re-emit location every 30 seconds (keep data fresh)
        const intervalId = setInterval(emitLocation, 30000);

        return () => clearInterval(intervalId);
    }
  }, [userLocation]);

  return { stories };
};
