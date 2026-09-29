import { DailySale } from '../models/DailySale.js';
import { CurrentSale } from '../models/CurrentSale.js';
import { getBusinessDate } from '../utils/businessDate.js';
import { dbState } from '../config/db.js';

// In-memory fallback store in case MongoDB is temporarily starting or offline
const memoryStore = {
  currentSale: {
    date: getBusinessDate(),
    items: [],
    totalSale: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  dailySales: [],
};

/**
 * Check if MongoDB is connected and operational
 */
function isDBConnected() {
  return dbState.status === 'connected';
}

/**
 * Get or initialize current business day's sale document
 */
export async function getCurrentSale() {
  const currentBizDate = getBusinessDate();

  if (!isDBConnected()) {
    // Memory fallback
    if (memoryStore.currentSale.date !== currentBizDate) {
      await performDayRollover('memory-date-sync');
    }
    return memoryStore.currentSale;
  }

  try {
    // Find active current sales
    const existing = await CurrentSale.findOne().sort({ updatedAt: -1 });

    if (!existing) {
      // Create new record for current business date
      const created = await CurrentSale.create({
        date: currentBizDate,
        items: [],
        totalSale: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return created;
    }

    // Check if the existing current sale belongs to an older business day (rollover missed)
    if (existing.date !== currentBizDate) {
      console.log(`[Rollover Service] Detected business date transition from ${existing.date} to ${currentBizDate}. Initiating auto-rollover...`);
      await performDayRollover('catchup-date-transition');
      // Fetch or create new current sale for today
      return await CurrentSale.findOne({ date: currentBizDate }) || await CurrentSale.create({
        date: currentBizDate,
        items: [],
        totalSale: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return existing;
  } catch (error) {
    console.error('[Rollover Service] Error in getCurrentSale:', error.message);
    return memoryStore.currentSale;
  }
}

/**
 * Adds items to current ongoing sale
 * @param {Array<{name: string, quantity: number, price: number}>} newItems
 */
export async function addItemsToCurrentSale(newItems = []) {
  if (!Array.isArray(newItems) || newItems.length === 0) {
    throw new Error('Items array must contain at least one item');
  }

  // Validate and format items
  const validatedItems = newItems.map((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.price) || 0);
    return {
      name: String(item.name || 'Item').trim(),
      quantity: qty,
      price: price,
      total: qty * price,
    };
  });

  const currentBizDate = getBusinessDate();

  if (!isDBConnected()) {
    // Memory store fallback
    if (memoryStore.currentSale.date !== currentBizDate) {
      await performDayRollover('memory-date-rollover');
    }
    memoryStore.currentSale.items.push(...validatedItems);
    memoryStore.currentSale.totalSale = memoryStore.currentSale.items.reduce(
      (sum, i) => sum + i.total,
      0
    );
    memoryStore.currentSale.updatedAt = new Date();
    return memoryStore.currentSale;
  }

  // Ensure current record belongs to today's business date
  let doc = await getCurrentSale();

  // Push new items
  doc.items.push(...validatedItems);
  doc.totalSale = doc.items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  doc.updatedAt = new Date();

  await doc.save();
  return doc;
}

/**
 * Removes an item by index from CurrentSale
 */
export async function removeItemFromCurrentSale(itemIndex) {
  const doc = await getCurrentSale();
  const idx = Number(itemIndex);

  if (isNaN(idx) || idx < 0 || idx >= doc.items.length) {
    throw new Error('Invalid item index');
  }

  doc.items.splice(idx, 1);
  doc.totalSale = doc.items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  doc.updatedAt = new Date();

  if (isDBConnected() && typeof doc.save === 'function') {
    await doc.save();
  }
  return doc;
}

/**
 * Clears items in CurrentSale without rolling over
 */
export async function clearCurrentSale() {
  const currentBizDate = getBusinessDate();
  if (!isDBConnected()) {
    memoryStore.currentSale = {
      date: currentBizDate,
      items: [],
      totalSale: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return memoryStore.currentSale;
  }

  const doc = await getCurrentSale();
  doc.items = [];
  doc.totalSale = 0;
  doc.updatedAt = new Date();
  await doc.save();
  return doc;
}

/**
 * Performs Day Rollover:
 * 1. Takes all items/sales in CurrentSale
 * 2. Archives into DailySale collection with business day date
 * 3. Clears CurrentSale and starts fresh for the new business day
 * 
 * @param {string} triggerReason - 'cron' | 'manual' | 'catchup'
 */
export async function performDayRollover(triggerReason = 'manual') {
  const timestamp = new Date();
  const newBusinessDate = getBusinessDate();
  console.log(`[Rollover Service] 🚀 Executing Day Rollover (Trigger: ${triggerReason}) at ${timestamp.toISOString()}`);

  if (!isDBConnected()) {
    // Memory fallback handling
    const oldSale = { ...memoryStore.currentSale };
    let archivedRecord = null;

    if (oldSale.items && oldSale.items.length > 0) {
      archivedRecord = {
        _id: 'mem_' + Date.now(),
        date: oldSale.date,
        items: [...oldSale.items],
        totalSale: oldSale.totalSale,
        createdAt: oldSale.createdAt || timestamp,
        updatedAt: timestamp,
      };
      memoryStore.dailySales.unshift(archivedRecord);
    }

    memoryStore.currentSale = {
      date: newBusinessDate,
      items: [],
      totalSale: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return {
      success: true,
      reason: triggerReason,
      archived: archivedRecord,
      newBusinessDate,
      message: archivedRecord
        ? `Rollover completed. Business day ${archivedRecord.date} archived (Total: Rs ${archivedRecord.totalSale}).`
        : `Rollover completed. No active sales to archive. Started new business day ${newBusinessDate}.`,
    };
  }

  try {
    // 1. Fetch current live working sale
    const currentDoc = await CurrentSale.findOne().sort({ updatedAt: -1 });

    let archivedRecord = null;

    if (currentDoc && currentDoc.items && currentDoc.items.length > 0) {
      const saleDate = currentDoc.date;

      // Check if DailySale already has a record for this date
      let existingDaily = await DailySale.findOne({ date: saleDate });

      if (existingDaily) {
        // Merge items into existing record
        existingDaily.items.push(...currentDoc.items);
        existingDaily.totalSale += currentDoc.totalSale;
        existingDaily.updatedAt = timestamp;
        await existingDaily.save();
        archivedRecord = existingDaily;
        console.log(`[Rollover Service] 📦 Merged sales into existing DailySale record for ${saleDate}. Total: Rs ${existingDaily.totalSale}`);
      } else {
        // Create new DailySale record
        archivedRecord = await DailySale.create({
          date: saleDate,
          items: currentDoc.items,
          totalSale: currentDoc.totalSale,
          createdAt: currentDoc.createdAt || timestamp,
          updatedAt: timestamp,
        });
        console.log(`[Rollover Service] 📦 Created new DailySale record for ${saleDate}. Total: Rs ${archivedRecord.totalSale}`);
      }
    }

    // 2. Remove all old current sales records
    await CurrentSale.deleteMany({});

    // 3. Create fresh clean CurrentSale for the new business date
    const freshCurrentSale = await CurrentSale.create({
      date: newBusinessDate,
      items: [],
      totalSale: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return {
      success: true,
      reason: triggerReason,
      archived: archivedRecord,
      currentSale: freshCurrentSale,
      newBusinessDate,
      message: archivedRecord
        ? `Rollover completed successfully! Archived ${archivedRecord.date} with ${archivedRecord.items.length} items (Total: Rs ${archivedRecord.totalSale}). Fresh business day ${newBusinessDate} started.`
        : `Rollover completed. No pending sales to archive. Fresh business day ${newBusinessDate} started.`,
    };
  } catch (error) {
    console.error('[Rollover Service] ❌ Day Rollover failed:', error);
    throw error;
  }
}

/**
 * Get all historical DailySale records
 */
export async function getDailySalesHistory() {
  if (!isDBConnected()) {
    return memoryStore.dailySales;
  }
  return await DailySale.find().sort({ date: -1, createdAt: -1 });
}

/**
 * Get single DailySale by date
 */
export async function getDailySaleByDate(dateStr) {
  if (!isDBConnected()) {
    return memoryStore.dailySales.find((d) => d.date === dateStr) || null;
  }
  return await DailySale.findOne({ date: dateStr });
}

/**
 * Seed demo data for testing
 */
export async function seedDemoSales() {
  const currentBizDate = getBusinessDate();
  const demoItems = [
    { name: 'Bun Kabab Rs: 80/-', quantity: 15, price: 80, total: 1200 },
    { name: 'Bun Kabab Rs: 100/-', quantity: 10, price: 100, total: 1000 },
    { name: 'Bun Kabab Rs: 150/-', quantity: 6, price: 150, total: 900 },
  ];

  // Current day seed (Bun Kabab only)
  await addItemsToCurrentSale([
    { name: 'Bun Kabab Rs: 80/-', quantity: 4, price: 80 },
    { name: 'Bun Kabab Rs: 100/-', quantity: 2, price: 100 },
    { name: 'Bun Kabab Rs: 150/-', quantity: 1, price: 150 },
  ]);

  if (isDBConnected()) {
    // Also create 2 previous days in DailySale if empty
    const count = await DailySale.countDocuments();
    if (count === 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yDate = getBusinessDate(yesterday);

      const dayBefore = new Date();
      dayBefore.setDate(dayBefore.getDate() - 2);
      const dbDate = getBusinessDate(dayBefore);

      await DailySale.create({
        date: yDate,
        items: demoItems.slice(0, 2),
        totalSale: demoItems.slice(0, 2).reduce((s, i) => s + i.total, 0),
        createdAt: yesterday,
        updatedAt: yesterday,
      });

      await DailySale.create({
        date: dbDate,
        items: demoItems,
        totalSale: demoItems.reduce((s, i) => s + i.total, 0),
        createdAt: dayBefore,
        updatedAt: dayBefore,
      });
    }
  } else {
    // Memory fallback seeding for past days
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = getBusinessDate(yesterday);

    const dayBefore = new Date();
    dayBefore.setDate(dayBefore.getDate() - 2);
    const dbDate = getBusinessDate(dayBefore);

    if (!memoryStore.dailySales.some(d => d.date === yDate)) {
      memoryStore.dailySales.push({
        _id: 'mem_y_' + Date.now(),
        date: yDate,
        items: demoItems.slice(0, 2),
        totalSale: demoItems.slice(0, 2).reduce((s, i) => s + i.total, 0),
        createdAt: yesterday,
        updatedAt: yesterday,
      });
    }

    if (!memoryStore.dailySales.some(d => d.date === dbDate)) {
      memoryStore.dailySales.push({
        _id: 'mem_db_' + Date.now(),
        date: dbDate,
        items: demoItems,
        totalSale: demoItems.reduce((s, i) => s + i.total, 0),
        createdAt: dayBefore,
        updatedAt: dayBefore,
      });
    }
  }

  return { success: true, message: 'Demo sales seeded successfully!' };
}
