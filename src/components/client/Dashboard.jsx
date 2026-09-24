import React, { useState, useMemo } from 'react';
import {
  User,
  Bike,
  Calendar,
  Clock,
  Printer,
  BarChart3,
  CalendarDays,
  Plus,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  format,
  subDays,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWithinInterval,
} from 'date-fns';
import { PRODUCT, PRODUCTS, CUSTOMER_TYPES } from '../../constants';
import { calculateProductStats } from '../../utils/storage';

export default function Dashboard({ orders, onReprintOrder, onSaveOrder, onClearSales }) {
  const [selectedDateStr, setSelectedDateStr] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [productStatsTimeframe, setProductStatsTimeframe] = useState('today'); // 'today' | 'all'
  const [quickCustType, setQuickCustType] = useState(CUSTOMER_TYPES.WALKIN);
  const [quickFeedback, setQuickFeedback] = useState(null);
  const [isSavingQuick, setIsSavingQuick] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearSuccessToast, setClearSuccessToast] = useState(false);

  const now = new Date();

  const handleConfirmClear = () => {
    if (onClearSales) {
      onClearSales();
      setShowClearConfirm(false);
      setClearSuccessToast(true);
      setTimeout(() => setClearSuccessToast(false), 4000);
    }
  };

  // 0. Product-wise tracking (Rs 80, Rs 100, Rs 150)
  const targetOrdersForProductStats = useMemo(() => {
    if (productStatsTimeframe === 'all') return orders;
    return orders.filter((o) => isSameDay(new Date(o.timestamp), now));
  }, [orders, productStatsTimeframe, now]);

  const productStats = useMemo(() => {
    return calculateProductStats(targetOrdersForProductStats);
  }, [targetOrdersForProductStats]);

  const handleQuickAddSale = async (prod) => {
    if (!onSaveOrder || isSavingQuick) return;
    setIsSavingQuick(true);
    try {
      const saved = await onSaveOrder({
        customerType: quickCustType,
        qty: 1,
        product: prod,
        printed: false,
      });
      setQuickFeedback({
        message: `+1 ${prod.shortName || prod.name} sale logged!`,
        orderId: saved?.id,
        price: prod.price,
      });
      setTimeout(() => setQuickFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to log quick sale from dashboard:', err);
    } finally {
      setIsSavingQuick(false);
    }
  };

  // 1. Today's Calculations
  const todayMetrics = useMemo(() => {
    const todayOrders = orders.filter((o) =>
      isSameDay(new Date(o.timestamp), now)
    );

    let totalRs = 0;
    let totalItems = 0;
    let walkinRs = 0;
    let walkinOrdersCount = 0;
    let walkinItems = 0;
    let foodpandaRs = 0;
    let foodpandaOrdersCount = 0;
    let foodpandaItems = 0;

    todayOrders.forEach((o) => {
      const itemsCount = o.items ? o.items.reduce((acc, i) => acc + (i.qty || 1), 0) : 1;
      totalRs += o.total;
      totalItems += itemsCount;

      if (o.customerType === CUSTOMER_TYPES.FOODPANDA) {
        foodpandaRs += o.total;
        foodpandaOrdersCount += 1;
        foodpandaItems += itemsCount;
      } else {
        walkinRs += o.total;
        walkinOrdersCount += 1;
        walkinItems += itemsCount;
      }
    });

    return {
      totalOrders: todayOrders.length,
      totalRs,
      totalItems,
      walkinRs,
      walkinOrdersCount,
      walkinItems,
      foodpandaRs,
      foodpandaOrdersCount,
      foodpandaItems,
    };
  }, [orders]);

  // 2. Weekly Sales (last 7 days)
  const weeklyData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      last7Days.push(subDays(now, i));
    }

    let weeklyWalkinTotal = 0;
    let weeklyFoodpandaTotal = 0;

    const chartData = last7Days.map((date) => {
      const dayOrders = orders.filter((o) =>
        isSameDay(new Date(o.timestamp), date)
      );

      let walkin = 0;
      let foodpanda = 0;

      dayOrders.forEach((o) => {
        if (o.customerType === CUSTOMER_TYPES.FOODPANDA) {
          foodpanda += o.total;
        } else {
          walkin += o.total;
        }
      });

      weeklyWalkinTotal += walkin;
      weeklyFoodpandaTotal += foodpanda;

      return {
        dateStr: format(date, 'EEE, d MMM'),
        shortDay: format(date, 'EEE'),
        WalkIn: walkin,
        FoodPanda: foodpanda,
        Total: walkin + foodpanda,
      };
    });

    return {
      chartData,
      weeklyWalkinTotal,
      weeklyFoodpandaTotal,
      weeklyCombinedTotal: weeklyWalkinTotal + weeklyFoodpandaTotal,
    };
  }, [orders]);

  // 3. Monthly Sales (current month)
  const monthlyData = useMemo(() => {
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthOrders = orders.filter((o) => {
      const d = new Date(o.timestamp);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });

    let monthWalkinTotal = 0;
    let monthFoodpandaTotal = 0;
    let monthItemsTotal = 0;

    monthOrders.forEach((o) => {
      const itemsCount = o.items ? o.items.reduce((acc, i) => acc + (i.qty || 1), 0) : 1;
      monthItemsTotal += itemsCount;
      if (o.customerType === CUSTOMER_TYPES.FOODPANDA) {
        monthFoodpandaTotal += o.total;
      } else {
        monthWalkinTotal += o.total;
      }
    });

    const daysInMonth = eachDayOfInterval({ start: monthStart, end: now });
    const dailyPoints = daysInMonth.map((day) => {
      const dOrders = monthOrders.filter((o) =>
        isSameDay(new Date(o.timestamp), day)
      );
      let walkin = 0;
      let foodpanda = 0;
      dOrders.forEach((o) => {
        if (o.customerType === CUSTOMER_TYPES.FOODPANDA) foodpanda += o.total;
        else walkin += o.total;
      });
      return {
        day: format(day, 'd MMM'),
        WalkIn: walkin,
        FoodPanda: foodpanda,
        Total: walkin + foodpanda,
      };
    });

    return {
      monthWalkinTotal,
      monthFoodpandaTotal,
      monthCombinedTotal: monthWalkinTotal + monthFoodpandaTotal,
      monthOrdersCount: monthOrders.length,
      monthItemsTotal,
      dailyPoints,
    };
  }, [orders]);

  // 4. Specific Date Calculator
  const specificDateMetrics = useMemo(() => {
    if (!selectedDateStr) return null;
    const targetDate = new Date(`${selectedDateStr}T00:00:00`);

    const dayOrders = orders.filter((o) =>
      isSameDay(new Date(o.timestamp), targetDate)
    );

    let totalRs = 0;
    let totalItems = 0;
    let walkinRs = 0;
    let walkinCount = 0;
    let walkinItems = 0;
    let foodpandaRs = 0;
    let foodpandaCount = 0;
    let foodpandaItems = 0;

    dayOrders.forEach((o) => {
      const itemsCount = o.items ? o.items.reduce((acc, i) => acc + (i.qty || 1), 0) : 1;
      totalRs += o.total;
      totalItems += itemsCount;

      if (o.customerType === CUSTOMER_TYPES.FOODPANDA) {
        foodpandaRs += o.total;
        foodpandaCount += 1;
        foodpandaItems += itemsCount;
      } else {
        walkinRs += o.total;
        walkinCount += 1;
        walkinItems += itemsCount;
      }
    });

    return {
      dateFormatted: format(targetDate, 'EEEE, d MMMM yyyy'),
      ordersCount: dayOrders.length,
      totalRs,
      totalItems,
      walkinRs,
      walkinCount,
      walkinItems,
      foodpandaRs,
      foodpandaCount,
      foodpandaItems,
    };
  }, [orders, selectedDateStr]);

  const recentOrders = useMemo(() => orders.slice(0, 10), [orders]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-stone-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-stone-800">
          <p className="font-extrabold text-stone-300 pb-1 border-b border-stone-800">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-stone-300">
                  {entry.name === 'WalkIn' ? 'Walk-in' : 'Food Panda'}:
                </span>
              </span>
              <span className="font-bold text-white">Rs {entry.value}</span>
            </div>
          ))}
          <div className="pt-1 border-t border-stone-800 flex justify-between font-extrabold text-amber-400">
            <span>Combined:</span>
            <span>
              Rs {payload.reduce((sum, entry) => sum + (entry.value || 0), 0)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Sales Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Live Bun Kabab sales with Walk-in vs Food Panda breakdown
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-600 bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>Updated: {format(now, 'hh:mm a')}</span>
          </div>

          {/* Clear All Sales Button */}
          {onClearSales && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-bold border border-stone-200 hover:border-rose-300 shadow-xs transition active:scale-95 cursor-pointer"
              title="Clear all sales and start fresh"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear All Sales</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification when sales are cleared */}
      {clearSuccessToast && (
        <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-stone-800 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-white">All Sales Cleared Successfully!</p>
              <p className="text-xs text-stone-400">Dashboard has been reset to 0. You can now start new sales entries.</p>
            </div>
          </div>
          <button
            onClick={() => setClearSuccessToast(false)}
            className="text-stone-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Confirmation Modal for Clearing All Sales */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900">Clear All Sales Data?</h3>
                <p className="text-xs text-stone-500">Reset dashboard counter and start fresh</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
              Kya aap waqai tamam sales data clear karna chahte hain? Dashboard par mojood tamam sales reset ho kar <strong>0</strong> ho jayengi aur software naye sirey se (fresh start) shuru hoga.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel / Wapis
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black shadow-md shadow-rose-200 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Clear All Sales</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A) TODAY'S SUMMARY CARDS */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold tracking-wider uppercase text-stone-600 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Today's Performance
        </h2>

        {/* 3 Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase text-stone-600">Total Sales</span>
            <div className="mt-2">
              <span className="text-3xl font-black text-stone-900 tracking-tight">
                Rs {todayMetrics.totalRs.toLocaleString()}
              </span>
              <p className="text-xs text-stone-600 mt-0.5">Combined Revenue</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase text-stone-600">Items Sold</span>
            <div className="mt-2">
              <span className="text-3xl font-black text-stone-900 tracking-tight">
                {todayMetrics.totalItems} pcs
              </span>
              <p className="text-xs text-stone-600 mt-0.5">Combined Bun Kababs</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase text-stone-600">Total Orders</span>
            <div className="mt-2">
              <span className="text-3xl font-black text-stone-900 tracking-tight">
                {todayMetrics.totalOrders}
              </span>
              <p className="text-xs text-stone-600 mt-0.5">Orders logged</p>
            </div>
          </div>
        </div>

        {/* GREEN (Walk-in) & PINK (Food Panda) CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
          {/* Green Card */}
          <div className="bg-linear-to-br from-emerald-600 to-emerald-700 text-white p-5 rounded-3xl shadow-md shadow-emerald-600/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <User className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-xs font-black uppercase text-emerald-100">Walk-in Sales</span>
                  <span className="text-[11px] text-emerald-200">Dine-in / Counter</span>
                </div>
              </div>
              <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full">
                {todayMetrics.walkinOrdersCount} Orders
              </span>
            </div>
            <div className="mt-4 pt-2 border-t border-emerald-500/50 flex items-end justify-between">
              <div>
                <span className="block text-xs text-emerald-100">Revenue</span>
                <span className="text-3xl sm:text-4xl font-black">
                  Rs {todayMetrics.walkinRs.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs text-emerald-100">Sold</span>
                <span className="text-xl font-black">{todayMetrics.walkinItems} pcs</span>
              </div>
            </div>
          </div>

          {/* Pink Card */}
          <div className="bg-linear-to-br from-[#d70f64] to-[#b30850] text-white p-5 rounded-3xl shadow-md shadow-pink-600/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bike className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-xs font-black uppercase text-pink-100">Food Panda Sales</span>
                  <span className="text-[11px] text-pink-200">Online Delivery</span>
                </div>
              </div>
              <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full">
                {todayMetrics.foodpandaOrdersCount} Orders
              </span>
            </div>
            <div className="mt-4 pt-2 border-t border-pink-500/50 flex items-end justify-between">
              <div>
                <span className="block text-xs text-pink-100">Revenue</span>
                <span className="text-3xl sm:text-4xl font-black">
                  Rs {todayMetrics.foodpandaRs.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs text-pink-100">Sold</span>
                <span className="text-xl font-black">{todayMetrics.foodpandaItems} pcs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B) 3 PRODUCTS SALES TRACKING & DIRECT ENTRY */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🍔</span>
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Products Sales Tracking & Direct Entry
              </h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                3 Products
              </span>
            </div>
            <p className="text-xs text-stone-600">
              Track Rs 80, Rs 100, and Rs 150 Bun Kababs separately with live +1 sales entry
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Filter (Today vs All-Time) */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/70 text-xs">
              <button
                type="button"
                onClick={() => setProductStatsTimeframe('today')}
                className={`px-2.5 py-1 rounded-lg font-extrabold transition cursor-pointer ${
                  productStatsTimeframe === 'today'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setProductStatsTimeframe('all')}
                className={`px-2.5 py-1 rounded-lg font-extrabold transition cursor-pointer ${
                  productStatsTimeframe === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All-Time
              </button>
            </div>

            {/* Quick Sale Customer Type Toggle */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/70 text-xs">
              <button
                type="button"
                onClick={() => setQuickCustType(CUSTOMER_TYPES.WALKIN)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  quickCustType === CUSTOMER_TYPES.WALKIN
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Walk-in
              </button>
              <button
                type="button"
                onClick={() => setQuickCustType(CUSTOMER_TYPES.FOODPANDA)}
                className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  quickCustType === CUSTOMER_TYPES.FOODPANDA
                    ? 'bg-[#d70f64] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Food Panda
              </button>
            </div>
          </div>
        </div>

        {/* Quick Sale Success Feedback Toast */}
        {quickFeedback && (
          <div className="bg-stone-900 text-white text-xs p-3 rounded-2xl flex items-center justify-between border border-stone-800 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-extrabold">{quickFeedback.message}</span>
              <span className="text-stone-400 text-[11px]">
                ({quickCustType === CUSTOMER_TYPES.FOODPANDA ? 'Food Panda' : 'Walk-in'} • +Rs {quickFeedback.price})
              </span>
            </div>
            <button
              onClick={() => setQuickFeedback(null)}
              className="text-stone-400 hover:text-white text-[11px] font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* 3 Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {productStats.productsList.map((prod) => {
            const productConstant = PRODUCTS.find((p) => p.id === prod.id) || {
              tag: prod.tag || 'Special',
              name: prod.name,
              price: prod.price,
            };

            return (
              <div
                key={prod.id}
                className="bg-stone-50/80 rounded-2xl border border-stone-200/90 p-4 flex flex-col justify-between hover:border-stone-300 transition shadow-xs"
              >
                <div>
                  {/* Badge & Unit Price */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
                      {prod.tag || productConstant.tag}
                    </span>
                    <span className="text-sm font-black text-rose-600">
                      Rs {prod.price} / pc
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="text-base font-black text-stone-900 mt-2">
                    {prod.name}
                  </h3>

                  {/* Stats Block: Quantity Sold & Total Earning */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-stone-200/80">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-stone-500">
                        Qty Sold
                      </span>
                      <span className="block text-2xl font-black text-stone-900 mt-0.5">
                        {prod.qtySold} <span className="text-xs font-semibold text-stone-500">pcs</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold uppercase text-stone-500">
                        Total Earning
                      </span>
                      <span className="block text-xl font-black text-rose-600 mt-0.5">
                        Rs {prod.totalEarning.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Channel Breakdown */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500 px-1 font-medium">
                    <span>
                      Walk-in: <strong className="text-emerald-700">{prod.walkinQty} pcs</strong>
                    </span>
                    <span>
                      Food Panda: <strong className="text-[#d70f64]">{prod.foodpandaQty} pcs</strong>
                    </span>
                  </div>
                </div>

                {/* Entry Action Button */}
                <div className="mt-4 pt-3 border-t border-stone-200/70">
                  <button
                    type="button"
                    disabled={isSavingQuick}
                    onClick={() => handleQuickAddSale(productConstant)}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+1 Sale (Rs {prod.price})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* COMBINED TOTAL SALE & COMBINED TOTAL EARNING BANNER */}
        <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-stone-800 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl shrink-0">
              📊
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                All 3 Products Combined Summary ({productStatsTimeframe === 'today' ? 'Today' : 'All-Time'})
              </span>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1">
                <div>
                  <span className="text-xs text-stone-400 block">Combined Total Sale:</span>
                  <span className="text-2xl font-black text-white">
                    {productStats.combined.totalQuantity} <span className="text-xs font-normal text-stone-400">pcs</span>
                  </span>
                </div>
                <div className="hidden sm:block h-8 w-px bg-stone-700" />
                <div>
                  <span className="text-xs text-stone-400 block">Combined Total Earning:</span>
                  <span className="text-2xl font-black text-amber-400">
                    Rs {productStats.combined.totalEarning.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mini product share badges */}
          <div className="flex flex-wrap sm:flex-col gap-1.5 sm:text-right border-t sm:border-0 border-stone-800 pt-2 sm:pt-0">
            <span className="text-[11px] text-stone-300">
              Rs 80: <strong className="text-white">{productStats.byProduct['bun-kabab-80'].qtySold} pcs</strong> (Rs {productStats.byProduct['bun-kabab-80'].totalEarning.toLocaleString()})
            </span>
            <span className="text-[11px] text-stone-300">
              Rs 100: <strong className="text-white">{productStats.byProduct['bun-kabab-100'].qtySold} pcs</strong> (Rs {productStats.byProduct['bun-kabab-100'].totalEarning.toLocaleString()})
            </span>
            <span className="text-[11px] text-stone-300">
              Rs 150: <strong className="text-white">{productStats.byProduct['bun-kabab-150'].qtySold} pcs</strong> (Rs {productStats.byProduct['bun-kabab-150'].totalEarning.toLocaleString()})
            </span>
          </div>
        </div>
      </section>

      {/* C) WEEKLY CHART (2 bars per day) */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-rose-600" />
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Weekly Sales (Last 7 Days)
              </h2>
            </div>
            <p className="text-xs text-stone-600">2 bars per day: Green = Walk-in, Pink = Food Panda</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-emerald-700">Walk-in: Rs {weeklyData.weeklyWalkinTotal.toLocaleString()}</span>
            <span className="font-bold text-[#d70f64]">Food Panda: Rs {weeklyData.weeklyFoodpandaTotal.toLocaleString()}</span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="shortDay" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs ${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
              <Bar dataKey="WalkIn" name="WalkIn" fill="#10b981" radius={[6, 6, 0, 0]} barSize={18} />
              <Bar dataKey="FoodPanda" name="FoodPanda" fill="#d70f64" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* C) MONTHLY CHART */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-rose-600" />
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Monthly Comparison ({format(now, 'MMMM yyyy')})
              </h2>
            </div>
            <p className="text-xs text-stone-600">Month-to-date trajectory</p>
          </div>
          <span className="text-xl font-black text-rose-600">
            Rs {monthlyData.monthCombinedTotal.toLocaleString()}
          </span>
        </div>

        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData.dailyPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs ${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="WalkIn" name="WalkIn" stackId="a" fill="#10b981" />
              <Bar dataKey="FoodPanda" name="FoodPanda" stackId="a" fill="#d70f64" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* D) SPECIFIC DATE CALCULATOR */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-600" />
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Specific Date Sales Calculator
              </h2>
            </div>
            <p className="text-xs text-stone-600">Pick any date to inspect exact sales</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            />
          </div>
        </div>

        {specificDateMetrics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-900 text-white p-4 rounded-2xl">
              <span className="block text-[11px] font-bold text-stone-400 uppercase">Day Total</span>
              <span className="block text-2xl font-black text-rose-400 mt-1">
                Rs {specificDateMetrics.totalRs.toLocaleString()}
              </span>
              <span className="block text-xs text-stone-300 mt-0.5">
                {specificDateMetrics.totalItems} Bun Kababs sold
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
              <span className="block text-[11px] font-black uppercase text-emerald-800">Walk-in</span>
              <span className="block text-2xl font-black text-emerald-700 mt-1">
                Rs {specificDateMetrics.walkinRs.toLocaleString()}
              </span>
              <span className="block text-xs text-emerald-800 mt-0.5">
                {specificDateMetrics.walkinCount} orders ({specificDateMetrics.walkinItems} pcs)
              </span>
            </div>

            <div className="bg-pink-50 border border-pink-200 p-4 rounded-2xl">
              <span className="block text-[11px] font-black uppercase text-[#d70f64]">Food Panda</span>
              <span className="block text-2xl font-black text-[#d70f64] mt-1">
                Rs {specificDateMetrics.foodpandaRs.toLocaleString()}
              </span>
              <span className="block text-xs text-pink-700 mt-0.5">
                {specificDateMetrics.foodpandaCount} orders ({specificDateMetrics.foodpandaItems} pcs)
              </span>
            </div>
          </div>
        )}
      </section>

      {/* E) RECENT ORDERS (Last 10) */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <h2 className="text-base sm:text-lg font-black text-stone-900 pb-2 border-b border-stone-100">
          Recent 10 Orders
        </h2>

        <div className="divide-y divide-stone-100">
          {recentOrders.map((order) => {
            const isFoodPanda = order.customerType === CUSTOMER_TYPES.FOODPANDA;
            const item = order.items?.[0] || { name: 'Bun Kabab', qty: 1 };
            const timeFormatted = format(new Date(order.timestamp), 'hh:mm a, d MMM');

            return (
              <div key={order.id} className="py-3 flex items-center justify-between gap-3 hover:bg-stone-50/80 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isFoodPanda ? 'bg-pink-100 text-[#d70f64]' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isFoodPanda ? <Bike className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-stone-900 text-sm">{order.id}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${isFoodPanda ? 'bg-pink-50 text-[#d70f64] border-pink-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {isFoodPanda ? 'Food Panda' : 'Walk-in'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {order.items && order.items.length > 0
                        ? order.items.map((it) => `${it.qty}x ${it.name || 'Bun Kabab'}`).join(', ')
                        : `${item.qty}x Bun Kabab`} • {timeFormatted}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="block font-black text-stone-900 text-base">Rs {order.total}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReprintOrder(order)}
                    title="Print Receipt"
                    className="p-2 text-stone-400 hover:text-stone-700 rounded-xl transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
