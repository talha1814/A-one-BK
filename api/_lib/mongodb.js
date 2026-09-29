import mongoose from 'mongoose';

/**
 * =====================================================================
 * MongoDB Atlas Cached Connection for Vercel Serverless
 * =====================================================================
 * 
 * Vercel Serverless Functions re-invoke files on cold starts.
 * To avoid exhausting connection pools and incurring connection latency,
 * we store a cached promise and connection in global.mongoose.
 */

const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb://themultitaskers31_db_user:ZJxFDKvlEvTLEAmX@ac-inuby7g-shard-00-00.lkajwq4.mongodb.net:27017,ac-inuby7g-shard-00-01.lkajwq4.mongodb.net:27017,ac-inuby7g-shard-00-02.lkajwq4.mongodb.net:27017/aone_bunkabab?replicaSet=atlas-pki0ex-shard-0&ssl=true&authSource=admin';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      bufferCommands: false,
    };

    console.log('[MongoDB] 🔄 Connecting to MongoDB Atlas...');

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('[MongoDB] ✅ Successfully connected to MongoDB Atlas (aone_bunkabab)');
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      console.error('[MongoDB] ❌ MongoDB connection failed. Check MONGODB_URI and Atlas Network Access (0.0.0.0/0).');
      console.error('[MongoDB] Error details:', err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
