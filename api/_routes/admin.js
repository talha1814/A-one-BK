import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../_models/User.js';
import Sale from '../_models/Sale.js';
import Expense from '../_models/Expense.js';
import Credit from '../_models/Credit.js';
import DailySale from '../_models/DailySale.js';
import { requireAuth, requireAdmin } from '../_middleware/auth.js';
import { getBusinessDate, getYesterdayBusinessDate } from '../_utils/getBusinessDate.js';

export const adminRouter = express.Router();

// Apply requireAuth and requireAdmin to all admin routes
adminRouter.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/overview
 * Overview across all clients / shops
 */
adminRouter.get('/overview', async (req, res) => {
  try {
    const todayBiz = getBusinessDate();
    const yesterdayBiz = getYesterdayBusinessDate();

    // Clients count
    const clients = await User.find({ role: 'client' }).select('-password').sort({ createdAt: -1 });

    // Aggregate today's sales across all clients
    const todaySales = await Sale.find({ businessDate: todayBiz });
    const totalTodaySale = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalTodayOrders = todaySales.length;

    // Aggregate yesterday's sales
    const yesterdaySales = await Sale.find({ businessDate: yesterdayBiz });
    const totalYesterdaySale = yesterdaySales.reduce((sum, s) => sum + (s.total || 0), 0);

    // Aggregate today's expenses
    const todayExpenses = await Expense.find({ businessDate: todayBiz });
    const totalTodayExpense = todayExpenses.reduce((sum, e) => sum + (e.price || 0), 0);

    // Outstanding udhaar across all clients
    const unpaidCredits = await Credit.find({ status: { $in: ['unpaid', 'partial'] } });
    const totalOutstandingCredit = unpaidCredits.reduce((sum, c) => sum + (c.remainingAmount || 0), 0);

    // All-time total sales
    const allSales = await Sale.find({});
    const allTimeRevenue = allSales.reduce((sum, s) => sum + (s.total || 0), 0);

    // Per-client quick summary
    const clientSummaries = await Promise.all(
      clients.map(async (client) => {
        const cId = client._id.toString();
        const clientSalesToday = todaySales.filter(s => s.clientId === cId);
        const clientSalesTodayTotal = clientSalesToday.reduce((sum, s) => sum + (s.total || 0), 0);
        const clientExpensesToday = todayExpenses.filter(e => e.clientId === cId);
        const clientExpensesTodayTotal = clientExpensesToday.reduce((sum, e) => sum + (e.price || 0), 0);

        return {
          id: cId,
          username: client.username,
          shopName: client.shopName,
          active: client.active,
          todaySale: clientSalesTodayTotal,
          todayOrders: clientSalesToday.length,
          todayExpense: clientExpensesTodayTotal,
          todayProfit: clientSalesTodayTotal - clientExpensesTodayTotal,
          createdAt: client.createdAt,
        };
      })
    );

    return res.json({
      success: true,
      businessDate: todayBiz,
      yesterdayDate: yesterdayBiz,
      metrics: {
        totalClients: clients.length,
        totalTodaySale,
        totalYesterdaySale,
        totalTodayOrders,
        totalTodayExpense,
        todayNetProfit: totalTodaySale - totalTodayExpense,
        totalOutstandingCredit,
        allTimeRevenue,
        allTimeOrders: allSales.length,
      },
      clientSummaries,
      clients,
    });
  } catch (err) {
    console.error('[Admin Overview GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch admin overview.' });
  }
});

/**
 * GET /api/admin/clients
 * List all clients
 */
adminRouter.get('/clients', async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' }).select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, clients });
  } catch (err) {
    console.error('[Admin Clients GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not fetch clients list.' });
  }
});

/**
 * POST /api/admin/clients
 * Create a new client account
 */
adminRouter.post('/clients', async (req, res) => {
  try {
    const { username, password, shopName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const cleanUsername = username.toLowerCase().trim();

    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ success: false, error: `Username '${cleanUsername}' is already taken.` });
    }

    const newClient = new User({
      username: cleanUsername,
      password: password, // Will be hashed by userSchema pre-save hook
      role: 'client',
      shopName: shopName ? shopName.trim() : 'A-One Bun Kabab',
      active: true,
    });

    await newClient.save();

    return res.status(201).json({
      success: true,
      client: {
        id: newClient._id.toString(),
        username: newClient.username,
        shopName: newClient.shopName,
        role: newClient.role,
        active: newClient.active,
        createdAt: newClient.createdAt,
      },
      message: `Client '${newClient.username}' created successfully!`,
    });
  } catch (err) {
    console.error('[Admin Client POST Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not create client.' });
  }
});

/**
 * PUT /api/admin/clients/:id
 * Update client (shopName, active status, or reset password)
 */
adminRouter.put('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { shopName, active, password } = req.body;

    const client = await User.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client account not found.' });
    }

    if (shopName !== undefined) client.shopName = shopName.trim();
    if (active !== undefined) client.active = !!active;

    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      client.password = await bcrypt.hash(password.trim(), salt);
    }

    await client.save();

    return res.json({
      success: true,
      client: {
        id: client._id.toString(),
        username: client.username,
        shopName: client.shopName,
        role: client.role,
        active: client.active,
        updatedAt: new Date(),
      },
      message: `Client '${client.username}' updated successfully.`,
    });
  } catch (err) {
    console.error('[Admin Client PUT Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not update client.' });
  }
});

/**
 * DELETE /api/admin/clients/:id
 * Remove client and their data
 */
adminRouter.delete('/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await User.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client account not found.' });
    }

    // Delete client user
    await User.findByIdAndDelete(id);

    // Optionally cleanup client's documents
    await Promise.all([
      Sale.deleteMany({ clientId: id }),
      Expense.deleteMany({ clientId: id }),
      Credit.deleteMany({ clientId: id }),
      DailySale.deleteMany({ clientId: id }),
    ]);

    return res.json({ success: true, message: `Client '${client.username}' and associated data deleted.` });
  } catch (err) {
    console.error('[Admin Client DELETE Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not delete client.' });
  }
});

/**
 * GET /api/admin/reports/:clientId
 * Per-client detailed report
 */
adminRouter.get('/reports/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { from, to } = req.query;

    const todayBiz = getBusinessDate();
    const startDate = from || todayBiz;
    const endDate = to || todayBiz;

    const client = await User.findById(clientId).select('-password');
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found.' });
    }

    const dateFilter = { businessDate: { $gte: startDate, $lte: endDate }, clientId };

    const [sales, expenses, credits] = await Promise.all([
      Sale.find(dateFilter).sort({ createdAt: -1 }),
      Expense.find(dateFilter).sort({ createdAt: -1 }),
      Credit.find({ clientId }).sort({ updatedAt: -1 }),
    ]);

    const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.price || 0), 0);
    const netProfit = totalSales - totalExpenses;
    const outstandingCredit = credits
      .filter(c => c.status !== 'paid')
      .reduce((sum, c) => sum + (c.remainingAmount || 0), 0);

    return res.json({
      success: true,
      client,
      from: startDate,
      to: endDate,
      summary: {
        totalSales,
        totalOrders: sales.length,
        totalExpenses,
        netProfit,
        outstandingCredit,
      },
      sales,
      expenses,
      credits,
    });
  } catch (err) {
    console.error('[Admin Reports GET Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not generate client report.' });
  }
});

/**
 * POST /api/admin/close-day
 * Manual "Close Day Now" trigger for any client or all clients
 */
adminRouter.post('/close-day', async (req, res) => {
  try {
    const { clientId, businessDate } = req.body;
    const targetDate = businessDate || getYesterdayBusinessDate();

    let clientQuery = { role: 'client', active: true };
    if (clientId) clientQuery._id = clientId;

    const clients = await User.find(clientQuery);
    const results = [];

    for (const c of clients) {
      const cId = c._id.toString();
      const sales = await Sale.find({ clientId: cId, businessDate: targetDate });
      const expenses = await Expense.find({ clientId: cId, businessDate: targetDate });

      const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.price || 0), 0);

      // Product breakdown
      const productMap = {};
      for (const s of sales) {
        for (const item of s.items || []) {
          if (!productMap[item.name]) productMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
          productMap[item.name].qty += (item.qty || 0);
          productMap[item.name].revenue += (item.lineTotal || (item.price * item.qty) || 0);
        }
      }

      const dailySale = await DailySale.findOneAndUpdate(
        { clientId: cId, businessDate: targetDate },
        {
          clientId: cId,
          businessDate: targetDate,
          totalSales,
          totalOrders: sales.length,
          totalExpenses,
          netProfit: totalSales - totalExpenses,
          productBreakdown: Object.values(productMap),
          closedManually: true,
          archivedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      results.push({
        clientId: cId,
        shopName: c.shopName,
        businessDate: targetDate,
        totalSales,
        totalExpenses,
        netProfit: totalSales - totalExpenses,
        totalOrders: sales.length,
      });
    }

    return res.json({
      success: true,
      message: `Business day ${targetDate} closed successfully for ${clients.length} client(s).`,
      results,
    });
  } catch (err) {
    console.error('[Admin Close Day Error]:', err);
    return res.status(500).json({ success: false, error: 'Could not close business day.' });
  }
});

export default adminRouter;
