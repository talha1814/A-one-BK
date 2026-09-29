import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  FileText, 
  ReceiptText, 
  BookOpen, 
  LogOut, 
  ShieldCheck, 
  Clock, 
  Store,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(now);
      const dateStr = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        day: 'numeric',
        month: 'short',
      }).format(now);
      setCurrentTime(`${dateStr} • ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { to: '/', label: 'POS Terminal', icon: ShoppingCart },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/expenses', label: 'Kharcha', icon: ReceiptText },
    { to: '/credits', label: 'Udhaar', icon: BookOpen },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-white shadow-md border-b border-stone-800 select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand Logo & Shop Name */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-lg sm:text-xl shadow-md shadow-rose-900/40 group-hover:scale-105 transition-transform">
                🍔
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black tracking-tight leading-tight text-white truncate max-w-[150px] sm:max-w-xs">
                  {user?.shopName || 'A-One Bun Kabab'}
                </h1>
                <span className="text-[10px] text-amber-400 font-bold block sm:inline">
                  POS + ERP
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <Icon size={15} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Status & User Panel */}
          <div className="flex items-center gap-2">
            {/* Live Clock (Compact on mobile) */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 bg-stone-800/80 px-2.5 py-1.5 rounded-xl border border-stone-700/60 font-mono">
              <Clock size={12} className="text-amber-400" />
              <span>{currentTime}</span>
            </div>

            {/* Admin Switcher / Badge */}
            {isAdmin ? (
              <Link
                to="/admin"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black hover:bg-amber-500/30 transition-colors touch-target"
              >
                <ShieldCheck size={14} />
                <span>Admin</span>
              </Link>
            ) : null}

            {/* Logged in User info (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 bg-stone-800 px-2.5 py-1.5 rounded-xl border border-stone-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-stone-200 font-mono">
                @{user?.username}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Logout"
              className="touch-target p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors flex items-center justify-center text-xs font-bold"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline ml-1 text-xs">Logout</span>
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden touch-target p-2 rounded-xl text-stone-300 hover:text-white hover:bg-stone-800 flex items-center justify-center"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-900 border-b border-stone-800 px-4 pt-2 pb-4 space-y-1.5 animate-slide-up">
          <div className="text-[11px] text-stone-400 font-mono py-1.5 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-amber-400" />
              <span>{currentTime}</span>
            </div>
            <span className="font-bold text-stone-300 font-mono">
              @{user?.username}
            </span>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black transition-all ${
                  active ? 'bg-rose-600 text-white' : 'text-stone-300 hover:bg-stone-800'
                }`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40"
            >
              <ShieldCheck size={18} />
              <span>Super Admin Panel</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
