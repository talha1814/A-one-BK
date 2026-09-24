import React, { useState } from 'react';
import { Download, Search, Receipt, Calendar } from 'lucide-react';
import { formatDateTimeStandard, formatDateStandard } from '../../utils/dateHelpers';

export default function PaymentHistory({ actionLogs }) {
  const [search, setSearch] = useState('');

  const filteredLogs = actionLogs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchClient = (log.clientUsername || '').toLowerCase().includes(q);
    const matchId = (log.clientId || '').toLowerCase().includes(q);
    const matchAction = (log.action || '').toLowerCase().includes(q);
    return matchClient || matchId || matchAction;
  });

  const totalAmount = actionLogs.reduce((acc, l) => acc + (l.amount || 0), 0);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No logs to export');
      return;
    }

    const headers = ['Log ID', 'Date & Time', 'Client ID', 'Username', 'Action', 'Amount (Rs)', 'New Expiry'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${formatDateTimeStandard(l.date)}"`,
      `"${l.clientId}"`,
      `"${l.clientUsername}"`,
      `"${l.action}"`,
      l.amount || 0,
      `"${formatDateStandard(l.newExpiry)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aone_admin_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Payment & Activation Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable log of all client provisioning, duration renewals, and fee collections
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Logs CSV</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Revenue Audited
            </span>
            <span className="text-xl font-black text-white block">
              Rs {totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">New Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No action records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {formatDateTimeStandard(log.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white block">{log.clientUsername}</span>
                      <span className="text-[10px] font-mono text-indigo-400">{log.clientId}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-medium">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-400">
                      {log.amount > 0 ? `Rs ${log.amount}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      {log.newExpiry ? formatDateStandard(log.newExpiry) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
