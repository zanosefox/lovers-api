require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const { app } = require('./app');
const logger = require('./src/utils/logger');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000,
  pingInterval: 25000,
});

require('./src/socket')(io);

const PORT = process.env.PORT || 5000;

connectDB();

server.listen(PORT, () => {
  logger.info(`Lovers Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
});

module.exports = { app, server, io };
