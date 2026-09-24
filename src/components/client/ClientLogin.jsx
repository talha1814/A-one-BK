import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, Phone, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
import { clientLogin, getAdminConfig } from '../../utils/licence';

export default function ClientLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const adminConfig = getAdminConfig();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = clientLogin(username, password);
      setLoading(false);

      if (res.success) {
        onLoginSuccess(res.client);
      } else {
        if (res.expired) {
          setError(`⚠️ Licence expired! Please contact administration at ${adminConfig.contactPhone}.`);
        } else if (res.blocked) {
          setError(`⛔ Account blocked! Please contact administration at ${adminConfig.contactPhone}.`);
        } else {
          setError(res.message || 'Invalid username or password.');
        }
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-stone-900 via-stone-800 to-rose-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden">
        {/* Top Decorative Banner */}
        <div className="bg-linear-to-r from-rose-600 to-amber-500 p-6 text-white text-center relative">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-inner mb-3">
            🍔
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            🔐 A-one Bun Kabab POS
          </h1>
          <p className="text-xs text-rose-100 font-medium mt-1">
            Terminal Access & Licence Authentication
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
              Client Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. aone001"
                autoCapitalize="none"
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 active:scale-[0.99] text-white font-black text-sm rounded-xl shadow-lg shadow-rose-200 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'AUTHENTICATING...' : 'LOGIN TO POS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Credentials Tip */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900">
            <span className="font-bold block">💡 Default Demo Client:</span>
            <span>Username: <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200 font-bold">aone001</code> | Password: <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200 font-bold">pass123</code></span>
          </div>

          {/* Admin help & support */}
          <div className="pt-4 border-t border-stone-100 text-center space-y-2">
            <p className="text-[11px] text-stone-500">
              Need access or renew licence? Contact administration:
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-stone-700">
              <a
                href={`tel:${adminConfig.contactPhone}`}
                className="flex items-center gap-1.5 text-stone-700 hover:text-rose-600 transition"
              >
                <Phone className="w-3.5 h-3.5 text-rose-500" />
                <span>{adminConfig.contactPhone}</span>
              </a>
              <a
                href={`https://wa.me/${adminConfig.whatsappNumber || '923001234567'}?text=Hello%20A-one%20POS%20Support`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
