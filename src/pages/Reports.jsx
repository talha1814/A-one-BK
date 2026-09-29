import React, { useState, useEffect, useCallback } from 'react';
import { salesAPI } from '../api/client';
import DateRangePicker from '../components/DateRangePicker';
import Card from '../components/Card';
import { 
  TrendingUp, 
  ShoppingBag, 
  ReceiptText, 
  Coins, 
  Printer, 
  Download, 
  Calendar, 
  ChevronRight, 
  Clock, 
  Trash2, 
  X,
  FileSpreadsheet
} from 'lucide-react';

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateDetail, setDateDetail] = useState(null);
  const [dateDetailLoading, setDateDetailLoading] = useState(false);
  const [currentRange, setCurrentRange] = useState({ from: '', to: '' });

  const fetchReport = useCallback(async (from, to) => {
    setLoading(true);
    setCurrentRange({ from, to });
    try {
      const res = await salesAPI.getReport(from, to);
      if (res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSelectDate = async (date) => {
    setSelectedDate(date);
    setDateDetailLoading(true);
    try {
      const res = await salesAPI.getByDate(date);
      if (res.success) {
        setDateDetail(res);
      }
    } catch (err) {
      console.error('Date detail error:', err);
    } finally {
      setDateDetailLoading(false);
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Delete this order record from database?')) return;
    try {
      await salesAPI.delete(saleId);
      if (selectedDate) handleSelectDate(selectedDate);
      fetchReport(currentRange.from, currentRange.to);
    } catch (err) {
      alert(err.message || 'Could not delete order');
    }
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.dailyBreakdown) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Orders,Total Sales (PKR),Total Expense (PKR),Net Profit (PKR)\r\n';

    reportData.dailyBreakdown.forEach((row) => {
      csvContent += `${row.date},${row.orders},${row.sales},${row.expense},${row.profit}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${reportData.from}_to_${reportData.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatPKR = (num) => `Rs ${Number(num || 0).toLocaleString()}`;
  const summary = reportData?.summary || { totalSales: 0, totalOrders: 0, totalExpense: 0, netProfit: 0 };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-8">
      
      {/* Header and Print/Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📄</span>
            <h1 className="text-base sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
              Sales Reports (Report Overview)
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 font-semibold mt-0.5">
            Range: <span className="font-mono text-stone-800 font-bold">{reportData?.from || '...'}</span> to <span className="font-mono text-stone-800 font-bold">{reportData?.to || '...'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!reportData}
            className="flex-1 sm:flex-none touch-target px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-stone-200 transition-all active:scale-95"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none touch-target px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Date Range Picker Component */}
      <div className="no-print">
        <DateRangePicker onApply={fetchReport} defaultRange={currentRange} />
      </div>

      {/* Summary Cards: 2 cols on mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <Card
          title="Kul Sale"
          subtitle="Total Sales"
          value={formatPKR(summary.totalSales)}
          icon={TrendingUp}
          variant="green"
        />
        <Card
          title="Kul Orders"
          subtitle="Orders Count"
          value={summary.totalOrders}
          icon={ShoppingBag}
          variant="blue"
        />
        <Card
          title="Kul Kharcha"
          subtitle="Total Expenses"
          value={formatPKR(summary.totalExpense)}
          icon={ReceiptText}
          variant="red"
        />
        <Card
          title="Kul Munafa"
          subtitle="Net Profit"
          value={formatPKR(summary.netProfit)}
          icon={Coins}
          variant={summary.netProfit >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Product-wise Breakdown & Daily Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Product-Wise Breakdown */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-black text-stone-900 text-xs sm:text-base flex items-center gap-1.5">
              <span>🍔</span>
              <span>Product-Wise Sales</span>
            </h3>
            <span className="text-[11px] text-stone-400 font-bold">Qty & Revenue</span>
          </div>

          {reportData?.productBreakdown && reportData.productBreakdown.length > 0 ? (
            <div className="space-y-2">
              {reportData.productBreakdown.map((item, idx) => (
                <div
                  key={item.name}
                  className="p-2.5 sm:p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-rose-100 text-rose-700 font-black text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-stone-800 text-xs sm:text-sm truncate">
                        {item.name}
                      </h4>
                      <span className="text-[10px] sm:text-xs text-stone-400 font-semibold">
                        {item.qty} items sold
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black text-rose-600 font-mono">
                      {formatPKR(item.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-stone-400 text-xs font-semibold">
              No product sales in selected range.
            </div>
          )}
        </div>

        {/* Daily Breakdown Table */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-black text-stone-900 text-xs sm:text-base flex items-center gap-1.5">
              <span>📅</span>
              <span>Daily Breakdown</span>
            </h3>
            <span className="text-[11px] text-stone-400 font-bold">Tap row for full day detail</span>
          </div>

          {reportData?.dailyBreakdown && reportData.dailyBreakdown.length > 0 ? (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left text-xs min-w-[320px]">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-1.5 text-center">Orders</th>
                    <th className="py-2.5 px-2 text-right">Sales</th>
                    <th className="py-2.5 px-2 text-right">Expense</th>
                    <th className="py-2.5 px-2 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold">
                  {reportData.dailyBreakdown.map((row) => (
                    <tr
                      key={row.date}
                      onClick={() => handleSelectDate(row.date)}
                      className={`cursor-pointer transition-colors touch-manipulation ${
                        selectedDate === row.date
                          ? 'bg-rose-50 text-rose-900 font-bold'
                          : 'hover:bg-stone-50 active:bg-stone-100'
                      }`}
                    >
                      <td className="py-3 px-2 font-mono font-bold text-stone-800">
                        {row.date}
                      </td>
                      <td className="py-3 px-1.5 text-center font-mono">{row.orders}</td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-600 font-bold">
                        {formatPKR(row.sales)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-rose-600">
                        {formatPKR(row.expense)}
                      </td>
                      <td
                        className={`py-3 px-2 text-right font-mono font-black ${
                          row.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatPKR(row.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-6 text-center text-stone-400 text-xs font-semibold">
              No sales recorded for the selected dates.
            </div>
          )}
        </div>

      </div>

      {/* Selected Day Full Detail Modal (Mobile-Friendly Dialog) */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-stone-200 animate-slide-up max-h-[90vh] flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2.5 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-black text-rose-600 tracking-wider">
                  Full Day Receipts & Expenses
                </span>
                <h2 className="text-base sm:text-xl font-black text-stone-900 font-mono">
                  {selectedDate}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="touch-target p-2 rounded-xl text-stone-400 hover:text-stone-800"
              >
                <X size={20} />
              </button>
            </div>

            {dateDetailLoading ? (
              <div className="py-12 text-center text-stone-400 font-bold">
                Loading day details...
              </div>
            ) : (
              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {/* Day Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 block">Total Sale:</span>
                    <span className="text-sm sm:text-base font-black text-emerald-700 font-mono">
                      {formatPKR(dateDetail?.totalSale)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-800 block">Total Expense:</span>
                    <span className="text-sm sm:text-base font-black text-rose-700 font-mono">
                      {formatPKR(dateDetail?.totalExpense)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-800 block">Net Munafa:</span>
                    <span className="text-sm sm:text-base font-black text-stone-800 font-mono">
                      {formatPKR(dateDetail?.netProfit)}
                    </span>
                  </div>
                  <div className="p-2.5 bg-sky-50 rounded-2xl border border-sky-200">
                    <span className="text-[10px] font-bold text-sky-800 block">Orders:</span>
                    <span className="text-sm sm:text-base font-black text-sky-700 font-mono">
                      {dateDetail?.totalOrders}
                    </span>
                  </div>
                </div>

                {/* Day's Individual Orders List */}
                <div>
                  <h4 className="font-black text-stone-900 text-xs mb-1.5">
                    Orders That Day ({dateDetail?.sales?.length || 0})
                  </h4>
                  <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto border border-stone-100 rounded-2xl p-2 text-xs">
                    {dateDetail?.sales?.map((s) => (
                      <div
                        key={s._id}
                        className="py-2 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-stone-800 flex items-center gap-1.5">
                            <span>{s.orderNumber || '#Order'}</span>
                            <span className="text-stone-400 font-mono text-[10px]">
                              {new Intl.DateTimeFormat('en-US', {
                                timeZone: 'Asia/Karachi',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              }).format(new Date(s.createdAt))}
                            </span>
                            {s.paymentMode === 'credit' && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1 rounded">
                                Udhaar
                              </span>
                            )}
                          </div>
                          <div className="text-stone-400 text-[11px] truncate">
                            {s.items?.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-rose-600 font-mono text-xs">
                            {formatPKR(s.total)}
                          </span>
                          <button
                            onClick={() => handleDeleteSale(s._id)}
                            className="touch-target p-1 text-stone-400 hover:text-rose-600 flex items-center justify-center"
                            title="Delete order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day's Expenses List */}
                {dateDetail?.expenses && dateDetail.expenses.length > 0 && (
                  <div>
                    <h4 className="font-black text-stone-900 text-xs mb-1.5">
                      Expenses ({dateDetail.expenses.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {dateDetail.expenses.map((e) => (
                        <div
                          key={e._id}
                          className="p-2 rounded-xl bg-rose-50/60 border border-rose-100 text-xs"
                        >
                          <div className="font-bold text-stone-800 truncate">
                            {e.description}
                          </div>
                          <div className="text-stone-400 text-[10px]">
                            {e.units} {e.unitType}
                          </div>
                          <div className="font-black text-rose-700 font-mono mt-0.5">
                            {formatPKR(e.price)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full touch-target py-2.5 bg-stone-100 rounded-xl text-xs font-bold text-stone-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
