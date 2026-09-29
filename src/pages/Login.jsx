import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('aone');
  const [password, setPassword] = useState('123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(username, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 mx-auto flex items-center justify-center text-3xl shadow-xl shadow-rose-900/40 mb-3 ring-4 ring-rose-500/20">
            🍔
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            A-One Bun Kabab
          </h1>
          <p className="text-xs font-semibold text-amber-400 mt-1 uppercase tracking-wider">
            POS + ERP Shop Terminal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter client username"
                className="w-full pl-10 pr-4 py-3 bg-stone-800/90 border border-stone-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all placeholder:text-stone-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 bg-stone-800/90 border border-stone-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all placeholder:text-stone-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold rounded-xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to POS</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Hint */}
        <div className="mt-5 p-3 rounded-xl bg-stone-800/60 border border-stone-800 text-[11px] text-stone-400 space-y-1">
          <div className="font-bold text-stone-300">Default Client Credentials:</div>
          <div className="flex justify-between font-mono">
            <span>Username: <strong className="text-amber-400">aone</strong></span>
            <span>Password: <strong className="text-amber-400">123</strong></span>
          </div>
        </div>

        {/* Switch to Super Admin */}
        <div className="mt-6 pt-4 border-t border-stone-800 text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 font-bold transition-colors"
          >
            <ShieldCheck size={14} className="text-amber-400" />
            <span>Switch to Super Admin Panel</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
