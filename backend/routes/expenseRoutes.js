import express from 'express';
import { Expense } from '../models/Expense.js';
import { getBusinessDate } from '../utils/businessDate.js';
import { connectDB, dbState } from '../config/db.js';

export const expenseRouter = express.Router();

// Memory store fallback if DB is temporarily disconnected
let memoryExpenses = [
  {
    _id: 'exp_demo_1',
    businessDate: getBusinessDate(),
    title: 'Daal & Kabab Spices',
    category: 'raw-material',
    amount: 1200,
    notes: 'Bought from wholesale market',
    createdAt: new Date(),
  },
  {
    _id: 'exp_demo_2',
    businessDate: getBusinessDate(),
    title: 'Cooking Oil 5 Liters',
    category: 'raw-material',
    amount: 2150,
    notes: 'Habib oil',
    createdAt: new Date(),
  }
];

export async function getExpensesList(filter = {}) {
  await connectDB();
  if (dbState.status === 'connected') {
    return await Expense.find(filter).sort({ createdAt: -1 });
  }
  return filter.businessDate
    ? memoryExpenses.filter((e) => e.businessDate === filter.businessDate)
    : memoryExpenses;
}

/**
 * GET /api/expenses
 * Query params: ?date=YYYY-MM-DD (defaults to all or specific date)
 */
expenseRouter.get('/', async (req, res) => {
  try {
    await connectDB();
    const filter = {};
    if (req.query.date) {
      filter.businessDate = req.query.date;
    }

    let expenses = [];
    if (dbState.status === 'connected') {
      expenses = await Expense.find(filter).sort({ createdAt: -1 });
    } else {
      expenses = req.query.date
        ? memoryExpenses.filter((e) => e.businessDate === req.query.date)
        : memoryExpenses;
    }

    const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const byCategory = expenses.reduce((acc, e) => {
      const cat = e.category || 'other';
      acc[cat] = (acc[cat] || 0) + Number(e.amount || 0);
      return acc;
    }, {});

    res.json({
      success: true,
      businessDate: req.query.date || getBusinessDate(),
      totalExpense,
      byCategory,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/expenses
 * Body: { title, category, amount, notes, date? }
 */
expenseRouter.post('/', async (req, res) => {
  try {
    await connectDB();
    const { title, category, amount, notes, date } = req.body;

    if (!title || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Expense title and amount are required.',
      });
    }

    const targetDate = date || getBusinessDate();

    if (dbState.status === 'connected') {
      const expense = await Expense.create({
        businessDate: targetDate,
        title: String(title).trim(),
        category: category || 'raw-material',
        amount: Number(amount),
        notes: notes ? String(notes).trim() : '',
        createdAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Expense recorded successfully.',
        data: expense,
      });
    } else {
      // Memory fallback
      const expense = {
        _id: 'exp_mem_' + Date.now(),
        businessDate: targetDate,
        title: String(title).trim(),
        category: category || 'raw-material',
        amount: Number(amount),
        notes: notes ? String(notes).trim() : '',
        createdAt: new Date(),
      };
      memoryExpenses.unshift(expense);

      return res.status(201).json({
        success: true,
        message: 'Expense recorded (offline cache).',
        data: expense,
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/expenses/:id
 */
expenseRouter.delete('/:id', async (req, res) => {
  try {
    await connectDB();
    if (dbState.status === 'connected') {
      await Expense.findByIdAndDelete(req.params.id);
    } else {
      memoryExpenses = memoryExpenses.filter((e) => e._id !== req.params.id);
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
