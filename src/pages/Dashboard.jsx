import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { salesAPI } from '../api/client';
import Card from '../components/Card';
import { 
  TrendingUp, 
  Calendar, 
  ReceiptText, 
  Coins, 
  BookOpen, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Clock, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    setError('');
    try {
      const res = await salesAPI.getDashboard();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30 seconds for multi-device sync
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Handle client delete wrong sale
  const handleDeleteSale = async (saleId) => {
    try {
      await salesAPI.delete(saleId);
      setDeleteConfirmId(null);
      fetchDashboardData(true);
    } catch (err) {
      alert(err.message || 'Could not delete order');
    }
  };

  const metrics = data?.metrics || {
    todaySale: 0,
    yesterdaySale: 0,
    todayExpense: 0,
    todayNetProfit: 0,
    outstandingCredit: 0,
    totalOrdersToday: 0,
  };

  const formatPKR = (num) => `Rs ${Number(num || 0).toLocaleString()}`;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-8">
      
      {/* Top Header & Mobile Quick Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📊</span>
            <div>
              <h1 className="text-base sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
                ERP Dashboard
              </h1>
              <p className="text-[10px] sm:text-xs text-stone-500 font-semibold">
                Business Day: <span className="font-mono text-stone-800 font-bold">{data?.businessDate || 'Today'}</span> (4 AM PKT)
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchDashboardData()}
            className="p-2 sm:p-2.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 touch-target"
            title="Refresh Data from MongoDB"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-rose-600' : ''} />
          </button>
        </div>

        {/* Quick Action Buttons (2x2 grid on mobile, row on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-1 border-t border-stone-100">
          <button
            onClick={() => navigate('/')}
            className="touch-target px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/20 active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            <span>+ New Sale</span>
          </button>

          <button
            onClick={() => navigate('/expenses')}
            className="touch-target px-3.5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <ReceiptText size={16} />
            <span>+ Kharcha</span>
          </button>

          <button
            onClick={() => navigate('/credits')}
            className="touch-target px-3.5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/20 active:scale-95 transition-all"
          >
            <BookOpen size={16} />
            <span>+ Udhaar</span>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="touch-target px-3.5 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-stone-200 active:scale-95 transition-all"
          >
            <FileText size={16} />
            <span>📄 Reports</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Cards: 6 Main Metrics (2 columns on mobile!) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {/* 1. Today's Sale (Green) */}
        <Card
          title="Aaj ki Sale"
          subtitle="Today's Sale"
          value={formatPKR(metrics.todaySale)}
          icon={TrendingUp}
          variant="green"
        />

        {/* 2. Yesterday's Sale */}
        <Card
          title="Kal ki Sale"
          subtitle="Yesterday's"
          value={formatPKR(metrics.yesterdaySale)}
          icon={Calendar}
          variant="stone"
        />

        {/* 3. Today's Expense (Red) */}
        <Card
          title="Aaj ka Kharcha"
          subtitle="Expenses"
          value={formatPKR(metrics.todayExpense)}
          icon={ReceiptText}
          variant="red"
        />

        {/* 4. Today's Net Profit */}
        <Card
          title="Aaj ka Munafa"
          subtitle="Net Profit"
          value={formatPKR(metrics.todayNetProfit)}
          icon={Coins}
          variant={metrics.todayNetProfit >= 0 ? 'green' : 'red'}
        />

        {/* 5. Outstanding Credit */}
        <Card
          title="Udhaar Baaki"
          subtitle="Total Credit"
          value={formatPKR(metrics.outstandingCredit)}
          icon={BookOpen}
          variant="orange"
        />

        {/* 6. Total Orders Today */}
        <Card
          title="Kul Orders"
          subtitle="Orders Count"
          value={metrics.totalOrdersToday}
          icon={ShoppingBag}
          variant="blue"
        />
      </div>

      {/* Middle Grid: Top Products & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Top Selling Products (Today) */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-black text-stone-900 text-xs sm:text-base flex items-center gap-1.5">
              <span>🏆</span>
              <span>Top Bun Kababs (Today)</span>
            </h3>
            <span className="text-[11px] text-stone-400 font-bold">Qty Sold</span>
          </div>

          {data?.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-2.5">
              {data.topProducts.map((p, idx) => {
                const maxQty = data.topProducts[0]?.qty || 1;
                const percentage = Math.round((p.qty / maxQty) * 100);
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-stone-700">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-[10px] font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="font-mono text-[11px] text-stone-500 shrink-0 ml-2">
                        {p.qty} sold ({formatPKR(p.revenue)})
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-stone-400 text-xs font-semibold">
              No sales recorded for today yet.
            </div>
          )}
        </div>

        {/* Recent Sales (Last 10 orders) with Client Delete Button */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg">🕒</span>
              <h3 className="font-black text-stone-900 text-xs sm:text-base">
                Recent Orders
              </h3>
            </div>
            <Link
              to="/reports"
              className="text-[11px] sm:text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ExternalLink size={12} />
            </Link>
          </div>

          {data?.recentSales && data.recentSales.length > 0 ? (
            <div className="divide-y divide-stone-100 max-h-[360px] overflow-y-auto pr-1">
              {data.recentSales.map((sale) => {
                const timeStr = new Intl.DateTimeFormat('en-US', {
                  timeZone: 'Asia/Karachi',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                }).format(new Date(sale.createdAt));

                const isConfirming = deleteConfirmId === sale._id;

                return (
                  <div
                    key={sale._id}
                    className="py-2.5 sm:py-3 flex items-center justify-between gap-2 hover:bg-stone-50/80 px-1 sm:px-2 rounded-2xl transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-stone-900 text-xs sm:text-sm">
                          {sale.orderNumber || '#Order'}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-stone-400 font-mono flex items-center gap-0.5">
                          <Clock size={11} />
                          {timeStr}
                        </span>
                        {sale.paymentMode === 'credit' && (
                          <span className="bg-amber-100 text-amber-800 font-black text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full border border-amber-300">
                            Udhaar ({sale.customerName})
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] sm:text-xs text-stone-500 truncate mt-0.5">
                        {sale.items?.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2 sm:gap-3">
                      <div className="font-black text-rose-600 font-mono text-xs sm:text-base">
                        {formatPKR(sale.total)}
                      </div>

                      {/* Client Delete Wrong Order Button */}
                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteSale(sale._id)}
                            className="px-2 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg hover:bg-rose-700"
                          >
                            Del
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-stone-200 text-stone-700 text-[10px] font-black rounded-lg hover:bg-stone-300"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(sale._id)}
                          className="touch-target p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"
                          title="Delete wrong order"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-stone-400 text-xs font-semibold">
              No orders today yet.
            </div>
          )}
        </div>

      </div>

      {/* Bottom Row: Recent Expenses summary */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <ReceiptText className="text-rose-600" size={16} />
            <h3 className="font-black text-stone-900 text-xs sm:text-base">
              Recent Expenses (Aaj ke Akhrajaat)
            </h3>
          </div>
          <Link
            to="/expenses"
            className="text-[11px] sm:text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <span>Manage All</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        {data?.recentExpenses && data.recentExpenses.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {data.recentExpenses.map((exp) => (
              <div
                key={exp._id}
                className="p-2.5 sm:p-3 rounded-2xl bg-rose-50/50 border border-rose-100 flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-stone-800 text-xs truncate">
                    {exp.description}
                  </div>
                  <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
                    {exp.units} {exp.unitType}
                  </div>
                </div>
                <div className="mt-1.5 text-xs sm:text-sm font-black text-rose-700 font-mono">
                  {formatPKR(exp.price)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-stone-400 text-xs font-semibold">
            No expenses logged for today yet.
          </div>
        )}
      </div>

    </div>
  );
}
