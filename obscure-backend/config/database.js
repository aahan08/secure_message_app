const mongoose = require('mongoose');

function registerMongoLogging(connection = mongoose.connection) {
  connection.on('connected', () => console.log('MongoDB connected'));
  connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  connection.on('reconnected', () => console.log('MongoDB reconnected'));
  connection.on('error', (err) => console.error('MongoDB connection error:', err.message));
}

async function connectDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }

  registerMongoLogging();
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
  return mongoose.connection;
}

function getMongoStatus(connection = mongoose.connection) {
  switch (connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
}

module.exports = {
  connectDatabase,
  getMongoStatus,
  registerMongoLogging
};
