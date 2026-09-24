import React, { useMemo } from 'react';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  Ban,
  DollarSign,
  Plus,
  KeyRound,
  Download,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { isLicenceExpired, getDaysRemaining, formatDateStandard } from '../../utils/dateHelpers';
import { exportAllDataBackup } from '../../utils/licence';

export default function AdminDashboard({
  clients,
  actionLogs,
  onNavigateTab,
  onOpenAddClient,
  onOpenPasswordGenerator,
}) {
  const metrics = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let forceBlocked = 0;

    clients.forEach((c) => {
      if (c.forceBlocked) {
        forceBlocked++;
      } else if (isLicenceExpired(c.expiresOn)) {
        expired++;
      } else {
        active++;
        const daysLeft = getDaysRemaining(c.expiresOn);
        if (daysLeft <= 7) {
          expiringSoon++;
        }
      }
    });

    const totalRevenue = actionLogs.reduce((acc, log) => acc + (log.amount || 0), 0);

    return {
      total: clients.length,
      active,
      expiringSoon,
      expired,
      forceBlocked,
      totalRevenue,
    };
  }, [clients, actionLogs]);

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time client licences, revenue metrics, and remote terminal statuses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddClient}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>

          <button
            onClick={onOpenPasswordGenerator}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Generate Password</span>
          </button>

          <button
            onClick={exportAllDataBackup}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Backup Data</span>
          </button>
        </div>
      </div>

      {/* 6 Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Clients */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Clients</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white block mt-2">
            {metrics.total}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Provisioned shops</span>
        </div>

        {/* Active Clients */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 block mt-2">
            {metrics.active}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Valid licences</span>
        </div>

        {/* Expiring Soon */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expiring Soon</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 block mt-2">
            {metrics.expiringSoon}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">≤ 7 days left</span>
        </div>

        {/* Expired */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expired</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-rose-400 block mt-2">
            {metrics.expired}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Locked terminals</span>
        </div>

        {/* Force Blocked */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Force Blocked</span>
            <Ban className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-rose-500 block mt-2">
            {metrics.forceBlocked}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Admin suspended</span>
        </div>

        {/* Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Licence Fees</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white block mt-2">
            Rs {metrics.totalRevenue.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Total Collected</span>
        </div>
      </div>

      {/* Recent Client List Quick View */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-black text-white">Active Shop Terminals</h2>
            <p className="text-xs text-slate-400">Quick status of clients registered in system</p>
          </div>
          <button
            onClick={() => onNavigateTab('clients')}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
          >
            View All ({clients.length}) →
          </button>
        </div>

        <div className="divide-y divide-slate-800/80">
          {clients.slice(0, 5).map((client) => {
            const isExpired = isLicenceExpired(client.expiresOn);
            const daysLeft = getDaysRemaining(client.expiresOn);

            return (
              <div key={client.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                    {client.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{client.shopName}</span>
                      <span className="text-xs font-mono text-slate-400">(@{client.username})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Phone: {client.phone} • Expires: {formatDateStandard(client.expiresOn)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {client.forceBlocked ? (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800">
                      🔴 Force Blocked
                    </span>
                  ) : isExpired ? (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800">
                      ⚠️ Expired
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                      🟢 Active ({daysLeft}d left)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
