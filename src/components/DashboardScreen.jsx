import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  User,
  Bike,
  Calendar,
  Clock,
  Printer,
  ChevronRight,
  Filter,
  BarChart3,
  CalendarDays,
  Hash,
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
import { PRODUCT, CUSTOMER_TYPES, CUSTOMER_TYPE_CONFIG } from '../constants';

export default function DashboardScreen({ orders, onReprintOrder }) {
  const [selectedDateStr, setSelectedDateStr] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  const now = new Date();

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

  // 2. Weekly Sales (Last 7 days)
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

  // 3. Monthly Sales (Current month)
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

    // Group by weeks or 5-day intervals for clean monthly chart
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

  // 5. Recent 10 Orders
  const recentOrders = useMemo(() => {
    return orders.slice(0, 10);
  }, [orders]);

  // Custom Chart Tooltip
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
              Rs{' '}
              {payload.reduce((sum, entry) => sum + (entry.value || 0), 0)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Sales Analytics & Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Live breakdown of Walk-in vs Food Panda Bun Kabab sales
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-stone-600 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs self-start">
          <Clock className="w-3.5 h-3.5 text-stone-500" />
          <span>Updated: {format(now, 'hh:mm a')}</span>
        </div>
      </div>

      {/* SECTION A: TODAY'S SUMMARY CARDS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-wider uppercase text-stone-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Today's Performance Overview
          </h2>
          <span className="text-xs text-stone-600 font-semibold">
            {format(now, 'EEEE, d MMM yyyy')}
          </span>
        </div>

        {/* 3 Top Combined Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Total Sales (Rs) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-stone-600">
                Today's Total Sales
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                Rs
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-stone-900 tracking-tight">
                Rs {todayMetrics.totalRs.toLocaleString()}
              </span>
              <p className="text-xs text-stone-600 mt-0.5">
                Both Walk-in & Food Panda combined
              </p>
            </div>
          </div>

          {/* Total Items Sold */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-stone-600">
                Bun Kababs Sold
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg">
                🍔
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-stone-900 tracking-tight">
                {todayMetrics.totalItems} pcs
              </span>
              <p className="text-xs text-stone-600 mt-0.5">
                @ Rs {PRODUCT.price} per Bun Kabab
              </p>
            </div>
          </div>

          {/* Total Orders Count */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-stone-600">
                Total Orders Logged
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                #
              </div>
            </div>
            <div className="mt-2">
              <span className="text-3xl font-black text-stone-900 tracking-tight">
                {todayMetrics.totalOrders}
              </span>
              <p className="text-xs text-stone-600 mt-0.5">
                {todayMetrics.walkinOrdersCount} walk-in + {todayMetrics.foodpandaOrdersCount} online
              </p>
            </div>
          </div>
        </div>

        {/* PROPER SEPARATION: Walk-in (Green) vs Food Panda (Pink) Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
          {/* GREEN CARD: Walk-in Customer Sales */}
          <div className="bg-linear-to-br from-emerald-600 to-emerald-700 text-white p-5 rounded-3xl shadow-md shadow-emerald-600/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <User className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-xs font-black tracking-wider uppercase text-emerald-100">
                    Walk-in Customers
                  </span>
                  <span className="text-[11px] text-emerald-200 font-medium">
                    Counter Dine-in & Takeaway
                  </span>
                </div>
              </div>
              <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full text-white">
                {todayMetrics.walkinOrdersCount} Orders
              </span>
            </div>

            <div className="mt-4 pt-2 border-t border-emerald-500/50 flex items-end justify-between">
              <div>
                <span className="block text-xs text-emerald-100 font-medium">
                  Walk-in Revenue
                </span>
                <span className="text-3xl sm:text-4xl font-black tracking-tight">
                  Rs {todayMetrics.walkinRs.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs text-emerald-100 font-medium">
                  Items Sold
                </span>
                <span className="text-xl font-black text-white">
                  {todayMetrics.walkinItems} pcs
                </span>
              </div>
            </div>
          </div>

          {/* PINK/RED CARD: Food Panda Order Sales */}
          <div className="bg-linear-to-br from-[#d70f64] to-[#b30850] text-white p-5 rounded-3xl shadow-md shadow-pink-600/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bike className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-xs font-black tracking-wider uppercase text-pink-100">
                    Food Panda Orders
                  </span>
                  <span className="text-[11px] text-pink-200 font-medium">
                    Online Delivery Partners
                  </span>
                </div>
              </div>
              <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full text-white">
                {todayMetrics.foodpandaOrdersCount} Orders
              </span>
            </div>

            <div className="mt-4 pt-2 border-t border-pink-500/50 flex items-end justify-between">
              <div>
                <span className="block text-xs text-pink-100 font-medium">
                  Food Panda Revenue
                </span>
                <span className="text-3xl sm:text-4xl font-black tracking-tight">
                  Rs {todayMetrics.foodpandaRs.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs text-pink-100 font-medium">
                  Items Sold
                </span>
                <span className="text-xl font-black text-white">
                  {todayMetrics.foodpandaItems} pcs
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: WEEKLY SALES (Last 7 Days) */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-rose-600" />
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Weekly Sales (Last 7 Days)
              </h2>
            </div>
            <p className="text-xs text-stone-600">
              Two bars per day comparing Walk-in vs Food Panda volume
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span className="font-bold text-stone-700">
                Walk-in: Rs {weeklyData.weeklyWalkinTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#d70f64]" />
              <span className="font-bold text-stone-700">
                Food Panda: Rs {weeklyData.weeklyFoodpandaTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData.chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortDay"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `Rs ${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                formatter={(val) => (val === 'WalkIn' ? 'Walk-in Customer' : 'Food Panda')}
              />
              <Bar
                dataKey="WalkIn"
                name="WalkIn"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                barSize={18}
              />
              <Bar
                dataKey="FoodPanda"
                name="FoodPanda"
                fill="#d70f64"
                radius={[6, 6, 0, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-stone-50 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-stone-600">
            7-Day Combined Revenue:
          </span>
          <span className="text-base font-black text-stone-900">
            Rs {weeklyData.weeklyCombinedTotal.toLocaleString()}
          </span>
        </div>
      </section>

      {/* SECTION C: MONTHLY SALES (Current Month) */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-rose-600" />
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Monthly Sales ({format(now, 'MMMM yyyy')})
              </h2>
            </div>
            <p className="text-xs text-stone-600">
              Month-to-date trajectory and split by channel
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-stone-600 font-bold block">
              Month Total
            </span>
            <span className="text-xl font-black text-rose-600">
              Rs {monthlyData.monthCombinedTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Month Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60">
            <span className="block text-[11px] font-bold text-stone-600">
              Walk-in Revenue
            </span>
            <span className="block text-lg font-black text-emerald-700 mt-0.5">
              Rs {monthlyData.monthWalkinTotal.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60">
            <span className="block text-[11px] font-bold text-stone-600">
              Food Panda Revenue
            </span>
            <span className="block text-lg font-black text-[#d70f64] mt-0.5">
              Rs {monthlyData.monthFoodpandaTotal.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60">
            <span className="block text-[11px] font-bold text-stone-600">
              Total Month Orders
            </span>
            <span className="block text-lg font-black text-stone-900 mt-0.5">
              {monthlyData.monthOrdersCount}
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60">
            <span className="block text-[11px] font-bold text-stone-600">
              Total Bun Kababs
            </span>
            <span className="block text-lg font-black text-stone-900 mt-0.5">
              {monthlyData.monthItemsTotal} pcs
            </span>
          </div>
        </div>

        {/* Month Daily Trend Chart */}
        <div className="h-60 sm:h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData.dailyPoints}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `Rs ${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="WalkIn" name="WalkIn" stackId="a" fill="#10b981" />
              <Bar dataKey="FoodPanda" name="FoodPanda" stackId="a" fill="#d70f64" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SECTION D: SPECIFIC DATE CALCULATOR */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-600" />
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Specific Date Sales Calculator
              </h2>
            </div>
            <p className="text-xs text-stone-600">
              Pick any date on the calendar to see exact sales & item breakdown
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-stone-600 shrink-0">
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            />
          </div>
        </div>

        {specificDateMetrics && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-600 bg-stone-50 p-3 rounded-2xl">
              <span>Date Selected: {specificDateMetrics.dateFormatted}</span>
              <span>Total Orders on this day: {specificDateMetrics.ordersCount}</span>
            </div>

            {/* Specific Date Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Card */}
              <div className="bg-stone-900 text-white p-4 rounded-2xl">
                <span className="block text-[11px] font-bold text-stone-400 uppercase">
                  Day Total Revenue
                </span>
                <span className="block text-2xl font-black text-rose-400 mt-1">
                  Rs {specificDateMetrics.totalRs.toLocaleString()}
                </span>
                <span className="block text-xs text-stone-300 mt-0.5">
                  {specificDateMetrics.totalItems} Bun Kababs sold
                </span>
              </div>

              {/* Walk-in Card */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-emerald-800">
                  <span className="text-[11px] font-black uppercase">
                    Walk-in Sales
                  </span>
                  <User className="w-4 h-4" />
                </div>
                <span className="block text-2xl font-black text-emerald-700 mt-1">
                  Rs {specificDateMetrics.walkinRs.toLocaleString()}
                </span>
                <span className="block text-xs text-emerald-800 mt-0.5">
                  {specificDateMetrics.walkinCount} orders ({specificDateMetrics.walkinItems} pcs)
                </span>
              </div>

              {/* Food Panda Card */}
              <div className="bg-pink-50 border border-pink-200 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-[#d70f64]">
                  <span className="text-[11px] font-black uppercase">
                    Food Panda Sales
                  </span>
                  <Bike className="w-4 h-4" />
                </div>
                <span className="block text-2xl font-black text-[#d70f64] mt-1">
                  Rs {specificDateMetrics.foodpandaRs.toLocaleString()}
                </span>
                <span className="block text-xs text-pink-700 mt-0.5">
                  {specificDateMetrics.foodpandaCount} orders ({specificDateMetrics.foodpandaItems} pcs)
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION E: RECENT ORDERS LIST (Last 10 Orders) */}
      <section className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              Recent 10 Orders
            </h2>
            <p className="text-xs text-stone-600">
              Quick view of latest orders with customer type badges
            </p>
          </div>
          <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
            Latest First
          </span>
        </div>

        <div className="divide-y divide-stone-100">
          {recentOrders.length === 0 ? (
            <p className="text-center py-8 text-stone-600 text-xs">
              No orders logged yet.
            </p>
          ) : (
            recentOrders.map((order) => {
              const isFoodPanda = order.customerType === CUSTOMER_TYPES.FOODPANDA;
              const item = order.items && order.items[0] ? order.items[0] : { qty: 1 };
              const timeFormatted = format(new Date(order.timestamp), 'hh:mm a, d MMM');

              return (
                <div
                  key={order.id}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-stone-50/80 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isFoodPanda
                          ? 'bg-pink-100 text-[#d70f64]'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isFoodPanda ? <Bike className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-900 text-sm">
                          {order.id}
                        </span>
                        {/* Colored badge */}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            isFoodPanda
                              ? 'bg-pink-50 text-[#d70f64] border-pink-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isFoodPanda ? 'Food Panda' : 'Walk-in'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {item.qty}x Bun Kabab • {timeFormatted}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="block font-black text-stone-900 text-base">
                        Rs {order.total}
                      </span>
                      <span className="text-[10px] font-bold text-stone-600">
                        {order.printed ? 'Printed' : 'Unprinted'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onReprintOrder(order)}
                      title="Print / View Receipt"
                      className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
