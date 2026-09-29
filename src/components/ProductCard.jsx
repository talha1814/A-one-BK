import React from 'react';
import { Plus, Minus, Check } from 'lucide-react';

export default function ProductCard({ product, inCartQty = 0, onAdd, onRemove }) {
  const { name, price, description, emoji = '🍔' } = product;

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(35);
    }
  };

  const handleCardClick = () => {
    triggerHaptic();
    onAdd(product);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    triggerHaptic();
    onAdd(product);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    triggerHaptic();
    onRemove(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative group flex flex-col justify-between p-4 sm:p-5 rounded-3xl cursor-pointer select-none transition-all duration-150 border-2 touch-manipulation active:scale-[0.98] ${
        inCartQty > 0
          ? 'bg-gradient-to-br from-rose-50/90 to-amber-50/70 border-rose-500 shadow-md shadow-rose-500/10'
          : 'bg-white border-stone-200/90 hover:border-rose-300 hover:shadow-lg shadow-sm'
      }`}
    >
      {/* In-Cart Badge Indicator */}
      {inCartQty > 0 && (
        <div className="absolute -top-2.5 -right-1.5 sm:-right-2.5 bg-rose-600 text-white font-black text-[11px] sm:text-xs px-2.5 py-1 rounded-full shadow-lg shadow-rose-900/30 flex items-center gap-1 animate-scale-in">
          <Check size={13} strokeWidth={3} />
          <span>{inCartQty} in cart</span>
        </div>
      )}

      {/* Header with Emoji and Title */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-3xl sm:text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
            {emoji}
          </span>
          <div className="text-right">
            <span className="text-[10px] uppercase font-extrabold text-stone-400 tracking-wider block">
              Price
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
              Rs {price}
            </span>
          </div>
        </div>

        <h3 className="font-black text-stone-900 text-base sm:text-lg leading-snug tracking-tight mb-1">
          {name}
        </h3>

        {description && (
          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
        {inCartQty > 0 ? (
          <div
            className="flex items-center gap-2 bg-stone-100 p-1 rounded-2xl w-full justify-between shadow-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDecrement}
              className="touch-target w-11 h-11 rounded-xl bg-white text-stone-800 shadow-sm flex items-center justify-center active:scale-90 active:bg-stone-200 transition-all font-bold"
              title="Decrease quantity"
            >
              <Minus size={18} strokeWidth={3} />
            </button>
            <div className="flex flex-col items-center">
              <span className="font-black text-stone-900 text-lg font-mono">
                {inCartQty}
              </span>
              <span className="text-[10px] font-bold text-stone-400 -mt-1">qty</span>
            </div>
            <button
              onClick={handleIncrement}
              className="touch-target w-11 h-11 rounded-xl bg-rose-600 text-white shadow-md shadow-rose-900/30 flex items-center justify-center active:scale-90 active:bg-rose-700 transition-all font-bold"
              title="Increase quantity"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleCardClick}
            className="w-full touch-target py-3 px-4 rounded-2xl bg-stone-900 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 group-hover:bg-rose-600 active:bg-rose-700 transition-colors shadow-sm"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Add to Cart</span>
          </button>
        )}
      </div>
    </div>
  );
}
