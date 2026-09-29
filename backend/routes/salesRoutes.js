import express from 'express';
import {
  getCurrentSale,
  addItemsToCurrentSale,
  removeItemFromCurrentSale,
  clearCurrentSale,
  performDayRollover,
  getDailySalesHistory,
  getDailySaleByDate,
  seedDemoSales,
} from '../services/rolloverService.js';
import { dbState, connectDB, updateMongoURI, getActiveURI } from '../config/db.js';
import { getBusinessDate, getRolloverCountdown } from '../utils/businessDate.js';
import { getCronStatus } from '../jobs/cronJobs.js';

export const salesRouter = express.Router();

/**
 * GET /api/status
 * System health, MongoDB connection status, business day status & next rollover countdown
 */
salesRouter.get('/status', async (req, res) => {
  try {
    const countdown = getRolloverCountdown();
    const currentBizDate = getBusinessDate();
    const cronStatus = getCronStatus();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        status: dbState.status,
        dbName: dbState.dbName,
        uriType: dbState.uriType,
        uri: dbState.uri,
        rawUri: getActiveURI(),
        lastConnectedAt: dbState.lastConnectedAt,
        lastError: dbState.lastError,
      },
      businessDay: {
        currentDate: currentBizDate,
        cutoffHour: '04:00 AM',
        rule: 'Sales between 4:00 AM today and 3:59:59 AM tomorrow belong to this business day.',
        rolloverCountdown: countdown,
      },
      scheduler: cronStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/db/retry
 * Triggers manual MongoDB reconnection attempt
 */
salesRouter.post('/db/retry', async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      status: dbState.status,
      message: `Reconnection attempted. Current status: ${dbState.status}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/db/config
 * Updates the MongoDB connection string dynamically (e.g. authSource=admin or Atlas)
 */
salesRouter.post('/db/config', async (req, res) => {
  try {
    const { uri } = req.body;
    if (!uri || !uri.trim()) {
      return res.status(400).json({ success: false, error: 'MongoDB connection string (URI) is required.' });
    }
    const result = await updateMongoURI(uri);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/current
 * Fetch current ongoing business day's sales (CurrentSale)
 */
salesRouter.get('/current', async (req, res) => {
  try {
    const sale = await getCurrentSale();
    const countdown = getRolloverCountdown();

    res.json({
      success: true,
      data: sale,
      businessDate: sale.date || getBusinessDate(),
      rolloverCountdown: countdown,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sales
 * Add item(s) to current business day's sale
 * Body: { items: [...] } OR { name, quantity, price }
 */
salesRouter.post('/sales', async (req, res) => {
  try {
    let itemsToAdd = [];

    if (Array.isArray(req.body.items)) {
      itemsToAdd = req.body.items;
    } else if (req.body.name && req.body.price !== undefined) {
      itemsToAdd = [
        {
          name: req.body.name,
          quantity: req.body.quantity || 1,
          price: req.body.price,
        },
      ];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. Provide "items" array or single item { name, quantity, price }.',
      });
    }

    const updatedSale = await addItemsToCurrentSale(itemsToAdd);
    res.status(201).json({
      success: true,
      message: `Added ${itemsToAdd.length} item(s) to today's CurrentSale.`,
      data: updatedSale,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/current/item/:index
 * Remove an item from CurrentSale by index
 */
salesRouter.delete('/current/item/:index', async (req, res) => {
  try {
    const updatedSale = await removeItemFromCurrentSale(req.params.index);
    res.json({
      success: true,
      message: 'Item removed from CurrentSale.',
      data: updatedSale,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/current/clear
 * Clear all items in CurrentSale without rolling over
 */
salesRouter.post('/current/clear', async (req, res) => {
  try {
    const cleared = await clearCurrentSale();
    res.json({
      success: true,
      message: 'CurrentSale cleared.',
      data: cleared,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rollover
 * Manually trigger day rollover:
 * Archives CurrentSale to DailySale, clears CurrentSale, starts new day.
 */
salesRouter.post('/rollover', async (req, res) => {
  try {
    const result = await performDayRollover('manual-user-trigger');
    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/daily
 * Get all historical DailySale documents with aggregate summary
 */
salesRouter.get('/daily', async (req, res) => {
  try {
    const history = await getDailySalesHistory();

    const totalDays = history.length;
    const grandTotalRevenue = history.reduce((sum, d) => sum + (Number(d.totalSale) || 0), 0);
    const totalItemsSold = history.reduce((sum, d) => {
      const itemsSum = (d.items || []).reduce((iSum, it) => iSum + (Number(it.quantity) || 0), 0);
      return sum + itemsSum;
    }, 0);
    const averageDailySale = totalDays > 0 ? Math.round(grandTotalRevenue / totalDays) : 0;

    res.json({
      success: true,
      summary: {
        totalDays,
        grandTotalRevenue,
        totalItemsSold,
        averageDailySale,
      },
      data: history,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/daily/:date
 * Get specific day's archived sale by YYYY-MM-DD
 */
salesRouter.get('/daily/:date', async (req, res) => {
  try {
    const sale = await getDailySaleByDate(req.params.date);
    if (!sale) {
      return res.status(404).json({
        success: false,
        error: `No DailySale record found for business day ${req.params.date}`,
      });
    }
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/seed-demo
 * Seeds demo sales for quick demonstration and testing
 */
salesRouter.post('/seed-demo', async (req, res) => {
  try {
    const result = await seedDemoSales();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
