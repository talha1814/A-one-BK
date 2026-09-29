import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, CreditCard, Banknote, User, Phone, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Cart({
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onFinalizeSale,
  isSubmitting,
  onCloseMobile,
}) {
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'credit'
  const [customerType, setCustomerType] = useState('walkin'); // 'walkin' | 'foodpanda'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [validationError, setValidationError] = useState('');

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleFinalize = () => {
    setValidationError('');

    if (cart.length === 0) {
      setValidationError('Cart is empty. Please select products first.');
      return;
    }

    if (paymentMode === 'credit' && !customerName.trim()) {
      setValidationError('Customer Name is required for On Account (Udhaar) sales.');
      return;
    }

    onFinalizeSale({
      items: cart,
      total: totalAmount,
      customerType,
      paymentMode,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      notes: notes.trim(),
    });

    // Reset inputs
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden flex flex-col h-full max-h-[85vh] sm:max-h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="bg-stone-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-rose-500" size={20} />
          <h2 className="font-black text-sm sm:text-base tracking-tight">Order Cart</h2>
          <span className="bg-stone-800 text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-stone-700">
            {totalItemCount} items
          </span>
        </div>

        <div className="flex items-center gap-1">
          {cart.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-stone-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-stone-800"
              title="Clear all items in cart"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {/* Close button for mobile drawer mode */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      {showClearConfirm && (
        <div className="bg-rose-50 border-b border-rose-200 p-3 flex items-center justify-between text-xs text-rose-900 shrink-0">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
            <span>Clear current cart?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClearCart();
                setShowClearConfirm(false);
              }}
              className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700"
            >
              Yes, Clear
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-2.5 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-lg font-bold hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        {cart.length === 0 ? (
          <div className="h-40 sm:h-48 flex flex-col items-center justify-center text-center p-4 text-stone-400">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-300 mb-2">
              <ShoppingBag size={24} />
            </div>
            <p className="font-bold text-stone-700 text-sm">Cart is Empty</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Tap Bun Kababs to add to order.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200/80 hover:border-stone-300 transition-colors"
            >
              {/* Item Info */}
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                  {item.name}
                </h4>
                <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                  Rs {item.price} × {item.qty} ={' '}
                  <span className="font-bold text-rose-600">
                    Rs {item.price * item.qty}
                  </span>
                </div>
              </div>

              {/* Quantity Controls & Delete */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-white rounded-xl border border-stone-200 p-0.5 shadow-sm">
                  <button
                    onClick={() => onUpdateQty(item.id, item.qty - 1)}
                    className="touch-target w-8 h-8 rounded-lg text-stone-700 hover:bg-stone-100 flex items-center justify-center active:scale-90"
                    title="Minus 1"
                  >
                    <Minus size={15} strokeWidth={2.5} />
                  </button>
                  <span className="w-7 text-center text-xs font-black text-stone-900 font-mono">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, item.qty + 1)}
                    className="touch-target w-8 h-8 rounded-lg text-stone-700 hover:bg-stone-100 flex items-center justify-center active:scale-90"
                    title="Plus 1"
                  >
                    <Plus size={15} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Direct Delete button (Client can delete immediately without admin) */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="touch-target w-8 h-8 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                  title="Remove item from cart"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Settings & Finalize Form */}
      <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 space-y-3 shrink-0">
        {/* Customer Type Toggle */}
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCustomerType('walkin')}
            className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
              customerType === 'walkin'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <span>🚶 Walk-in Counter</span>
          </button>
          <button
            type="button"
            onClick={() => setCustomerType('foodpanda')}
            className={`py-2 px-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
              customerType === 'foodpanda'
                ? 'bg-[#d70f64] text-white border-[#d70f64] shadow-sm'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <span>🐼 Foodpanda</span>
          </button>
        </div>

        {/* Payment Mode (Cash vs On Account / Udhaar) */}
        <div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaymentMode('cash')}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all touch-manipulation ${
                paymentMode === 'cash'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <Banknote size={16} className="text-emerald-400" />
              <span>Cash (Naqad)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('credit')}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all touch-manipulation ${
                paymentMode === 'credit'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <CreditCard size={16} className="text-white" />
              <span>On Account (Udhaar)</span>
            </button>
          </div>
        </div>

        {/* If On Account: Customer Details Form */}
        {paymentMode === 'credit' && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 text-xs animate-fade-in">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <User size={14} className="text-amber-700" />
              <span>Customer Details (Grahak ki Tafseel)</span>
            </div>
            <div>
              <input
                type="text"
                placeholder="Customer Name (e.g. Ali Shop, Ahmed Bhai) *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-stone-800 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-1/2 px-3 py-2 bg-white rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-stone-800 text-xs"
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-1/2 px-3 py-2 bg-white rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800 text-xs"
              />
            </div>
          </div>
        )}

        {/* Validation Error Banner */}
        {validationError && (
          <div className="text-xs bg-rose-50 text-rose-700 p-2.5 rounded-xl border border-rose-200 font-semibold flex items-center gap-1.5">
            <AlertCircle size={15} className="shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Big Total Display */}
        <div className="bg-stone-900 text-white rounded-2xl p-3 sm:p-3.5 flex items-center justify-between shadow-inner">
          <span className="text-[11px] sm:text-xs uppercase tracking-wider font-black text-stone-400">
            TOTAL AMOUNT:
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight font-mono">
            Rs {totalAmount.toLocaleString()}
          </span>
        </div>

        {/* Finalize Sale Button */}
        <button
          onClick={handleFinalize}
          disabled={cart.length === 0 || isSubmitting}
          className={`w-full touch-target py-3.5 rounded-2xl text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
            cart.length === 0 || isSubmitting
              ? 'bg-stone-400 cursor-not-allowed opacity-60'
              : paymentMode === 'credit'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-600/30'
              : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-600/30'
          }`}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle size={20} strokeWidth={2.5} />
              <span>
                {paymentMode === 'credit' ? 'FINALIZE ON ACCOUNT' : 'FINALIZE SALE (CASH)'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
