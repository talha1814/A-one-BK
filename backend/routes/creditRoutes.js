import express from 'express';
import { CreditCustomer } from '../models/CreditCustomer.js';
import { getBusinessDate } from '../utils/businessDate.js';
import { connectDB, dbState } from '../config/db.js';

export const creditRouter = express.Router();

// Memory store fallback
let memoryCustomers = [
  {
    _id: 'cust_1',
    name: 'Rashid Electrician',
    phone: '0301-2345678',
    balance: 850,
    notes: 'Shop #3 across the street',
    transactions: [
      {
        _id: 'tx_1',
        type: 'credit',
        amount: 850,
        date: getBusinessDate(),
        description: '6 Bun Kababs for workshop staff',
        createdAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'cust_2',
    name: 'Tariq Bhai Tyre Shop',
    phone: '0322-8765432',
    balance: 400,
    notes: 'Daily tea & evening snacks',
    transactions: [
      {
        _id: 'tx_2',
        type: 'credit',
        amount: 1000,
        date: getBusinessDate(),
        description: 'Weekly account',
        createdAt: new Date(),
      },
      {
        _id: 'tx_3',
        type: 'payment',
        amount: 600,
        date: getBusinessDate(),
        description: 'Cash payment received',
        createdAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export async function getCustomersList() {
  await connectDB();
  if (dbState.status === 'connected') {
    return await CreditCustomer.find().sort({ balance: -1, name: 1 });
  }
  return memoryCustomers;
}

/**
 * GET /api/credit
 * List all credit customers with total outstanding balance
 */
creditRouter.get('/', async (req, res) => {
  try {
    await connectDB();
    let customers = [];

    if (dbState.status === 'connected') {
      customers = await CreditCustomer.find().sort({ balance: -1, name: 1 });
    } else {
      customers = memoryCustomers;
    }

    const totalOutstanding = customers.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);
    const activeDebtorsCount = customers.filter((c) => Number(c.balance) > 0).length;

    res.json({
      success: true,
      totalOutstanding,
      activeDebtorsCount,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/credit/customer
 * Add a new customer to the credit book
 */
creditRouter.post('/customer', async (req, res) => {
  try {
    await connectDB();
    const { name, phone, notes, initialBalance } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required.',
      });
    }

    const initBal = Number(initialBalance) || 0;
    const initialTx = initBal > 0 ? [
      {
        type: 'credit',
        amount: initBal,
        date: getBusinessDate(),
        description: 'Opening balance',
        createdAt: new Date(),
      }
    ] : [];

    if (dbState.status === 'connected') {
      const customer = await CreditCustomer.create({
        name: name.trim(),
        phone: phone ? phone.trim() : '',
        balance: initBal,
        notes: notes ? notes.trim() : '',
        transactions: initialTx,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: `Customer ${customer.name} added to Udhaar ledger.`,
        data: customer,
      });
    } else {
      const customer = {
        _id: 'cust_mem_' + Date.now(),
        name: name.trim(),
        phone: phone ? phone.trim() : '',
        balance: initBal,
        notes: notes ? notes.trim() : '',
        transactions: initialTx,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryCustomers.unshift(customer);

      return res.status(201).json({
        success: true,
        message: `Customer ${customer.name} added (offline cache).`,
        data: customer,
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/credit/transaction
 * Record credit (Udhaar Diya) OR payment (Vasooli Li)
 * Body: { customerId, type: 'credit'|'payment', amount, description, date? }
 */
creditRouter.post('/transaction', async (req, res) => {
  try {
    await connectDB();
    const { customerId, type, amount, description, date } = req.body;

    if (!customerId || !type || !amount) {
      return res.status(400).json({
        success: false,
        error: 'customerId, type (credit/payment), and amount are required.',
      });
    }

    const numAmount = Math.max(1, Number(amount) || 0);
    const txDate = date || getBusinessDate();
    const newTx = {
      type: type === 'payment' ? 'payment' : 'credit',
      amount: numAmount,
      date: txDate,
      description: description ? description.trim() : '',
      createdAt: new Date(),
    };

    if (dbState.status === 'connected') {
      const customer = await CreditCustomer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer not found.' });
      }

      customer.transactions.push(newTx);
      customer.recalculateBalance();
      await customer.save();

      return res.json({
        success: true,
        message: type === 'payment'
          ? `Rs ${numAmount} payment recorded for ${customer.name}. New balance: Rs ${customer.balance}.`
          : `Rs ${numAmount} credit added for ${customer.name}. New balance: Rs ${customer.balance}.`,
        data: customer,
      });
    } else {
      const customer = memoryCustomers.find((c) => c._id === customerId);
      if (!customer) {
        return res.status(404).json({ success: false, error: 'Customer not found in memory.' });
      }

      customer.transactions.push({ ...newTx, _id: 'tx_mem_' + Date.now() });
      if (type === 'credit') {
        customer.balance = (customer.balance || 0) + numAmount;
      } else {
        customer.balance = (customer.balance || 0) - numAmount;
      }
      customer.updatedAt = new Date();

      return res.json({
        success: true,
        message: `Transaction recorded for ${customer.name}. Balance: Rs ${customer.balance}.`,
        data: customer,
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/credit/customer/:id
 * Get customer details and transaction statement
 */
creditRouter.get('/customer/:id', async (req, res) => {
  try {
    await connectDB();
    let customer = null;

    if (dbState.status === 'connected') {
      customer = await CreditCustomer.findById(req.params.id);
    } else {
      customer = memoryCustomers.find((c) => c._id === req.params.id);
    }

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found.' });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/credit/customer/:id
 */
creditRouter.delete('/customer/:id', async (req, res) => {
  try {
    await connectDB();
    if (dbState.status === 'connected') {
      await CreditCustomer.findByIdAndDelete(req.params.id);
    } else {
      memoryCustomers = memoryCustomers.filter((c) => c._id !== req.params.id);
    }

    res.json({
      success: true,
      message: 'Customer record deleted from ledger.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
