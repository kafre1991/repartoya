'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    // In development (next dev), the custom server isn't running, 
    // so we handle the connection failure gracefully.
    socket = io({
      reconnectionAttempts: 2,
      timeout: 3000,
    });

    socket.on('connect_error', () => {
      // Silent fail in dev, it will work in production (Railway)
    });
  }
  return socket;
};
