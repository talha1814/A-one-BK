import express from 'express';
import User from '../models/User.js';
import Sale from '../models/Sale.js';
import Expense from '../models/Expense.js';
import DailySale from '../models/DailySale.js';
import { getYesterdayBusinessDate } from '../utils/getBusinessDate.js';

export const cronRouter = express.Router();

/**
 * GET /api/cron/rollover
 * Triggered daily at 23:00 UTC (= 04:00 AM PKT)
 * Archives the previous business day for all active clients
 */
cronRouter.get('/rollover', async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers['authorization'];
    const cronHeader = req.headers['x-vercel-cron'];
    const querySecret = req.query.secret;

    // Verify secret if CRON_SECRET is configured
    if (cronSecret) {
      const isHeaderMatch = authHeader === `Bearer ${cronSecret}`;
      const isQueryMatch = querySecret === cronSecret;
      const isVercelCron = cronHeader === '1';

      if (!isHeaderMatch && !isQueryMatch && !isVercelCron) {
        return res.status(401).json({ success: false, error: 'Unauthorized cron request.' });
      }
    }

    const targetDate = getYesterdayBusinessDate();
    const activeClients = await User.find({ role: 'client', active: true });

    const archiveReports = [];

    for (const client of activeClients) {
      const cId = client._id.toString();

      // Find all sales for targetDate
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
          closedManually: false,
          archivedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      archiveReports.push({
        clientId: cId,
        shopName: client.shopName,
        totalSales,
        totalExpenses,
        netProfit: totalSales - totalExpenses,
        orders: sales.length,
      });
    }

    console.log(`[Cron Rollover] ✅ Successfully archived business day ${targetDate} for ${activeClients.length} clients.`);

    return res.json({
      success: true,
      message: `Daily rollover complete for business day ${targetDate}`,
      businessDate: targetDate,
      clientsArchived: activeClients.length,
      details: archiveReports,
    });
  } catch (err) {
    console.error('[Cron Rollover Error]:', err);
    return res.status(500).json({ success: false, error: 'Cron rollover failed.' });
  }
});

export default cronRouter;
