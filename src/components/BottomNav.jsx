import React from 'react';
import { ShoppingBag, BarChart3, History } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: 'pos',
      label: 'POS Counter',
      icon: ShoppingBag,
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200/80 shadow-lg no-print">
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all cursor-pointer relative ${
                isActive
                  ? 'text-rose-600 font-black scale-105'
                  : 'text-stone-600 hover:text-stone-800 font-bold'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-rose-50 text-rose-600' : 'text-stone-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
