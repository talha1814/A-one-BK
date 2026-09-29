import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aone_bun_kabab_super_secret_jwt_key_2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Verify client login credentials
 * @param {string} username
 * @param {string} password
 */
export function verifyCredentials(username, password) {
  return (
    String(username).trim().toLowerCase() === ADMIN_USERNAME.toLowerCase() &&
    String(password) === ADMIN_PASSWORD
  );
}

/**
 * Sign a JWT token (valid for 30 days for mobile convenience)
 * @param {string} username
 */
export function signToken(username) {
  return jwt.sign(
    {
      username,
      role: 'admin',
      issuedAt: Date.now(),
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Express middleware to verify JWT token
 */
export function requireAuth(req, res, next) {
  // Support Authorization header: "Bearer <token>" or query param "?token=<token>"
  const authHeader = req.headers.authorization;
  const token =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) ||
    req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.',
    });
  }
}
