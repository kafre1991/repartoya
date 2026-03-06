import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function startServer() {
  const server = express();
  const httpServer = createServer(server);
  
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-room', (room) => socket.join(room));
    socket.on('new-order', (order) => {
      io.to('drivers').emit('order-update', order);
      io.to('admins').emit('order-update', order);
    });
    socket.on('order-status-change', (data) => io.emit('order-update', data));
  });

  // Start listening immediately so the platform sees the port as open
  httpServer.listen(port, hostname, () => {
    console.log(`> Server listening on port ${port}`);
  });

  try {
    await app.prepare();
    server.all('*', (req, res) => {
      return handle(req, res);
    });
    console.log('> Next.js prepared');
  } catch (err) {
    console.error('Error preparing Next.js:', err);
    process.exit(1);
  }
}

startServer();
