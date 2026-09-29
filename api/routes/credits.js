import express from 'express';
import Credit from '../models/Credit.js';
import { requireAuth, getTenantClientId } from '../middleware/auth.js';
import { getBusinessDate } from '../utils/getBusinessDate.js';

export const creditRouter = express.Router();

/**
 * POST /api/credits
 * Create a new credit / udhaar entry
 */
creditRouter.post('/', requireAuth, async (req, res) => {
  try {
    const {
      customerName,
      phone,
      items,
      totalAmount,
      paidAmount = 0,
      date,
      notes,
    } = req.body;

    if (!customerName || totalAmount === undefined) {
      return res.status(400).json({ success: false, error: 'Customer Name and Total Amount are required.' });
    }

    const total = Number(totalAmount);
    const paid = Number(paidAmount) || 0;
    const remaining = Math.max(0, total - paid);

    let status = 'unpaid';
    if (remaining === 0) status = 'paid';
    else if (paid > 0) status = 'partial';

    const clientId = req.user.role === 'admin' ? (req.body.clientId || req.user.clientId) : req.user.clientId;
    const businessDate = date || getBusinessDate();

    const payments = [];
    if (paid > 0) {
      payments.push({
        amount: paid,
        date: new Date(),
        note: 'Initial payment at record creation',
      });
    }

    const credit = new Credit({
      clientId,
      customerName: customerName.trim(),
      phone: (phone || '').trim(),
      items: typeof items === 'string' ? items.trim() : JSON.stringify(items),
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      status,
      businessDate,
      notes: notes || '',
      payments,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await credit.save();
    return res.status(201).json({ success: true, credit, message: 'Credit record created successfully.' });
  } catch (err) {
    console.error('[Credit POST Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not create credit record.' });
  }
});

/**
 * GET /api/credits
 * Get credit list with filters & search
 */
creditRouter.get('/', requireAuth, async (req, res) => {
  try {
    const clientId = getTenantClientId(req);
    const { status, search } = req.query;

    let query = {};
    if (clientId) query.clientId = clientId;

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { phone: searchRegex },
        { items: searchRegex },
      ];
    }

    const credits = await Credit.find(query).sort({ status: 1, updatedAt: -1 });

    // Calculate total outstanding udhaar
    const totalOutstanding = credits
      .filter(c => c.status !== 'paid')
      .reduce((sum, c) => sum + (c.remainingAmount || 0), 0);

    return res.json({
      success: true,
      totalOutstanding,
      count: credits.length,
      credits,
    });
  } catch (err) {
    console.error('[Credit GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch credit records.' });
  }
});

/**
 * GET /api/credits/unpaid
 * Quick fetch for active debtors
 */
creditRouter.get('/unpaid', requireAuth, async (req, res) => {
  try {
    const clientId = getTenantClientId(req);
    let query = { status: { $in: ['unpaid', 'partial'] } };
    if (clientId) query.clientId = clientId;

    const credits = await Credit.find(query).sort({ updatedAt: -1 });
    const totalOutstanding = credits.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);

    return res.json({ success: true, totalOutstanding, credits });
  } catch (err) {
    console.error('[Credit Unpaid GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch unpaid credits.' });
  }
});

/**
 * POST /api/credits/:id/payment
 * Record a payment against credit
 */
creditRouter.post('/:id/payment', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, note } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required.' });
    }

    const credit = await Credit.findById(id);
    if (!credit) {
      return res.status(404).json({ success: false, error: 'Credit record not found.' });
    }

    if (req.user.role !== 'admin' && credit.clientId !== req.user.clientId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to modify this record.' });
    }

    // Update paid and remaining amounts
    credit.paidAmount = (credit.paidAmount || 0) + paymentAmount;
    credit.remainingAmount = Math.max(0, credit.totalAmount - credit.paidAmount);

    if (credit.remainingAmount <= 0) {
      credit.status = 'paid';
    } else {
      credit.status = 'partial';
    }

    credit.payments.push({
      amount: paymentAmount,
      date: new Date(),
      note: note || 'Customer payment received',
    });

    credit.updatedAt = new Date();
    await credit.save();

    return res.json({
      success: true,
      credit,
      message: `Payment of Rs ${paymentAmount} recorded! Remaining: Rs ${credit.remainingAmount}`,
    });
  } catch (err) {
    console.error('[Credit Payment POST Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not record payment.' });
  }
});

/**
 * DELETE /api/credits/:id
 * Delete credit record
 */
creditRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const credit = await Credit.findById(id);
    if (!credit) {
      return res.status(404).json({ success: false, error: 'Credit record not found.' });
    }

    if (req.user.role !== 'admin' && credit.clientId !== req.user.clientId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this credit record.' });
    }

    await Credit.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Credit record deleted.' });
  } catch (err) {
    console.error('[Credit DELETE Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not delete credit record.' });
  }
});

export default creditRouter;
