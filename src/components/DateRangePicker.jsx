import React, { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';

export default function DateRangePicker({ onApply, defaultRange }) {
  const [activePreset, setActivePreset] = useState('today');
  const [fromDate, setFromDate] = useState(defaultRange?.from || '');
  const [toDate, setToDate] = useState(defaultRange?.to || '');

  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handlePreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      const todayStr = formatYMD(now);
      setFromDate(todayStr);
      setToDate(todayStr);
      onApply(todayStr, todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatYMD(yest);
      setFromDate(yestStr);
      setToDate(yestStr);
      onApply(yestStr, yestStr);
    } else if (preset === 'last7') {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 6);
      const fromStr = formatYMD(past7);
      const toStr = formatYMD(now);
      setFromDate(fromStr);
      setToDate(toStr);
      onApply(fromStr, toStr);
    } else if (preset === 'thisMonth') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const fromStr = formatYMD(startOfMonth);
      const toStr = formatYMD(now);
      setFromDate(fromStr);
      setToDate(toStr);
      onApply(fromStr, toStr);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (fromDate && toDate) {
      onApply(fromDate, toDate);
    }
  };

  const presets = [
    { id: 'today', label: 'Today (Aaj)' },
    { id: 'yesterday', label: 'Yesterday (Kal)' },
    { id: 'last7', label: 'Last 7 Days' },
    { id: 'thisMonth', label: 'This Month' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm space-y-3">
      {/* Horizontally scrollable presets on mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePreset(p.id)}
            className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-black shrink-0 transition-all touch-manipulation active:scale-95 ${
              activePreset === p.id
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-900/20'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Date Pickers */}
      {activePreset === 'custom' && (
        <form
          onSubmit={handleCustomSubmit}
          className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-stone-100 text-xs animate-fade-in"
        >
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-2 rounded-xl border border-stone-300">
              <span className="text-stone-500 font-bold text-[11px]">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent focus:outline-none font-mono font-bold text-stone-800 text-xs w-full"
                required
              />
            </div>

            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-2 rounded-xl border border-stone-300">
              <span className="text-stone-500 font-bold text-[11px]">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent focus:outline-none font-mono font-bold text-stone-800 text-xs w-full"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2.5 bg-stone-900 text-white rounded-xl font-black hover:bg-stone-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 sm:ml-auto touch-target"
          >
            <Filter size={14} />
            <span>Apply Filter</span>
          </button>
        </form>
      )}
    </div>
  );
}
