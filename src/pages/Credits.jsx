import React, { useState, useEffect, useCallback } from 'react';
import { creditsAPI } from '../api/client';
import Card from '../components/Card';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  X,
  Phone,
  User,
  History,
  Coins
} from 'lucide-react';

export default function Credits() {
  const [credits, setCredits] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [items, setItems] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Payment Modal State
  const [activePaymentCredit, setActivePaymentCredit] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // View Details Modal State
  const [activeDetailCredit, setActiveDetailCredit] = useState(null);

  const formatPKR = (num) => `Rs ${Number(num || 0).toLocaleString()}`;

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await creditsAPI.getAll({
        status: statusFilter,
        search: searchQuery,
      });
      if (res.success) {
        setCredits(res.credits || []);
        setTotalOutstanding(res.totalOutstanding || 0);
      }
    } catch (err) {
      console.error('Fetch credits error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleAddCredit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !totalAmount) return;

    setSubmitting(true);
    try {
      const res = await creditsAPI.create({
        customerName: customerName.trim(),
        phone: phone.trim(),
        items: items.trim(),
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount) || 0,
        notes: notes.trim(),
      });

      if (res.success) {
        setCustomerName('');
        setPhone('');
        setItems('');
        setTotalAmount('');
        setPaidAmount('');
        setNotes('');
        setShowAddForm(false);
        fetchCredits();
      }
    } catch (err) {
      alert(err.message || 'Could not record credit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0 || !activePaymentCredit) return;

    setPaymentSubmitting(true);
    try {
      const res = await creditsAPI.recordPayment(activePaymentCredit._id, {
        amount: Number(paymentAmount),
        note: paymentNote.trim(),
      });

      if (res.success) {
        setActivePaymentCredit(null);
        setPaymentAmount('');
        setPaymentNote('');
        fetchCredits();
      }
    } catch (err) {
      alert(err.message || 'Could not record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleDeleteCredit = async (id) => {
    if (!window.confirm('Delete this customer credit record?')) return;
    try {
      await creditsAPI.delete(id);
      fetchCredits();
    } catch (err) {
      alert(err.message || 'Could not delete credit record');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'paid') {
      return (
        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
          PAID
        </span>
      );
    }
    if (status === 'partial') {
      return (
        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
          PARTIAL
        </span>
      );
    }
    return (
      <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-300">
        UNPAID
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📒</span>
            <h1 className="text-base sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
              On Account / Udhaar Khata
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 font-semibold mt-0.5">
            Customer balances & partial cash receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Outstanding Udhaar Card Badge */}
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl flex-1 sm:flex-none">
            <span className="text-[10px] uppercase font-black text-amber-800 block">
              Outstanding:
            </span>
            <span className="text-sm sm:text-xl font-black text-amber-700 font-mono">
              {formatPKR(totalOutstanding)}
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="touch-target px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-rose-900/20 active:scale-95 transition-all"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} strokeWidth={2.5} />}
            <span>{showAddForm ? 'Close' : '+ New Credit'}</span>
          </button>
        </div>
      </div>

      {/* Add New Credit Form Card */}
      {showAddForm && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-rose-400 shadow-xl space-y-3 animate-slide-up">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
            <h3 className="font-black text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Plus size={16} className="text-rose-600" />
              <span>Record Customer Credit (Naya Udhaar)</span>
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="touch-target p-1 text-stone-400 hover:text-stone-700"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAddCredit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            <div>
              <label className="block font-bold text-stone-600 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ali Shop, Ahmed Bhai"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-600 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="03xx-xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-600 mb-1">
                Total Amount (Rs) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 1500"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-600 mb-1">
                Amount Paid Now (Rs)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-600 mb-1">
                Items Taken (e.g. 10 Bun Kabab)
              </label>
              <input
                type="text"
                placeholder="Items description..."
                value={items}
                onChange={(e) => setItems(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-600 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="touch-target px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-900/20 active:scale-95"
              >
                {submitting ? 'Saving...' : 'Save Credit Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800 placeholder:text-stone-400"
          />
        </div>

        {/* Status Filter Badges (Scrollable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-bold">
          {[
            { id: 'all', label: 'All' },
            { id: 'unpaid', label: 'Unpaid' },
            { id: 'partial', label: 'Partial' },
            { id: 'paid', label: 'Paid' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-xl shrink-0 transition-all touch-manipulation active:scale-95 ${
                statusFilter === s.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-black text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
            <span>👥</span>
            <span>Customer Accounts ({credits.length})</span>
          </h3>
          <span className="text-xs font-mono font-bold text-amber-700">
            Due: {formatPKR(totalOutstanding)}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-400 font-bold text-xs">
            Loading credit records...
          </div>
        ) : credits.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs font-semibold">
            No credit records match your filter.
          </div>
        ) : (
          <div>
            {/* Mobile Card List (sm:hidden) */}
            <div className="divide-y divide-stone-100 sm:hidden">
              {credits.map((c) => (
                <div key={c._id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-stone-900 text-sm">
                        {c.customerName}
                      </div>
                      {c.phone && (
                        <div className="text-stone-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone size={10} />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </div>
                    <div>{getStatusBadge(c.status)}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 bg-stone-50 p-2 rounded-xl text-center text-[11px]">
                    <div>
                      <span className="text-stone-400 block font-semibold">Total</span>
                      <span className="font-mono font-bold text-stone-700">
                        {formatPKR(c.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700 block font-semibold">Paid</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatPKR(c.paidAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-rose-700 block font-semibold">Remaining</span>
                      <span className="font-mono font-black text-rose-700">
                        {formatPKR(c.remainingAmount)}
                      </span>
                    </div>
                  </div>

                  {c.items && (
                    <div className="text-[11px] text-stone-500 bg-stone-50 px-2 py-1 rounded-lg">
                      Items: {c.items}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {c.remainingAmount > 0 ? (
                      <button
                        onClick={() => {
                          setActivePaymentCredit(c);
                          setPaymentAmount(c.remainingAmount);
                        }}
                        className="touch-target px-3.5 py-1.5 bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Coins size={14} />
                        <span>Receive Cash</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600">✓ Balance Settled</span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveDetailCredit(c)}
                        className="touch-target p-2 text-stone-500 hover:text-stone-900 bg-stone-100 rounded-xl"
                        title="History"
                      >
                        <History size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCredit(c._id)}
                        className="touch-target p-2 text-rose-500 hover:text-rose-700 bg-rose-50 rounded-xl"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-400 uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Remaining</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold">
                  {credits.map((c) => (
                    <tr key={c._id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-800 text-sm">
                          {c.customerName}
                        </div>
                        {c.phone && (
                          <div className="text-stone-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone size={10} />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-stone-600 max-w-xs truncate">
                        {c.items || '-'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-stone-700">
                        {formatPKR(c.totalAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-600">
                        {formatPKR(c.paidAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-rose-600 text-sm">
                        {formatPKR(c.remainingAmount)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(c.status)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {c.remainingAmount > 0 && (
                            <button
                              onClick={() => {
                                setActivePaymentCredit(c);
                                setPaymentAmount(c.remainingAmount);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition-colors"
                            >
                              Receive Cash
                            </button>
                          )}

                          <button
                            onClick={() => setActiveDetailCredit(c)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100"
                            title="View Payment History"
                          >
                            <History size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteCredit(c._id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {activePaymentCredit && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-stone-200 animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-black text-emerald-600">
                  Receive Cash (Raqam Wasool)
                </span>
                <h3 className="text-base sm:text-lg font-black text-stone-900">
                  {activePaymentCredit.customerName}
                </h3>
              </div>
              <button
                onClick={() => setActivePaymentCredit(null)}
                className="touch-target p-2 text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs flex justify-between font-bold">
              <span className="text-amber-800">Remaining Balance:</span>
              <span className="text-rose-700 font-mono text-sm font-black">
                {formatPKR(activePaymentCredit.remainingAmount)}
              </span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Amount Received (Wasool Ki Gai Raqam) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={activePaymentCredit.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-base font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cash / JazzCash"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePaymentCredit(null)}
                  className="w-1/2 touch-target py-2.5 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="w-1/2 touch-target py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md shadow-emerald-900/20 active:scale-95"
                >
                  {paymentSubmitting ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details / Payment History Modal */}
      {activeDetailCredit && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-stone-200 animate-slide-up space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-black text-stone-400">
                  Customer Ledger Details
                </span>
                <h3 className="text-base sm:text-lg font-black text-stone-900">
                  {activeDetailCredit.customerName}
                </h3>
              </div>
              <button
                onClick={() => setActiveDetailCredit(null)}
                className="touch-target p-2 text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-stone-50 rounded-xl border">
                <span className="text-stone-400 block font-semibold text-[10px]">Total:</span>
                <span className="font-mono font-bold text-stone-800 text-xs">
                  {formatPKR(activeDetailCredit.totalAmount)}
                </span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 block font-semibold text-[10px]">Paid:</span>
                <span className="font-mono font-bold text-emerald-700 text-xs">
                  {formatPKR(activeDetailCredit.paidAmount)}
                </span>
              </div>
              <div className="p-2 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-rose-700 block font-semibold text-[10px]">Remaining:</span>
                <span className="font-mono font-black text-rose-700 text-xs">
                  {formatPKR(activeDetailCredit.remainingAmount)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-stone-800 text-xs uppercase mb-1.5">
                Payment History:
              </h4>
              {activeDetailCredit.payments && activeDetailCredit.payments.length > 0 ? (
                <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto border border-stone-100 rounded-2xl p-2 text-xs">
                  {activeDetailCredit.payments.map((p, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-emerald-600">
                          +{formatPKR(p.amount)}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {p.note || 'Cash payment'}
                        </div>
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {new Date(p.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-stone-400 text-center py-4">
                  No payment entries recorded yet.
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveDetailCredit(null)}
              className="w-full touch-target py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
