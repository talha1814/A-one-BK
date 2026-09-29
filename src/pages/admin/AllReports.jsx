import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminAPI } from '../../api/client';
import Card from '../../components/Card';
import DateRangePicker from '../../components/DateRangePicker';
import { 
  ArrowLeft, 
  TrendingUp, 
  ShoppingBag, 
  ReceiptText, 
  Coins, 
  Printer, 
  Download, 
  Users,
  Store,
  Calendar
} from 'lucide-react';

export default function AllReports() {
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get('clientId') || '';

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Load clients list
  useEffect(() => {
    adminAPI.getClients().then((res) => {
      if (res.success && res.clients) {
        setClients(res.clients);
        if (!selectedClientId && res.clients.length > 0) {
          setSelectedClientId(res.clients[0]._id);
        }
      }
    });
  }, []);

  // Fetch report for selected client
  const fetchReport = useCallback(async (from, to) => {
    if (!selectedClientId) return;
    setLoading(true);
    setDateRange({ from, to });
    try {
      const res = await adminAPI.getReports(selectedClientId, from, to);
      if (res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.error('Fetch client report error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchReport(dateRange.from, dateRange.to);
    }
  }, [selectedClientId, fetchReport]);

  const formatPKR = (num) => `Rs ${Number(num || 0).toLocaleString()}`;
  const summary = reportData?.summary || { totalSales: 0, totalOrders: 0, totalExpenses: 0, netProfit: 0, outstandingCredit: 0 };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📑</span>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Client Specific Reports (Multi-Tenant)
              </h1>
            </div>
            <p className="text-xs text-stone-500 font-semibold mt-0.5">
              Inspect any tenant's detailed sales, expenses and balance ledger
            </p>
          </div>
        </div>

        {/* Client Switcher Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-600">Select Client:</label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.shopName} (@{c.username})
              </option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-stone-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="no-print">
        <DateRangePicker onApply={fetchReport} defaultRange={dateRange} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card
          title="Client Total Sale"
          subtitle={reportData?.client?.shopName}
          value={formatPKR(summary.totalSales)}
          icon={TrendingUp}
          variant="green"
        />
        <Card
          title="Client Orders"
          subtitle="Orders in Range"
          value={summary.totalOrders}
          icon={ShoppingBag}
          variant="blue"
        />
        <Card
          title="Client Expenses"
          subtitle="Kharcha in Range"
          value={formatPKR(summary.totalExpenses)}
          icon={ReceiptText}
          variant="red"
        />
        <Card
          title="Client Net Profit"
          subtitle="Munafa"
          value={formatPKR(summary.netProfit)}
          icon={Coins}
          variant={summary.netProfit >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Sales Orders List for Client */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-800 text-sm flex items-center gap-2">
            <span>📋</span>
            <span>Client Sales Records ({reportData?.sales?.length || 0})</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-400 font-bold text-xs">
            Loading tenant report...
          </div>
        ) : reportData?.sales?.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs font-semibold">
            No sales recorded in this date range for this client.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-400 uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold">
                {reportData?.sales?.map((s) => (
                  <tr key={s._id} className="hover:bg-stone-50">
                    <td className="py-3 px-4 font-mono text-stone-500">
                      {new Intl.DateTimeFormat('en-US', {
                        timeZone: 'Asia/Karachi',
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }).format(new Date(s.createdAt))}
                    </td>

                    <td className="py-3 px-4 font-bold text-stone-800">
                      {s.orderNumber || '#Order'}
                    </td>

                    <td className="py-3 px-4 text-stone-600 max-w-sm truncate">
                      {s.items?.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                    </td>

                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded font-bold text-[10px] bg-stone-100 text-stone-700">
                        {s.paymentMode}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                      {formatPKR(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
