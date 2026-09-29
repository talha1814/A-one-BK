import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('admin123');
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
      if (loggedUser.role !== 'admin') {
        throw new Error('This account is not authorized for Super Admin privileges.');
      }
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Super Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="w-full max-w-md bg-stone-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 mx-auto flex items-center justify-center text-3xl shadow-xl shadow-amber-900/40 mb-3 ring-4 ring-amber-500/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Super Admin Control Center
          </h1>
          <p className="text-xs font-semibold text-amber-400 mt-1 uppercase tracking-wider">
            Multi-Tenant Management & Master Oversight
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
              Admin Username
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
                placeholder="superadmin"
                className="w-full pl-10 pr-4 py-3 bg-stone-800/90 border border-stone-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-stone-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1.5 uppercase tracking-wider">
              Admin Password
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
                placeholder="Enter admin password"
                className="w-full pl-10 pr-4 py-3 bg-stone-800/90 border border-stone-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all placeholder:text-stone-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold rounded-xl shadow-lg shadow-amber-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Super Admin</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Credentials Info */}
        <div className="mt-5 p-3 rounded-xl bg-stone-800/60 border border-stone-800 text-[11px] text-stone-400 space-y-1">
          <div className="font-bold text-amber-300">Default Superadmin Credentials:</div>
          <div className="flex justify-between font-mono">
            <span>Username: <strong className="text-white">superadmin</strong></span>
            <span>Password: <strong className="text-white">admin123</strong></span>
          </div>
        </div>

        {/* Back to Client POS */}
        <div className="mt-6 pt-4 border-t border-stone-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white font-bold transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Client Shop Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
