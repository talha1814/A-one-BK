import express from 'express';
import Sale from '../_models/Sale.js';
import Expense from '../_models/Expense.js';
import Credit from '../_models/Credit.js';
import { requireAuth, getTenantClientId } from '../_middleware/auth.js';
import { getBusinessDate, getYesterdayBusinessDate } from '../_utils/getBusinessDate.js';

export const salesRouter = express.Router();

/**
 * POST /api/sales
 * Finalize sale from POS
 */
salesRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { items, total, customerType = 'walkin', paymentMode = 'cash', customerName = '', customerPhone = '', notes = '' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty. Please select products.' });
    }

    const calculatedTotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
    const finalTotal = total !== undefined ? Number(total) : calculatedTotal;

    const clientId = req.user.role === 'admin' ? (req.body.clientId || req.user.clientId) : req.user.clientId;
    const businessDate = req.body.businessDate || getBusinessDate();

    // Create a readable order number (e.g., #1042)
    const orderCountToday = await Sale.countDocuments({ clientId, businessDate });
    const orderNumber = `#${orderCountToday + 1}`;

    const newSale = new Sale({
      clientId,
      orderNumber,
      items: items.map(item => ({
        productId: item.id || item.productId || '',
        name: item.name,
        price: Number(item.price),
        qty: Number(item.qty),
        lineTotal: Number(item.price) * Number(item.qty),
      })),
      total: finalTotal,
      customerType,
      paymentMode,
      customerName: customerName.trim(),
      businessDate,
      printed: !!req.body.printed,
      createdAt: new Date(),
    });

    // If payment mode is "credit" (On Account / Udhaar), link or create credit document
    if (paymentMode === 'credit' && customerName.trim()) {
      const creditItemsSummary = items.map(i => `${i.qty}x ${i.name}`).join(', ');
      const credit = new Credit({
        clientId,
        customerName: customerName.trim(),
        phone: customerPhone.trim(),
        items: creditItemsSummary,
        totalAmount: finalTotal,
        paidAmount: 0,
        remainingAmount: finalTotal,
        status: 'unpaid',
        businessDate,
        notes: notes || `Created from POS Order ${orderNumber}`,
        saleId: newSale._id,
      });
      await credit.save();
      newSale.creditId = credit._id;
    }

    await newSale.save();

    return res.status(201).json({
      success: true,
      sale: newSale,
      message: 'Sale finalized successfully!',
    });
  } catch (err) {
    console.error('[Sales POST Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not record sale. Please try again.' });
  }
});

/**
 * GET /api/sales/today
 * Sales for the current 4 AM business day
 */
salesRouter.get('/today', requireAuth, async (req, res) => {
  try {
    const clientId = getTenantClientId(req);
    const todayBiz = getBusinessDate();

    let query = { businessDate: todayBiz };
    if (clientId) query.clientId = clientId;

    const sales = await Sale.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, businessDate: todayBiz, sales });
  } catch (err) {
    console.error('[Sales Today GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch today\'s sales.' });
  }
});

/**
 * GET /api/sales/dashboard
 * Aggregated metrics for Dashboard (Today & Yesterday Sales, Expenses, Profit, Outstanding Credit, Top Products)
 */
salesRouter.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const clientId = getTenantClientId(req);
    const todayBiz = getBusinessDate();
    const yesterdayBiz = getYesterdayBusinessDate();

    const clientFilter = clientId ? { clientId } : {};

    // 1. Today's sales
    const todaySales = await Sale.find({ ...clientFilter, businessDate: todayBiz }).sort({ createdAt: -1 });
    const todaySaleTotal = todaySales.reduce((acc, s) => acc + (s.total || 0), 0);
    const todayOrdersCount = todaySales.length;

    // 2. Yesterday's sales
    const yesterdaySales = await Sale.find({ ...clientFilter, businessDate: yesterdayBiz });
    const yesterdaySaleTotal = yesterdaySales.reduce((acc, s) => acc + (s.total || 0), 0);

    // 3. Today's expenses
    const todayExpenses = await Expense.find({ ...clientFilter, businessDate: todayBiz }).sort({ createdAt: -1 });
    const todayExpenseTotal = todayExpenses.reduce((acc, e) => acc + (e.price || 0), 0);

    // 4. Net profit today
    const todayNetProfit = todaySaleTotal - todayExpenseTotal;

    // 5. Total outstanding credit (all unpaid or partial across all time)
    const credits = await Credit.find({
      ...clientFilter,
      status: { $in: ['unpaid', 'partial'] },
    });
    const outstandingCredit = credits.reduce((acc, c) => acc + (c.remainingAmount || 0), 0);

    // 6. Top selling products today
    const productStats = {};
    for (const sale of todaySales) {
      for (const item of sale.items || []) {
        const key = item.name;
        if (!productStats[key]) {
          productStats[key] = { name: item.name, qty: 0, revenue: 0 };
        }
        productStats[key].qty += (item.qty || 0);
        productStats[key].revenue += (item.lineTotal || (item.price * item.qty) || 0);
      }
    }
    const topProducts = Object.values(productStats).sort((a, b) => b.qty - a.qty);

    // 7. Recent sales (last 10)
    const recentSales = todaySales.slice(0, 10);

    // 8. Recent expenses (last 5)
    const recentExpenses = todayExpenses.slice(0, 5);

    return res.json({
      success: true,
      businessDate: todayBiz,
      yesterdayDate: yesterdayBiz,
      metrics: {
        todaySale: todaySaleTotal,
        yesterdaySale: yesterdaySaleTotal,
        todayExpense: todayExpenseTotal,
        todayNetProfit: todayNetProfit,
        outstandingCredit: outstandingCredit,
        totalOrdersToday: todayOrdersCount,
      },
      topProducts,
      recentSales,
      recentExpenses,
    });
  } catch (err) {
    console.error('[Sales Dashboard GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch dashboard metrics.' });
  }
});

/**
 * GET /api/sales/date/:date
 * Sales for specific business date (YYYY-MM-DD)
 */
salesRouter.get('/date/:date', requireAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const clientId = getTenantClientId(req);

    let query = { businessDate: date };
    if (clientId) query.clientId = clientId;

    const sales = await Sale.find(query).sort({ createdAt: -1 });
    const expenses = await Expense.find(query).sort({ createdAt: -1 });
    const credits = await Credit.find(query).sort({ createdAt: -1 });

    const totalSale = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalExpense = expenses.reduce((acc, e) => acc + (e.price || 0), 0);
    const netProfit = totalSale - totalExpense;

    return res.json({
      success: true,
      date,
      totalSale,
      totalOrders: sales.length,
      totalExpense,
      netProfit,
      sales,
      expenses,
      credits,
    });
  } catch (err) {
    console.error('[Sales Date GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch date details.' });
  }
});

/**
 * GET /api/sales/range
 * Sales in business date range (from & to)
 */
salesRouter.get('/range', requireAuth, async (req, res) => {
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

    const sales = await Sale.find(query).sort({ businessDate: -1, createdAt: -1 });
    return res.json({ success: true, sales });
  } catch (err) {
    console.error('[Sales Range GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch sales range.' });
  }
});

/**
 * GET /api/sales/report
 * Detailed aggregated report overview for date range
 */
salesRouter.get('/report', requireAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const todayBiz = getBusinessDate();
    const startDate = from || todayBiz;
    const endDate = to || todayBiz;

    const clientId = getTenantClientId(req);
    const clientFilter = clientId ? { clientId } : {};

    const dateFilter = { businessDate: { $gte: startDate, $lte: endDate } };

    // Fetch sales and expenses in range
    const [sales, expenses] = await Promise.all([
      Sale.find({ ...clientFilter, ...dateFilter }).sort({ businessDate: -1, createdAt: -1 }),
      Expense.find({ ...clientFilter, ...dateFilter }).sort({ businessDate: -1, createdAt: -1 }),
    ]);

    const totalSales = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalOrders = sales.length;
    const totalExpense = expenses.reduce((acc, e) => acc + (e.price || 0), 0);
    const netProfit = totalSales - totalExpense;

    // Product breakdown
    const productStats = {};
    for (const sale of sales) {
      for (const item of sale.items || []) {
        const key = item.name;
        if (!productStats[key]) {
          productStats[key] = { name: item.name, qty: 0, revenue: 0 };
        }
        productStats[key].qty += (item.qty || 0);
        productStats[key].revenue += (item.lineTotal || (item.price * item.qty) || 0);
      }
    }
    const productBreakdown = Object.values(productStats).sort((a, b) => b.qty - a.qty);

    // Daily breakdown table
    const dailyMap = {};
    for (const s of sales) {
      const d = s.businessDate;
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, orders: 0, sales: 0, expense: 0, profit: 0 };
      }
      dailyMap[d].orders += 1;
      dailyMap[d].sales += (s.total || 0);
    }

    for (const e of expenses) {
      const d = e.businessDate;
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, orders: 0, sales: 0, expense: 0, profit: 0 };
      }
      dailyMap[d].expense += (e.price || 0);
    }

    const dailyBreakdown = Object.values(dailyMap)
      .map(row => ({
        ...row,
        profit: row.sales - row.expense,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Get list of distinct available dates
    const availableDates = dailyBreakdown.map(d => d.date);

    return res.json({
      success: true,
      from: startDate,
      to: endDate,
      summary: {
        totalSales,
        totalOrders,
        totalExpense,
        netProfit,
      },
      productBreakdown,
      dailyBreakdown,
      availableDates,
      salesCount: sales.length,
      expensesCount: expenses.length,
    });
  } catch (err) {
    console.error('[Sales Report GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not generate report.' });
  }
});

/**
 * DELETE /api/sales/:id
 * Delete wrong order (Client CAN delete directly, no admin restriction required)
 */
salesRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({ success: false, error: 'Sale record not found.' });
    }

    // Client can delete their own; Admin can delete any
    if (req.user.role !== 'admin' && sale.clientId !== req.user.clientId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this order.' });
    }

    // If sale had linked credit, remove or mark cancelled
    if (sale.creditId) {
      await Credit.findByIdAndDelete(sale.creditId);
    }

    await Sale.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Sale deleted successfully. Dashboard and reports updated.',
    });
  } catch (err) {
    console.error('[Sales DELETE Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not delete sale.' });
  }
});

export default salesRouter;
