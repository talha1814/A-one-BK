import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { salesRouter } from './routes/salesRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { expenseRouter } from './routes/expenseRoutes.js';
import { creditRouter } from './routes/creditRoutes.js';
import { reportRouter } from './routes/reportRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB connection is initiated on requests (crucial for Vercel serverless cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    // Non-blocking: let route handlers proceed or report DB status
  }
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/credit', creditRouter);
app.use('/api/reports', reportRouter);
app.use('/api', salesRouter);

// Serve frontend static assets from backend/static
const staticDir = path.join(__dirname, 'static');
app.use(express.static(staticDir));

// Catch-all to serve frontend index.html or 404 for unmatched /api routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: `API route ${req.path} not found.` });
  }
  res.sendFile(path.join(staticDir, 'index.html'));
});

export default app;
