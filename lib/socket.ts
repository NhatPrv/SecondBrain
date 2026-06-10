import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) {
    // If token has changed, we might need to reconnect with the new token
    const currentToken = getToken();
    if (socket.auth && (socket.auth as any).token !== currentToken) {
      (socket.auth as any).token = currentToken || '';
      if (socket.connected) {
        socket.disconnect().connect();
      }
    }
    return socket;
  }

  const token = getToken();

  socket = io(SOCKET_URL, {
    auth: {
      token: token || '',
    },
    autoConnect: false,
    transports: ['websocket'],
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
