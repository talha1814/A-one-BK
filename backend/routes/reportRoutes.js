import express from 'express';
import { DailySale } from '../models/DailySale.js';
import { CurrentSale } from '../models/CurrentSale.js';
import { Expense } from '../models/Expense.js';
import { CreditCustomer } from '../models/CreditCustomer.js';
import { getBusinessDate } from '../utils/businessDate.js';
import { connectDB, dbState } from '../config/db.js';
import { getCurrentSale, getDailySalesHistory, getDailySaleByDate } from '../services/rolloverService.js';
import { getExpensesList } from './expenseRoutes.js';
import { getCustomersList } from './creditRoutes.js';

export const reportRouter = express.Router();

/**
 * GET /api/reports/daily-summary
 * Query: ?date=YYYY-MM-DD (defaults to current business date)
 */
reportRouter.get('/daily-summary', async (req, res) => {
  try {
    await connectDB();
    const targetDate = req.query.date || getBusinessDate();
    const currentBizDate = getBusinessDate();

    let salesData = null;
    let totalSales = 0;
    let itemsSold = 0;

    if (targetDate === currentBizDate) {
      salesData = await getCurrentSale();
      totalSales = salesData.totalSale || 0;
      itemsSold = (salesData.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    } else {
      salesData = await getDailySaleByDate(targetDate);
      if (salesData) {
        totalSales = salesData.totalSale || 0;
        itemsSold = (salesData.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
      }
    }

    // Fetch expenses for this business date
    const expenses = await getExpensesList({ businessDate: targetDate });
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Calculate Net Profit
    const netProfit = totalSales - totalExpenses;

    // Fetch customer credit (Udhaar) and repayments (Vasooli) for this business date
    const allCustomers = await getCustomersList();
    const creditTransactions = [];
    allCustomers.forEach((cust) => {
      (cust.transactions || []).forEach((tx) => {
        if (tx.date === targetDate) {
          creditTransactions.push({
            customerId: cust._id,
            customerName: cust.name,
            phone: cust.phone,
            type: tx.type, // 'credit' = udhaar diya, 'payment' = vasooli li
            amount: Number(tx.amount || 0),
            description: tx.description,
            createdAt: tx.createdAt,
          });
        }
      });
    });

    const creditGiven = creditTransactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const vasooliCollected = creditTransactions
      .filter((t) => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    // Net Cash Flow for the day: Cash Sales (Total Sales - Udhaar) + Vasooli - Expenses
    const netCashInHand = (totalSales - creditGiven) + vasooliCollected - totalExpenses;

    res.json({
      success: true,
      businessDate: targetDate,
      isToday: targetDate === currentBizDate,
      summary: {
        totalSales,
        itemsSold,
        totalExpenses,
        netProfit,
        profitMargin: totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0,
        creditGiven,
        vasooliCollected,
        netCashInHand,
      },
      sales: salesData || { date: targetDate, items: [], totalSale: 0 },
      expenses: expenses || [],
      creditTransactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reports/financial-overview
 * Aggregate lifetime KPIs
 */
reportRouter.get('/financial-overview', async (req, res) => {
  try {
    await connectDB();
    const currentBizDate = getBusinessDate();

    // 1. Current Live Sale
    const currentSale = await getCurrentSale();
    const todaySales = currentSale.totalSale || 0;

    // 2. Archived Past Sales
    const history = await getDailySalesHistory();
    const pastSalesTotal = history.reduce((sum, d) => sum + (Number(d.totalSale) || 0), 0);
    const grandTotalSales = pastSalesTotal + todaySales;

    // 3. Expenses
    const allExpenses = await getExpensesList();
    const todayExpenses = allExpenses
      .filter((e) => e.businessDate === currentBizDate)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalExpensesLifetime = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 4. Net Profits
    const todayNetProfit = todaySales - todayExpenses;
    const lifetimeNetProfit = grandTotalSales - totalExpensesLifetime;

    // 5. Udhaar / Credit Ledger Outstanding
    const customers = await getCustomersList();
    const totalOutstandingCredit = customers.reduce((sum, c) => sum + (Number(c.balance) || 0), 0);

    res.json({
      success: true,
      currentBusinessDate: currentBizDate,
      overview: {
        todaySales,
        todayExpenses,
        todayNetProfit,
        grandTotalSales,
        totalExpensesLifetime,
        lifetimeNetProfit,
        totalOutstandingCredit,
        totalCustomersWithCredit: customers.filter((c) => Number(c.balance) > 0).length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
