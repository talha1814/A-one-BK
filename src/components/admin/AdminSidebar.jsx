import React from 'react';
import { LayoutDashboard, Users, Receipt, Settings, LogOut, ExternalLink, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminSidebar({ activeTab, onTabChange, onLogout, clientCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Client Manager', icon: Users, badge: clientCount },
    { id: 'payments', label: 'Payment History', icon: Receipt },
    { id: 'settings', label: 'Settings & Cloud', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tight leading-tight">
              A-one POS Admin
            </h2>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Licence Master
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="p-3 space-y-1 flex-1 flex md:flex-col overflow-x-auto md:overflow-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Open Client POS</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">/</span>
        </Link>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Admin Logout</span>
        </button>
      </div>
    </aside>
  );
}
