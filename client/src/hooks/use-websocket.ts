import { useEffect, useRef, useState } from 'react';
import { useAuth } from './use-auth';

export function useWebSocket() {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      // Authenticate with the server
      if (ws.current && user) {
        ws.current.send(JSON.stringify({
          type: 'authenticate',
          userId: user.id,
        }));
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        
        // Only dispatch specific events, avoid flooding all components
        // This prevents sidebar from re-rendering on every chat message
        if (data.type === 'user_status_changed' || data.type === 'friend_list_updated') {
          window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
        } else {
          // For chat messages, use a more specific event
          window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user]);

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
