import React, { useState, useEffect, useCallback } from 'react';
import { expensesAPI } from '../api/client';
import Card from '../components/Card';
import { ReceiptText, Plus, Trash2, Edit2, Check, X, Filter, Calendar } from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [filter, setFilter] = useState('today');
  const [loading, setLoading] = useState(true);

  // Form State
  const [description, setDescription] = useState('');
  const [units, setUnits] = useState('');
  const [unitType, setUnitType] = useState('pcs');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const formatPKR = (num) => `Rs ${Number(num || 0).toLocaleString()}`;

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let from = '';
      let to = '';

      if (filter === 'today') {
        const res = await expensesAPI.getToday();
        if (res.success) {
          setExpenses(res.expenses || []);
          setTotalExpense(res.totalTodayExpense || 0);
        }
        setLoading(false);
        return;
      } else if (filter === 'week') {
        const past7 = new Date(now);
        past7.setDate(past7.getDate() - 6);
        from = past7.toISOString().split('T')[0];
        to = now.toISOString().split('T')[0];
      } else if (filter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        from = startOfMonth.toISOString().split('T')[0];
        to = now.toISOString().split('T')[0];
      }

      const res = await expensesAPI.getRange(from, to);
      if (res.success) {
        setExpenses(res.expenses || []);
        setTotalExpense(res.totalExpense || 0);
      }
    } catch (err) {
      console.error('Fetch expenses error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description.trim() || !price) return;

    setSubmitting(true);
    try {
      const res = await expensesAPI.create({
        description: description.trim(),
        units: Number(units) || 1,
        unitType,
        price: Number(price),
        date,
        notes: notes.trim(),
      });

      if (res.success) {
        setDescription('');
        setUnits('');
        setPrice('');
        setNotes('');
        fetchExpenses();
      }
    } catch (err) {
      alert(err.message || 'Could not add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expensesAPI.delete(id);
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Could not delete expense');
    }
  };

  const startEdit = (exp) => {
    setEditingId(exp._id);
    setEditForm({
      description: exp.description,
      units: exp.units,
      unitType: exp.unitType,
      price: exp.price,
      date: exp.businessDate,
      notes: exp.notes,
    });
  };

  const saveEdit = async (id) => {
    try {
      await expensesAPI.update(id, editForm);
      setEditingId(null);
      fetchExpenses();
    } catch (err) {
      alert(err.message || 'Could not update expense');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">💸</span>
            <h1 className="text-base sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
              Daily Expenses (Kharcha)
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-stone-500 font-semibold mt-0.5">
            Raw material purchases (Bun, Aloo, Kabab, Oil, Dahi)
          </p>
        </div>

        {/* Total Expense Summary Badge */}
        <div className="bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-2xl flex items-center justify-between sm:justify-end gap-3">
          <span className="text-[10px] sm:text-[11px] uppercase font-black text-rose-600">
            Total {filter === 'today' ? "Today's" : 'Filtered'}:
          </span>
          <span className="text-base sm:text-xl font-black text-rose-700 font-mono">
            {formatPKR(totalExpense)}
          </span>
        </div>
      </div>

      {/* Add Expense Form Card */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-sm space-y-3">
        <h3 className="font-black text-stone-900 text-xs sm:text-base flex items-center gap-1.5">
          <Plus size={16} className="text-rose-600" />
          <span>Enter New Expense (Naya Kharcha)</span>
        </h3>

        <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs">
          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block font-bold text-stone-600 mb-1">
              Item / Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bun, Aloo, Kabab, Dahi, Oil"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
            />
          </div>

          {/* Units / Quantity */}
          <div>
            <label className="block font-bold text-stone-600 mb-1">
              Quantity / Units
            </label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 1900"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
            />
          </div>

          {/* Unit Type */}
          <div>
            <label className="block font-bold text-stone-600 mb-1">
              Unit Type
            </label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
            >
              <option value="pcs">pcs (Adad)</option>
              <option value="kg">kg (Kilo)</option>
              <option value="dozen">dozen (Darjan)</option>
              <option value="packet">packet (Dabba/Pkt)</option>
              <option value="liter">liter</option>
              <option value="carton">carton</option>
              <option value="other">other</option>
            </select>
          </div>

          {/* Total Price */}
          <div>
            <label className="block font-bold text-stone-600 mb-1">
              Total Price (Rs) *
            </label>
            <input
              type="number"
              required
              min="0"
              placeholder="e.g. 4000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-black text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block font-bold text-stone-600 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2 lg:col-span-5">
            <input
              type="text"
              placeholder="Optional notes or supplier details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
            />
          </div>

          {/* Submit Button */}
          <div className="lg:col-span-1">
            <button
              type="submit"
              disabled={submitting}
              className="w-full touch-target py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/20 active:scale-95 transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Expense</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5">
        {[
          { id: 'today', label: 'Today (Aaj)' },
          { id: 'week', label: 'This Week' },
          { id: 'month', label: 'This Month' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all touch-manipulation active:scale-95 ${
              filter === f.id
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Expenses List: Mobile Cards + Desktop Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-black text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
            <span>📋</span>
            <span>Recorded Expenses ({expenses.length})</span>
          </h3>
          <span className="text-xs font-mono font-bold text-rose-600">
            Total: {formatPKR(totalExpense)}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-400 font-bold text-xs">
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs font-semibold">
            No expenses found for this time period.
          </div>
        ) : (
          <div>
            {/* Mobile Card List (sm:hidden) */}
            <div className="divide-y divide-stone-100 sm:hidden">
              {expenses.map((exp) => (
                <div key={exp._id} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-stone-900 text-sm">
                        {exp.description}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {exp.units} {exp.unitType} • {exp.businessDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-rose-700 font-mono">
                        {formatPKR(exp.price)}
                      </div>
                    </div>
                  </div>

                  {exp.notes && (
                    <div className="text-[11px] text-stone-500 bg-stone-50 px-2 py-1 rounded-lg">
                      {exp.notes}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => startEdit(exp)}
                      className="touch-target px-2.5 py-1 text-stone-600 bg-stone-100 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(exp._id)}
                      className="touch-target px-2.5 py-1 text-rose-600 bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-400 uppercase tracking-wider font-extrabold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold">
                  {expenses.map((exp) => (
                    <tr key={exp._id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-stone-500">
                        {exp.businessDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-800">
                        {exp.description}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {exp.units} {exp.unitType}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-700 font-mono text-sm">
                        {formatPKR(exp.price)}
                      </td>
                      <td className="py-3 px-4 text-stone-500 truncate max-w-xs">
                        {exp.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startEdit(exp)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100"
                            title="Edit expense"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete expense"
                          >
                            <Trash2 size={14} />
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

    </div>
  );
}
