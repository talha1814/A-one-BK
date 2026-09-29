import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../_models/User.js';
import Product from '../_models/Product.js';
import { requireAuth } from '../_middleware/auth.js';

export const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'aone_bunkabab_super_secret_jwt_token_key_2026_xyz987';

/**
 * Seed helper: ensures initial superadmin and default client exist
 */
export async function seedInitialUsersAndProducts() {
  try {
    const adminUser = process.env.ADMIN_USERNAME || 'superadmin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Check/seed Superadmin
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = new User({
        username: adminUser.toLowerCase().trim(),
        password: adminPass,
        role: 'admin',
        shopName: 'Super Admin Control Center',
        active: true,
      });
      await admin.save();
      console.log(`[Seed] 🛡️ Superadmin created: ${adminUser}`);
    }

    // 2. Check/seed default Client (A-One Bun Kabab shop)
    let client = await User.findOne({ role: 'client' });
    if (!client) {
      client = new User({
        username: 'aone',
        password: '123',
        role: 'client',
        shopName: 'A-One Bun Kabab',
        active: true,
      });
      await client.save();
      console.log(`[Seed] 🏪 Default client created: username: "aone", password: "123"`);
    }

    // 3. Check/seed default products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const defaultProducts = [
        {
          clientId: 'global',
          name: 'Bun Kabab',
          price: 80,
          description: 'Authentic Daal & Shami patty with fluffy spiced egg, crisp onions, tangy tamarind & mint chutney.',
          category: 'bun-kabab',
          emoji: '🍔',
          sortOrder: 1,
          active: true,
        },
        {
          clientId: 'global',
          name: 'Classic Bun Kabab',
          price: 100,
          description: 'Special Bun Kabab with premium spiced egg patty & extra flavorful toppings.',
          category: 'bun-kabab',
          emoji: '⭐',
          sortOrder: 2,
          active: true,
        },
        {
          clientId: 'global',
          name: 'Premium Anda Bun Kabab',
          price: 150,
          description: 'Jumbo Royal Bun Kabab with double patty, extra egg & signature secret chutney.',
          category: 'bun-kabab',
          emoji: '👑',
          sortOrder: 3,
          active: true,
        },
      ];
      await Product.insertMany(defaultProducts);
      console.log(`[Seed] 🍔 Default 3 products seeded into database.`);
    }
  } catch (err) {
    console.error('[Seed] Warning during initial seed:', err.message);
  }
}

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both username and password.',
      });
    }

    // Trigger seed in case database was just initialized
    await seedInitialUsersAndProducts();

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        error: 'This account has been disabled. Please contact Super Admin.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    // JWT contains { userId, role, clientId }
    // For clients, clientId is user._id.toString()
    const clientId = user.role === 'client' ? user._id.toString() : null;

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      clientId: clientId,
      username: user.username,
      shopName: user.shopName,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '7d', // 7 days expiration
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        clientId: clientId,
        shopName: user.shopName,
      },
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred during login.',
    });
  }
});

/**
 * GET /api/auth/me
 * Protected by requireAuth
 */
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        error: 'User account not found or disabled.',
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        clientId: user.role === 'client' ? user._id.toString() : null,
        shopName: user.shopName,
      },
    });
  } catch (err) {
    console.error('[Auth /me Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Could not fetch user profile.',
    });
  }
});

export default authRouter;
