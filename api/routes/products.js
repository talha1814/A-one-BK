import express from 'express';
import Product from '../models/Product.js';
import { requireAuth, getTenantClientId } from '../middleware/auth.js';

export const productRouter = express.Router();

// Helper to seed default products if empty
async function ensureDefaultProducts() {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany([
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
    ]);
  }
}

/**
 * GET /api/products
 * Returns active products (either global or client-specific)
 */
productRouter.get('/', requireAuth, async (req, res) => {
  try {
    await ensureDefaultProducts();
    const clientId = getTenantClientId(req);

    let filter = { active: true };
    if (clientId) {
      filter.$or = [{ clientId: 'global' }, { clientId: clientId }];
    }

    const products = await Product.find(filter).sort({ sortOrder: 1, createdAt: 1 });
    return res.json({ success: true, products });
  } catch (err) {
    console.error('[Products GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch products.' });
  }
});

/**
 * POST /api/products
 * Add product (Admin or Client)
 */
productRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { name, price, description, category, emoji, sortOrder } = req.body;
    if (!name || price === undefined || price === null) {
      return res.status(400).json({ success: false, error: 'Name and price are required.' });
    }

    const clientId = req.user.role === 'admin' ? (req.body.clientId || 'global') : req.user.clientId;

    const product = new Product({
      clientId,
      name: name.trim(),
      price: Number(price),
      description: description || '',
      category: category || 'bun-kabab',
      emoji: emoji || '🍔',
      sortOrder: sortOrder || 0,
      active: true,
    });

    await product.save();
    return res.status(201).json({ success: true, product });
  } catch (err) {
    console.error('[Products POST Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not create product.' });
  }
});

/**
 * PUT /api/products/:id
 * Update product
 */
productRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category, emoji, sortOrder, active } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    // Check permission
    if (req.user.role !== 'admin' && product.clientId !== 'global' && product.clientId !== req.user.clientId) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this product.' });
    }

    if (name !== undefined) product.name = name.trim();
    if (price !== undefined) product.price = Number(price);
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (emoji !== undefined) product.emoji = emoji;
    if (sortOrder !== undefined) product.sortOrder = sortOrder;
    if (active !== undefined) product.active = active;

    await product.save();
    return res.json({ success: true, product });
  } catch (err) {
    console.error('[Products PUT Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not update product.' });
  }
});

/**
 * DELETE /api/products/:id
 * Soft delete or remove product
 */
productRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    if (req.user.role !== 'admin' && product.clientId !== req.user.clientId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this product.' });
    }

    // Soft delete by setting active to false
    product.active = false;
    await product.save();

    return res.json({ success: true, message: 'Product removed.' });
  } catch (err) {
    console.error('[Products DELETE Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not delete product.' });
  }
});

export default productRouter;
