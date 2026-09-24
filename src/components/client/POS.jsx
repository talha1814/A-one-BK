import React, { useState } from 'react';
import { Plus, Minus, Save, Printer, Sparkles, CheckCircle2, RotateCcw, Banknote } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PRODUCT, CUSTOMER_TYPES } from '../../constants';
import CustomerTypeToggle from './CustomerTypeToggle';

export default function POS({ onSaveOrder, currentOrderNumber }) {
  const [customerType, setCustomerType] = useState(CUSTOMER_TYPES.WALKIN);
  const [qty, setQty] = useState(1);
  const [cashTendered, setCashTendered] = useState('');
  const [showCashHelper, setShowCashHelper] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const total = qty * PRODUCT.price;

  const handleIncrement = () => setQty((prev) => prev + 1);
  const handleDecrement = () => setQty((prev) => (prev > 1 ? prev - 1 : 1));
  const handleAddQty = (amount) => setQty((prev) => prev + amount);

  const calculateChange = () => {
    const tendered = parseFloat(cashTendered);
    if (isNaN(tendered) || tendered < total) return 0;
    return tendered - total;
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.8 },
        colors: customerType === CUSTOMER_TYPES.FOODPANDA ? ['#d70f64', '#f43f5e'] : ['#10b981', '#059669'],
      });
    } catch {
      // ignore
    }
  };

  const handleSave = async (shouldPrint) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const savedOrder = await onSaveOrder({
        customerType,
        qty,
        printed: shouldPrint,
      });

      triggerCelebration();

      setLastSaved({
        orderId: savedOrder.id,
        qty,
        total,
        customerType,
        printed: shouldPrint,
      });

      // Reset quantity to 1
      setQty(1);
      setCashTendered('');
      setShowCashHelper(false);

      setTimeout(() => {
        setLastSaved((prev) => (prev?.orderId === savedOrder.id ? null : prev));
      }, 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {lastSaved && (
        <div className="bg-stone-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-stone-800 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base">
                  Order {lastSaved.orderId} Saved!
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    lastSaved.customerType === CUSTOMER_TYPES.FOODPANDA
                      ? 'bg-pink-500/20 text-pink-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {lastSaved.customerType === CUSTOMER_TYPES.FOODPANDA ? 'Food Panda' : 'Walk-in'}
                </span>
              </div>
              <p className="text-xs text-stone-300">
                {lastSaved.qty}x Bun Kabab = Rs {lastSaved.total} •{' '}
                {lastSaved.printed ? '🖨️ Receipt Printed' : '📁 Saved to History'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastSaved(null)}
            className="text-stone-400 hover:text-white text-xs font-semibold p-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Customer Type Toggle (Top) */}
      <section className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-xs">
        <CustomerTypeToggle
          selectedType={customerType}
          onSelectType={setCustomerType}
        />
      </section>

      {/* 2. Big Product Card: Bun Kabab - Rs 80 */}
      <section className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-amber-400 to-rose-500 flex items-center justify-center text-3xl sm:text-4xl shadow-md shadow-rose-200/50 shrink-0">
                🍔
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                    House Special
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    Token #{String(currentOrderNumber).padStart(3, '0')}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
                  {PRODUCT.name}
                </h2>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-bold text-stone-500">Price:</span>
                  <span className="text-xl sm:text-2xl font-black text-rose-600">
                    Rs {PRODUCT.price}
                  </span>
                  <span className="text-xs font-medium text-stone-600">/ piece</span>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 sm:text-right">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Current Item Total
              </span>
              <span className="block text-2xl sm:text-3xl font-black text-stone-900">
                Rs {total}
              </span>
            </div>
          </div>

          {/* Stepper with Large + / - Buttons */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold tracking-wider uppercase text-stone-600">
                Select Quantity
              </label>
              {qty > 1 && (
                <button
                  type="button"
                  onClick={() => setQty(1)}
                  className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to 1
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 bg-stone-50 p-2 sm:p-2.5 rounded-2xl border border-stone-200">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={qty <= 1}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white text-stone-800 border border-stone-200 shadow-xs flex items-center justify-center hover:bg-stone-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              >
                <Minus className="w-6 h-6 stroke-[3]" />
              </button>

              <div className="flex-1 text-center">
                <span className="block text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
                  {qty}
                </span>
                <span className="block text-[11px] sm:text-xs font-bold text-stone-600 mt-0.5">
                  Bun Kabab{qty > 1 ? 's' : ''}
                </span>
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-200 flex items-center justify-center hover:bg-rose-700 active:scale-95 transition cursor-pointer"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="mt-3 grid grid-cols-5 gap-2">
              {[
                { label: '+1', add: 1 },
                { label: '+2', add: 2 },
                { label: '+3', add: 3 },
                { label: '+5', add: 5 },
                { label: '+10', add: 10 },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddQty(item.add)}
                  className="py-2 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-stone-200 text-xs font-black text-stone-700 transition active:scale-95 cursor-pointer text-center"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Live Total Display Banner */}
        <div className="bg-stone-900 text-white px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-rose-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider">
                Live Total
              </span>
              <p className="text-base sm:text-lg font-bold text-white">
                <span className="text-rose-400 font-extrabold">{qty}</span> x Bun Kabab = Rs {total}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider">
              Payable Amount
            </span>
            <span className="text-3xl sm:text-4xl font-black text-rose-400 tracking-tight">
              Rs {total}
            </span>
          </div>
        </div>
      </section>

      {/* Cash / Change Helper */}
      <section className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs">
        <button
          type="button"
          onClick={() => setShowCashHelper(!showCashHelper)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold text-stone-800 block">
                Cash Tender & Change Helper
              </span>
              <span className="text-[11px] text-stone-600">
                Calculate balance return
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-600">
            {showCashHelper ? 'Hide ▲' : 'Open ▼'}
          </span>
        </button>

        {showCashHelper && (
          <div className="mt-3 pt-3 border-t border-stone-100 space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[100, 200, 500, 1000].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setCashTendered(String(amount))}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    cashTendered === String(amount)
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  Rs {amount}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder="Cash Received (Rs)"
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-center">
                <span className="block text-[10px] font-black text-emerald-700 uppercase">
                  Change to Return
                </span>
                <span className="block text-xl font-black text-emerald-700">
                  Rs {calculateChange()}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. TWO Action Buttons (Gray & Green) */}
      <section className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* a) SAVE WITHOUT PRINT (Gray Button) */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="flex items-center justify-center gap-3 py-4 sm:py-5 px-6 rounded-2xl bg-stone-700 hover:bg-stone-800 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base tracking-wide border-2 border-stone-700 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-5 h-5 stroke-[2.5]" />
            <div className="text-left">
              <span className="block leading-tight">SAVE WITHOUT PRINT</span>
              <span className="block text-[11px] font-medium text-stone-300">
                Log order only
              </span>
            </div>
          </button>

          {/* b) SAVE WITH PRINT (Green Button) */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="flex items-center justify-center gap-3 py-4 sm:py-5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm sm:text-base tracking-wide shadow-lg shadow-emerald-200 transition cursor-pointer border-2 border-transparent disabled:opacity-50"
          >
            <Printer className="w-5 h-5 stroke-[2.5]" />
            <div className="text-left">
              <span className="block leading-tight">SAVE WITH PRINT</span>
              <span className="block text-[11px] font-medium text-emerald-100">
                Save & Auto-trigger thermal receipt
              </span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
