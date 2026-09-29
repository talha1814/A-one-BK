import express from 'express';
import Expense from '../models/Expense.js';
import { requireAuth, getTenantClientId } from '../middleware/auth.js';
import { getBusinessDate } from '../utils/getBusinessDate.js';

export const expenseRouter = express.Router();

/**
 * POST /api/expenses
 * Add a new daily expense
 */
expenseRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { description, units, unitType, price, date, notes } = req.body;

    if (!description || price === undefined || price === null) {
      return res.status(400).json({ success: false, error: 'Description and price are required.' });
    }

    const clientId = req.user.role === 'admin' ? (req.body.clientId || req.user.clientId) : req.user.clientId;
    const businessDate = date || getBusinessDate();

    const expense = new Expense({
      clientId,
      businessDate,
      description: description.trim(),
      units: Number(units) || 1,
      unitType: (unitType || 'pcs').trim(),
      price: Number(price),
      notes: notes || '',
      createdAt: new Date(),
    });

    await expense.save();
    return res.status(201).json({ success: true, expense, message: 'Expense saved successfully.' });
  } catch (err) {
    console.error('[Expense POST Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not record expense.' });
  }
});

/**
 * GET /api/expenses/today
 * Expenses for today's business day
 */
expenseRouter.get('/today', requireAuth, async (req, res) => {
  try {
    const clientId = getTenantClientId(req);
    const todayBiz = getBusinessDate();

    let query = { businessDate: todayBiz };
    if (clientId) query.clientId = clientId;

    const expenses = await Expense.find(query).sort({ createdAt: -1 });
    const totalTodayExpense = expenses.reduce((sum, e) => sum + (e.price || 0), 0);

    return res.json({
      success: true,
      businessDate: todayBiz,
      totalTodayExpense,
      expenses,
    });
  } catch (err) {
    console.error('[Expense Today GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch today\'s expenses.' });
  }
});

/**
 * GET /api/expenses/range
 * Expenses within date range (from & to)
 */
expenseRouter.get('/range', requireAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const clientId = getTenantClientId(req);

    let query = {};
    if (clientId) query.clientId = clientId;

    if (from && to) {
      query.businessDate = { $gte: from, $lte: to };
    } else if (from) {
      query.businessDate = { $gte: from };
    }

    const expenses = await Expense.find(query).sort({ businessDate: -1, createdAt: -1 });
    const totalExpense = expenses.reduce((sum, e) => sum + (e.price || 0), 0);

    return res.json({ success: true, totalExpense, expenses });
  } catch (err) {
    console.error('[Expense Range GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch expenses.' });
  }
});

/**
 * PUT /api/expenses/:id
 * Edit an expense
 */
expenseRouter.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, units, unitType, price, date, notes } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found.' });
    }

    if (req.user.role !== 'admin' && expense.clientId !== req.user.clientId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to modify this expense.' });
    }

    if (description !== undefined) expense.description = description.trim();
    if (units !== undefined) expense.units = Number(units);
    if (unitType !== undefined) expense.unitType = unitType.trim();
    if (price !== undefined) expense.price = Number(price);
    if (date !== undefined) expense.businessDate = date;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();
    return res.json({ success: true, expense, message: 'Expense updated successfully.' });
  } catch (err) {
    console.error('[Expense PUT Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not update expense.' });
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete an expense
 */
expenseRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found.' });
    }

    if (req.user.role !== 'admin' && expense.clientId !== req.user.clientId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this expense.' });
    }

    await Expense.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (err) {
    console.error('[Expense DELETE Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not delete expense.' });
  }
});

export default expenseRouter;
