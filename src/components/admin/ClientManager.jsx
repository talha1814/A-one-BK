import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  CalendarPlus,
  Ban,
  CheckCircle,
  Trash2,
  Search,
  KeyRound,
  ShieldAlert,
  Copy,
  Check,
  History,
} from 'lucide-react';
import { formatDateStandard, getDaysRemaining, isLicenceExpired } from '../../utils/dateHelpers';
import { generateRandomPassword } from '../../utils/codeGen';

export default function ClientManager({
  clients,
  onAddClient,
  onEditClient,
  onExtendExpiry,
  onToggleForceBlock,
  onDeleteClient,
  onViewClientHistory,
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [extendModal, setExtendModal] = useState({ isOpen: false, client: null, days: 30, amount: '1500' });
  const [copiedId, setCopiedId] = useState(null);

  const filteredClients = clients.filter((c) => {
    const isExpired = isLicenceExpired(c.expiresOn);
    const daysLeft = getDaysRemaining(c.expiresOn);

    if (filterStatus === 'ACTIVE' && (c.forceBlocked || isExpired)) return false;
    if (filterStatus === 'BLOCKED' && !c.forceBlocked) return false;
    if (filterStatus === 'EXPIRED' && (c.forceBlocked || !isExpired)) return false;
    if (filterStatus === 'EXPIRING_SOON' && (c.forceBlocked || isExpired || daysLeft > 7)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = c.id.toLowerCase().includes(q);
      const matchUser = c.username.toLowerCase().includes(q);
      const matchShop = (c.shopName || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').includes(q);
      return matchId || matchUser || matchShop || matchPhone;
    }
    return true;
  });

  const handleCopyCredentials = (client) => {
    const text = `A-one POS Credentials:\nURL: ${window.location.origin}\nUsername: ${client.username}\nPassword: ${client.password}\nShop: ${client.shopName}\nExpires: ${formatDateStandard(client.expiresOn)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmExtend = (e) => {
    e.preventDefault();
    if (!extendModal.client) return;
    onExtendExpiry(extendModal.client.id, extendModal.days, extendModal.amount);
    setExtendModal({ isOpen: false, client: null, days: 30, amount: '1500' });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Client Licence Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Control terminal access, extend subscriptions, and enforce remote lockouts
          </p>
        </div>

        <button
          onClick={onAddClient}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Provision New Client</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: `All (${clients.length})` },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'EXPIRING_SOON', label: 'Expiring Soon' },
            { id: 'EXPIRED', label: 'Expired' },
            { id: 'BLOCKED', label: 'Force Blocked' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterStatus === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, username, shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/40">
                <th className="py-3.5 px-4">Client ID</th>
                <th className="py-3.5 px-4">Username & Shop</th>
                <th className="py-3.5 px-4">Password</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No client records match the criteria.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isExpired = isLicenceExpired(client.expiresOn);
                  const daysLeft = getDaysRemaining(client.expiresOn);

                  return (
                    <tr key={client.id} className="hover:bg-slate-800/40 transition">
                      {/* Client ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        {client.id}
                      </td>

                      {/* Username & Shop */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-white">{client.shopName}</div>
                        <div className="text-[11px] font-mono text-slate-400">@{client.username}</div>
                      </td>

                      {/* Password with Copy Button */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-slate-300">
                          <span>{client.password}</span>
                          <button
                            onClick={() => handleCopyCredentials(client)}
                            title="Copy Credentials to Clipboard"
                            className="text-slate-500 hover:text-white p-1 transition"
                          >
                            {copiedId === client.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {client.phone || '-'}
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">
                          {formatDateStandard(client.expiresOn)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {client.forceBlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800">
                            🔴 Force Blocked
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800">
                            ⚠️ Expired
                          </span>
                        ) : daysLeft <= 7 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800">
                            ⏳ Expiring Soon ({daysLeft}d)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                            🟢 Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Extend Expiry Button */}
                          <button
                            onClick={() =>
                              setExtendModal({
                                isOpen: true,
                                client,
                                days: 30,
                                amount: '1500',
                              })
                            }
                            title="Extend Expiry Duration"
                            className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>

                          {/* Force Block / Unblock Button */}
                          <button
                            onClick={() => onToggleForceBlock(client.id, !client.forceBlocked)}
                            title={client.forceBlocked ? 'Unblock Client' : 'Force Block Client'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              client.forceBlocked
                                ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                                : 'bg-rose-950 text-rose-400 hover:bg-rose-600 hover:text-white'
                            }`}
                          >
                            {client.forceBlocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>

                          {/* Edit Client */}
                          <button
                            onClick={() => onEditClient(client)}
                            title="Edit Credentials"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* View History */}
                          <button
                            onClick={() => onViewClientHistory(client)}
                            title="View Action Logs"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Permanently delete client ${client.username}?`)) {
                                onDeleteClient(client.id);
                              }
                            }}
                            title="Delete Client"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-900 hover:text-rose-200 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extend Expiry Modal */}
      {extendModal.isOpen && extendModal.client && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 text-white shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-black">Extend Licence Duration</h3>
              <p className="text-xs text-slate-400">
                Client: {extendModal.client.shopName} (@{extendModal.client.username})
              </p>
            </div>

            <form onSubmit={handleConfirmExtend} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Add Days:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 90, 180, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendModal({ ...extendModal, days: d })}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        extendModal.days === d
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Renewal Amount Collected (Rs):
                </label>
                <input
                  type="number"
                  value={extendModal.amount}
                  onChange={(e) => setExtendModal({ ...extendModal, amount: e.target.value })}
                  placeholder="1500"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setExtendModal({ isOpen: false, client: null, days: 30, amount: '' })}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black"
                >
                  Confirm Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
