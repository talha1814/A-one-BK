import React from 'react';
import { AlertOctagon, Phone, MessageSquare, LogOut, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { getAdminConfig, clientLogout } from '../../utils/licence';

export default function ClientExpired({ client, onRefresh }) {
  const adminConfig = getAdminConfig();
  const expiryFormatted = client?.expiresOn
    ? format(new Date(client.expiresOn), 'dd MMMM yyyy')
    : 'Recently';

  const whatsappLink = `https://wa.me/${adminConfig.whatsappNumber || '923001234567'}?text=Hello%20A-one%20POS%20Support%2C%20my%20licence%20has%20expired%20(Client%20ID%3A%20${client?.id || ''}%2C%20Username%3A%20${client?.username || ''}).%20Please%20renew.`;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl space-y-6">
        {/* Warning Icon Badge */}
        <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 flex items-center justify-center mx-auto text-4xl animate-pulse">
          <AlertOctagon className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            SYSTEM LOCKED
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-3">
            ⚠️ LICENCE EXPIRED
          </h1>
          <p className="text-sm font-extrabold text-stone-300 mt-1">
            {client?.shopName || 'A-one Bun Kabab POS'}
          </p>
        </div>

        <div className="bg-stone-800/80 rounded-2xl p-4 border border-stone-700 space-y-2 text-xs">
          <div className="flex justify-between text-stone-400">
            <span>Client ID:</span>
            <span className="font-mono text-white font-bold">{client?.id || '-'}</span>
          </div>
          <div className="flex justify-between text-stone-400">
            <span>Username:</span>
            <span className="font-mono text-white font-bold">{client?.username || '-'}</span>
          </div>
          <div className="flex justify-between text-stone-400 pt-1 border-t border-stone-700/60">
            <span>Expired On:</span>
            <span className="text-amber-400 font-extrabold">{expiryFormatted}</span>
          </div>
        </div>

        <p className="text-xs text-stone-400 leading-relaxed">
          Your POS terminal licence validity has concluded. Please contact administration or franchise support to renew your subscription and unlock billing.
        </p>

        {/* Contact Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <a
            href={`tel:${adminConfig.contactPhone}`}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs border border-stone-600 transition"
          >
            <Phone className="w-4 h-4 text-amber-400" />
            <span>📞 Call Support</span>
          </a>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 WhatsApp</span>
          </a>
        </div>

        {/* Refresh & Logout Options */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-800 text-xs text-stone-400">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Again</span>
          </button>

          <button
            onClick={() => {
              clientLogout();
              window.location.reload();
            }}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
