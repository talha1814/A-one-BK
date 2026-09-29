import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aone_bunkabab_super_secret_jwt_token_key_2026_xyz987';

/**
 * Middleware: requireAuth
 * Verifies JWT token from Authorization header (Bearer <token>)
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach decoded user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      clientId: decoded.clientId || decoded.userId,
      username: decoded.username,
      shopName: decoded.shopName,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid or malformed token.',
    });
  }
}

/**
 * Middleware: requireAdmin
 * Enforces admin-only access
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.',
    });
  }
  next();
}

/**
 * Helper to get the effective clientId for tenant queries:
 * - If admin and ?clientId is provided in query, admin can query that client (or all if omitted)
 * - If client, STRICTLY use the logged-in client's clientId (cannot query other tenants)
 */
export function getTenantClientId(req) {
  if (req.user.role === 'admin') {
    return req.query.clientId || null;
  }
  return req.user.clientId;
}

export default { requireAuth, requireAdmin, getTenantClientId };
