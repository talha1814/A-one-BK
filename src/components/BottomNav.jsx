import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, LayoutDashboard, FileText, ReceiptText, BookOpen } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();

  const tabs = [
    { to: '/', label: 'POS', icon: ShoppingCart },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/expenses', label: 'Kharcha', icon: ReceiptText },
    { to: '/credits', label: 'Udhaar', icon: BookOpen },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 shadow-2xl safe-area-bottom select-none">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`relative flex flex-col items-center justify-center py-1 transition-all touch-target ${
                active ? 'text-rose-500 font-extrabold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {active && (
                <div className="absolute top-0 w-8 h-1 bg-rose-500 rounded-b-full shadow-sm shadow-rose-500" />
              )}
              <div className={`p-1 rounded-xl transition-all ${active ? 'scale-110 bg-rose-500/15' : 'active:scale-90'}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
