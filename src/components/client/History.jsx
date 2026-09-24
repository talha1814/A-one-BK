import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Printer,
  User,
  Bike,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { CUSTOMER_TYPES } from '../../constants';
import { exportOrdersToCSV, clearAllOrders, resetToDemoData } from '../../utils/storage';

const ITEMS_PER_PAGE = 10;

export default function History({ orders, onReprintOrder, onRefreshOrders }) {
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filterType !== 'ALL' && order.customerType !== filterType) return false;
      if (selectedDate) {
        const orderDate = new Date(order.timestamp);
        const targetDate = new Date(`${selectedDate}T00:00:00`);
        if (!isSameDay(orderDate, targetDate)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesTotal = String(order.total).includes(q);
        if (!matchesId && !matchesTotal) return false;
      }
      return true;
    });
  }, [orders, filterType, selectedDate, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    if (window.confirm('Wipe current orders history?')) {
      clearAllOrders();
      onRefreshOrders();
    }
  };

  const handleLoadDemo = () => {
    resetToDemoData();
    onRefreshOrders();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-5 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
            Order History
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Total {orders.length} orders recorded ({filteredOrders.length} filtered)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportOrdersToCSV(filteredOrders)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleLoadDemo}
            title="Load demo sample orders"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold border border-stone-200 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Data</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            title="Clear all orders"
            className="p-2.5 rounded-2xl bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 border border-stone-200 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <section className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
        <div>
          <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-2">
            Filter by Customer Type:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange('ALL')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              All Orders ({orders.length})
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange(CUSTOMER_TYPES.WALKIN)}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                filterType === CUSTOMER_TYPES.WALKIN
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50/50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Walk-in</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange(CUSTOMER_TYPES.FOODPANDA)}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                filterType === CUSTOMER_TYPES.FOODPANDA
                  ? 'bg-[#d70f64] text-white border-[#d70f64] shadow-xs'
                  : 'bg-pink-50/50 text-[#d70f64] border-pink-200 hover:bg-pink-50'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Food Panda</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Order ID (e.g. ORD-005)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Calendar className="w-4 h-4 text-stone-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              />
            </div>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Orders List */}
      <section className="space-y-3">
        {paginatedOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-stone-200/80 shadow-xs">
            <p className="text-stone-600 text-sm font-semibold">
              No orders matched your search or filter.
            </p>
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const isFoodPanda = order.customerType === CUSTOMER_TYPES.FOODPANDA;
            const item = order.items?.[0] || { qty: 1, price: 80 };
            const timeFormatted = format(new Date(order.timestamp), 'dd MMM yyyy, hh:mm a');

            return (
              <div
                key={order.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isFoodPanda ? 'bg-pink-100 text-[#d70f64]' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isFoodPanda ? <Bike className="w-5 h-5 stroke-[2.5]" /> : <User className="w-5 h-5 stroke-[2.5]" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-stone-900">{order.id}</span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          isFoodPanda
                            ? 'bg-pink-50 text-[#d70f64] border-pink-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {isFoodPanda ? 'Food Panda Order' : 'Walk-in Customer'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 mt-1">
                      <span>{timeFormatted}</span>
                      <span>•</span>
                      <span className="font-semibold text-stone-700">
                        {item.qty}x Bun Kabab (@ Rs {item.price})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-0 border-stone-100">
                  <div className="text-left sm:text-right">
                    <span className="block text-[11px] font-bold text-stone-600 uppercase">Total</span>
                    <span className="text-xl sm:text-2xl font-black text-stone-900">
                      Rs {order.total}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onReprintOrder(order)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 text-xs font-bold transition cursor-pointer border border-stone-200/80"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-semibold text-stone-600">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
