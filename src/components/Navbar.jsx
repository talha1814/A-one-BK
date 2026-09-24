import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Clock, Printer, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { SHOP_INFO } from '../constants';

export default function Navbar({
  deferredPrompt,
  onInstallClick,
  isInstalled,
  activeTab,
  onTabChange,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-linear-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-xl sm:text-2xl shadow-md shadow-rose-200 text-white shrink-0">
            🍔
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black text-stone-900 tracking-tight leading-none">
                {SHOP_INFO.name}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                POS
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-stone-600 mt-0.5">
              <Clock className="w-3 h-3 text-stone-500" />
              <span className="font-mono">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Tabs & Header Actions */}
        <div className="flex items-center gap-2">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200/60 mr-2">
            {[
              { id: 'pos', label: 'POS Counter' },
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'history', label: 'Order History' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Install App Button (PWA) */}
          {!isInstalled && (
            <button
              type="button"
              onClick={onInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-black shadow-md shadow-rose-200 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          {isInstalled && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              <Smartphone className="w-3.5 h-3.5" />
              <span>App Installed</span>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
