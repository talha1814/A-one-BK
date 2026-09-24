import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { adminLogin } from '../../utils/licence';
import { Link } from 'react-router-dom';

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide admin username and password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = adminLogin(username.trim(), password);
      setLoading(false);
      if (res.success) {
        onLoginSuccess();
      } else {
        setError(res.message || 'Invalid admin credentials');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto text-2xl shadow-lg">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Admin Control Center
          </h1>
          <p className="text-xs text-slate-400">
            Licence Provisioning & Terminal Management
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'VERIFYING...' : 'LOGIN TO ADMIN'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Client POS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
