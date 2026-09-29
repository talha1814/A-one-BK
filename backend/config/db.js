import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');

/**
 * MongoDB Atlas / Local Connection Manager
 * 
 * Supports:
 * - Local auth: mongodb://USERNAME:PASSWORD@localhost:27017/?authSource=admin
 * - Local default: mongodb://localhost:27017/salesDB
 * - MongoDB Atlas cloud: mongodb+srv://user:pass@cluster.../salesDB
 */

const DB_NAME = 'salesDB';

let activeMongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salesDB';

function maskURI(uri) {
  if (!uri) return '';
  return uri.replace(/:([^:@]{3,})@/, ':****@');
}

export const dbState = {
  status: 'disconnected', // 'connected' | 'disconnected' | 'connecting' | 'error'
  lastError: null,
  lastConnectedAt: null,
  uriType: activeMongoURI.startsWith('mongodb+srv://') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB',
  uri: maskURI(activeMongoURI),
  dbName: DB_NAME,
  isAtlas: activeMongoURI.startsWith('mongodb+srv://'),
};

// Global cache for serverless environments (Vercel)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

let lastFailureTime = 0;
const RETRY_COOLDOWN_MS = 15000;

/**
 * Connect to MongoDB instance
 * @param {boolean} force - Force retry immediately ignoring cooldown
 */
export async function connectDB(force = false) {
  if (cached.conn && mongoose.connection.readyState === 1) {
    dbState.status = 'connected';
    return cached.conn;
  }

  if (mongoose.connection.readyState === 1) {
    dbState.status = 'connected';
    cached.conn = mongoose;
    return cached.conn;
  }

  // If in connection progress, return existing promise
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      return null;
    }
  }

  // Throttle retries if failed recently
  if (!force && dbState.status === 'error' && Date.now() - lastFailureTime < RETRY_COOLDOWN_MS) {
    return null;
  }

  dbState.status = 'connecting';
  dbState.lastError = null;
  dbState.uriType = activeMongoURI.startsWith('mongodb+srv://') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB';
  dbState.uri = maskURI(activeMongoURI);
  dbState.isAtlas = activeMongoURI.startsWith('mongodb+srv://');

  console.log(`[MongoDB] 🔄 Connecting to ${dbState.uriType}: ${dbState.uri}...`);

  const opts = {
    dbName: DB_NAME,
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    autoIndex: true,
  };

  cached.promise = mongoose.connect(activeMongoURI, opts).then((m) => {
    dbState.status = 'connected';
    dbState.lastConnectedAt = new Date();
    dbState.lastError = null;
    console.log(`[MongoDB] ✅ Successfully connected to ${dbState.uriType}! (Database: ${DB_NAME})`);
    return m;
  }).catch((err) => {
    dbState.status = 'error';
    dbState.lastError = err.message;
    lastFailureTime = Date.now();
    cached.promise = null;
    console.error(`[MongoDB] ❌ Connection error (${err.message})`);
    throw err;
  });

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    return null;
  }
}

/**
 * Update connection string dynamically and persist to .env
 * @param {string} newUri 
 */
export async function updateMongoURI(newUri) {
  if (!newUri || !newUri.trim()) {
    throw new Error('MongoDB URI cannot be empty');
  }

  const cleanUri = newUri.trim();

  // Disconnect existing if any
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (e) {}

  cached.conn = null;
  cached.promise = null;
  activeMongoURI = cleanUri;
  process.env.MONGODB_URI = cleanUri;

  // Persist to .env file
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('MONGODB_URI=')) {
        envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${cleanUri}`);
      } else {
        envContent += `\nMONGODB_URI=${cleanUri}\n`;
      }
    } else {
      envContent = `MONGODB_URI=${cleanUri}\nPORT=5000\nADMIN_USERNAME=admin\nADMIN_PASSWORD=admin123\nJWT_SECRET=aone_bun_kabab_super_secret_jwt_key_2026_xyz\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`[MongoDB] 💾 Updated MONGODB_URI in ${envPath}`);
  } catch (err) {
    console.warn('[MongoDB] Warning: Could not write to .env:', err.message);
  }

  // Attempt connection with new URI (forced)
  await connectDB(true);

  return {
    success: dbState.status === 'connected',
    status: dbState.status,
    uriType: dbState.uriType,
    maskedUri: dbState.uri,
    error: dbState.lastError,
  };
}

export function getActiveURI() {
  return activeMongoURI;
}

// Lifecycle events
mongoose.connection.on('connected', () => {
  dbState.status = 'connected';
  dbState.lastConnectedAt = new Date();
  dbState.lastError = null;
});

mongoose.connection.on('error', (err) => {
  dbState.status = 'error';
  dbState.lastError = err.message;
});

mongoose.connection.on('disconnected', () => {
  dbState.status = 'disconnected';
});
