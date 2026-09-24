import React from 'react';
import { User, Bike, Check } from 'lucide-react';
import { CUSTOMER_TYPES } from '../constants';

export default function CustomerTypeToggle({ selectedType, onSelectType }) {
  const isWalkIn = selectedType === CUSTOMER_TYPES.WALKIN;
  const isFoodPanda = selectedType === CUSTOMER_TYPES.FOODPANDA;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold tracking-wider uppercase text-stone-500">
          Customer Type (Select Before Saving)
        </label>
        <span className="text-xs font-medium text-stone-400">
          {isWalkIn ? '🟢 Walk-in Selected' : '🔴 Food Panda Selected'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Walk-in Customer Button */}
        <button
          type="button"
          onClick={() => onSelectType(CUSTOMER_TYPES.WALKIN)}
          className={`relative flex flex-col sm:flex-row items-center justify-center gap-2.5 p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-sm ${
            isWalkIn
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200 shadow-md scale-[1.01]'
              : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50'
          }`}
          aria-pressed={isWalkIn}
        >
          {isWalkIn && (
            <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-white text-emerald-600 rounded-full shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          )}
          <div
            className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${
              isWalkIn ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <User className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="text-center sm:text-left">
            <span className="block text-sm sm:text-base font-extrabold tracking-tight">
              WALK-IN CUSTOMER
            </span>
            <span
              className={`block text-[11px] sm:text-xs font-medium transition-colors ${
                isWalkIn ? 'text-emerald-100' : 'text-stone-500'
              }`}
            >
              Counter / Takeaway
            </span>
          </div>
        </button>

        {/* Food Panda Order Button */}
        <button
          type="button"
          onClick={() => onSelectType(CUSTOMER_TYPES.FOODPANDA)}
          className={`relative flex flex-col sm:flex-row items-center justify-center gap-2.5 p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-sm ${
            isFoodPanda
              ? 'bg-[#d70f64] text-white border-[#d70f64] shadow-pink-200 shadow-md scale-[1.01]'
              : 'bg-white text-stone-700 border-stone-200 hover:border-pink-300 hover:bg-pink-50/50'
          }`}
          aria-pressed={isFoodPanda}
        >
          {isFoodPanda && (
            <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-white text-[#d70f64] rounded-full shadow-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          )}
          <div
            className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${
              isFoodPanda ? 'bg-white/20 text-white' : 'bg-pink-100 text-[#d70f64]'
            }`}
          >
            <Bike className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="text-center sm:text-left">
            <span className="block text-sm sm:text-base font-extrabold tracking-tight">
              FOOD PANDA ORDER
            </span>
            <span
              className={`block text-[11px] sm:text-xs font-medium transition-colors ${
                isFoodPanda ? 'text-pink-100' : 'text-stone-500'
              }`}
            >
              Rider Delivery Pickup
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
