require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initializeFirebase } = require('./src/config/firebase');
const logger = require('./src/utils/logger');

const app = express();
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/user'));
app.use('/api/rooms', require('./src/routes/room'));
app.use('/api/gifts', require('./src/routes/gift'));
app.use('/api/vehicles', require('./src/routes/vehicle'));
app.use('/api/agencies', require('./src/routes/agency'));
app.use('/api/posts', require('./src/routes/post'));
app.use('/api/stories', require('./src/routes/story'));
app.use('/api/wallet', require('./src/routes/wallet'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/tasks', require('./src/routes/task'));
app.use('/api/notifications', require('./src/routes/notification'));
app.use('/api/config', require('./src/routes/config'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Lovers API is running', timestamp: new Date() });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

initializeFirebase();

module.exports = { app };
