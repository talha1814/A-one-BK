import express from 'express';
import { verifyCredentials, signToken, requireAuth } from '../utils/auth.js';

export const authRouter = express.Router();

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
authRouter.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please enter both Username and Password.',
    });
  }

  const isValid = verifyCredentials(username, password);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid User ID or Password. Please try again.',
    });
  }

  const token = signToken(username);

  res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      username,
      role: 'admin',
    },
  });
});

/**
 * GET /api/auth/me
 * Validate current session
 */
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});
