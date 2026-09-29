import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI, productsAPI } from '../../api/client';
import Card from '../../components/Card';
import { 
  Users, 
  TrendingUp, 
  ShoppingBag, 
  Coins, 
  ReceiptText, 
  BookOpen, 
  RefreshCw, 
  Plus, 
  Calendar, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Package,
  Power
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [closingDay, setClosingDay] = useState(false);
  const [closeDayMessage, setCloseDayMessage] = useState(null);

  // Products Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdEmoji, setNewProdEmoji] = useState('🍔');
  const [prodSubmitting, setProdSubmitting] = useState(false);

  const fetchOverview = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await adminAPI.getOverview();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Admin overview error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadProducts = async () => {
    try {
      const res = await productsAPI.getAll();
      if (res.success) setProducts(res.products || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOverview();
    loadProducts();
  }, [fetchOverview]);

  // Manual "Close Day Now" Trigger (Requirement: ALSO add a manual "Close Day Now" button on Admin Panel)
  const handleCloseDayNow = async () => {
    if (!window.confirm('Trigger manual business day close/archive for all active clients?')) return;
    setClosingDay(true);
    setCloseDayMessage(null);
    try {
      const res = await adminAPI.closeDay({});
      if (res.success) {
        setCloseDayMessage({ type: 'success', text: res.message });
        fetchOverview();
      }
    } catch (err) {
      setCloseDayMessage({ type: 'error', text: err.message || 'Could not close day' });
    } finally {
      setClosingDay(false);
    }
  };

  // Add Product globally
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;
    setProdSubmitting(true);
    try {
      const res = await productsAPI.create({
        name: newProdName.trim(),
        price: Number(newProdPrice),
        emoji: newProdEmoji,
        category: 'bun-kabab',
      });
      if (res.success) {
        setNewProdName('');
        setNewProdPrice('');
        loadProducts();
      }
    } catch (err) {
      alert(err.message || 'Could not create product');
    } finally {
      setProdSubmitting(false);
    }
  };

  const formatPKR = (num) => `Rs ${Number(num || 0).toLocaleString()}`;
  const metrics = data?.metrics || {
    totalClients: 0,
    totalTodaySale: 0,
    totalYesterdaySale: 0,
    totalTodayOrders: 0,
    totalTodayExpense: 0,
    todayNetProfit: 0,
    totalOutstandingCredit: 0,
    allTimeRevenue: 0,
    allTimeOrders: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 text-white p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Super Admin Dashboard</span>
              <span className="text-xs bg-amber-400 text-stone-950 font-extrabold px-2 py-0.5 rounded-full uppercase">
                Owner Access
              </span>
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Live multi-tenant monitoring across all Bun Kabab shop clients
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Manual "Close Day Now" Button */}
          <button
            onClick={handleCloseDayNow}
            disabled={closingDay}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition-all active:scale-95 disabled:opacity-50"
            title="Manual 4 AM Rollover trigger"
          >
            <Power size={16} />
            <span>{closingDay ? 'Closing Day...' : 'Close Day Now'}</span>
          </button>

          <Link
            to="/admin/clients"
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-stone-700"
          >
            <Users size={16} />
            <span>Manage Clients</span>
          </Link>

          <Link
            to="/admin/reports"
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-stone-700"
          >
            <span>All Shop Reports</span>
          </Link>

          <button
            onClick={() => setShowProductModal(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-stone-700"
          >
            <Package size={16} />
            <span>Products Catalog</span>
          </button>

          <button
            onClick={() => fetchOverview()}
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white border border-stone-700"
            title="Refresh All Data"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-amber-400' : ''} />
          </button>
        </div>
      </div>

      {/* Close Day Toast / Notification */}
      {closeDayMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            closeDayMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-rose-950 text-rose-300 border-rose-800'
          }`}
        >
          {closeDayMessage.type === 'success' ? (
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
          )}
          <span>{closeDayMessage.text}</span>
        </div>
      )}

      {/* Master Overview Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card
          title="All Shops Sale"
          subtitle="Today's Global Sales"
          value={formatPKR(metrics.totalTodaySale)}
          icon={TrendingUp}
          variant="green"
        />

        <Card
          title="Total Clients"
          subtitle="Active Shop Tenants"
          value={metrics.totalClients}
          icon={Users}
          variant="blue"
        />

        <Card
          title="Orders Today"
          subtitle="Across All Shops"
          value={metrics.totalTodayOrders}
          icon={ShoppingBag}
          variant="stone"
        />

        <Card
          title="Total Expenses"
          subtitle="Today's Global Cost"
          value={formatPKR(metrics.totalTodayExpense)}
          icon={ReceiptText}
          variant="red"
        />

        <Card
          title="Net Profit"
          subtitle="Global Daily Profit"
          value={formatPKR(metrics.todayNetProfit)}
          icon={Coins}
          variant={metrics.todayNetProfit >= 0 ? 'green' : 'red'}
        />

        <Card
          title="Total Udhaar"
          subtitle="All Outstanding Credit"
          value={formatPKR(metrics.totalOutstandingCredit)}
          icon={BookOpen}
          variant="orange"
        />
      </div>

      {/* Client Overview Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
              <span>🏪</span>
              <span>Registered Clients & Today's Performance</span>
            </h3>
            <p className="text-xs text-stone-500 font-semibold mt-0.5">
              Live status and sales by shop tenant
            </p>
          </div>
          <Link
            to="/admin/clients"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <span>+ Add / Edit Clients</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-400 font-bold text-xs">
            Loading clients data...
          </div>
        ) : data?.clientSummaries?.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs font-semibold">
            No clients registered yet. Click 'Manage Clients' to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-400 uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Shop Name</th>
                  <th className="py-3 px-4">User ID (Login)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Today's Sales</th>
                  <th className="py-3 px-4 text-right">Orders</th>
                  <th className="py-3 px-4 text-right">Today's Profit</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold">
                {data.clientSummaries.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-800 text-sm">
                      {c.shopName}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-stone-600">
                      @{c.username}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          c.active
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {c.active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      {formatPKR(c.todaySale)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      {c.todayOrders}
                    </td>

                    <td
                      className={`py-3.5 px-4 text-right font-mono font-black ${
                        c.todayProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatPKR(c.todayProfit)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/admin/reports?clientId=${c.id}`}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-900 hover:text-white rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <span>View Report</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Global Product Catalog Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                <Package size={18} className="text-rose-600" />
                <span>Global Product Catalog</span>
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {/* Add Product Form */}
            <form onSubmit={handleAddProduct} className="flex gap-2 text-xs">
              <input
                type="text"
                required
                placeholder="Product Name (e.g. Special Zinger Bun Kabab)"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="flex-1 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
              />
              <input
                type="number"
                required
                min="1"
                placeholder="Price (Rs)"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value)}
                className="w-24 px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold"
              />
              <button
                type="submit"
                disabled={prodSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
              >
                Add
              </button>
            </form>

            {/* Products List */}
            <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
              {products.map((p) => (
                <div key={p._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.emoji || '🍔'}</span>
                    <div>
                      <div className="font-bold text-stone-800">{p.name}</div>
                      <div className="text-[11px] text-stone-400">Rs {p.price}</div>
                    </div>
                  </div>
                  <span className="text-emerald-700 font-mono font-black">
                    Rs {p.price}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowProductModal(false)}
              className="w-full py-2 bg-stone-100 rounded-xl text-xs font-bold text-stone-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
