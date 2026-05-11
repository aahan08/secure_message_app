require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const { createApp } = require('./app');
const { validateEnv } = require('./config/env');
const { connectDatabase } = require('./config/database');
const { initChatSocket } = require('./sockets/chatSocket');

async function start() {
  const env = validateEnv(process.env);
  process.env.JWT_SECRET = env.JWT_SECRET;

  await connectDatabase(env.MONGO_URI);

  const app = createApp({ env });
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN
        ? env.CORS_ORIGIN.split(',').map((item) => item.trim()).filter(Boolean)
        : true,
      credentials: true
    }
  });

  initChatSocket(io);

  server.listen(env.PORT, () => {
    console.log(`Obscure backend listening on port ${env.PORT}`);
  });

  return server;
}

start().catch((err) => {
  console.error('Failed to start backend:', err.message);
  process.exit(1);
});
