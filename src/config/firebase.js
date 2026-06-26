const admin = require('firebase-admin');
const logger = require('../utils/logger');

const initializeFirebase = () => {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
    logger.info('Firebase initialized successfully');
  } catch (error) {
    logger.error(`Firebase init error: ${error.message}`);
  }
};

module.exports = { admin, initializeFirebase };
