import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './_lib/mongodb.js';
import { authRouter, seedInitialUsersAndProducts } from './_routes/auth.js';
import { productRouter } from './_routes/products.js';
import { salesRouter } from './_routes/sales.js';
import { expenseRouter } from './_routes/expenses.js';
import { creditRouter } from './_routes/credits.js';
import { adminRouter } from './_routes/admin.js';
import { cronRouter } from './_routes/cron.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB connection is established on requests (cached Mongoose for Vercel Serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[API Error] Database connection failed:', err.message);
    return res.status(503).json({
      success: false,
      error: 'MongoDB connection failed. Check MONGODB_URI and Atlas Network Access (0.0.0.0/0).',
    });
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'A-One Bun Kabab POS + ERP API',
    database: 'MongoDB Atlas (aone_bunkabab)',
    timestamp: new Date().toISOString(),
  });
});

// Seed check endpoint
app.get('/api/seed', async (req, res) => {
  try {
    await seedInitialUsersAndProducts();
    res.json({ success: true, message: 'Initial data checked and seeded if needed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount modular API routes
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/sales', salesRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/credits', creditRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cron', cronRouter);
app.use('/api/rollover', cronRouter); // Alias for rollover

// 404 handler for unmatched /api routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `API route ${req.originalUrl || req.url} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled API Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

export default app;
