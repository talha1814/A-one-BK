import React from 'react';
import { Ban, Phone, MessageSquare, LogOut, RefreshCw, ShieldAlert } from 'lucide-react';
import { getAdminConfig, clientLogout } from '../../utils/licence';

export default function ClientBlocked({ client, onRefresh }) {
  const adminConfig = getAdminConfig();

  const whatsappLink = `https://wa.me/${adminConfig.whatsappNumber || '923001234567'}?text=Hello%20A-one%20POS%20Support%2C%20my%20account%20has%20been%20blocked%20(Client%20ID%3A%20${client?.id || ''}%2C%20Username%3A%20${client?.username || ''}).%20Please%20assist.`;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-stone-900 border-2 border-rose-600 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        {/* Blocked Icon Badge */}
        <div className="w-20 h-20 rounded-full bg-rose-600/20 border-2 border-rose-500 text-rose-500 flex items-center justify-center mx-auto text-4xl animate-pulse">
          <Ban className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/40">
            ADMINISTRATIVE LOCK
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-3">
            ⛔ TERMINAL BLOCKED
          </h1>
          <p className="text-sm font-extrabold text-stone-300 mt-1">
            {client?.shopName || 'A-one Bun Kabab'}
          </p>
        </div>

        <div className="bg-stone-800/80 rounded-2xl p-4 border border-stone-700 space-y-2 text-xs text-left">
          <div className="flex justify-between text-stone-400">
            <span>Client ID:</span>
            <span className="font-mono text-white font-bold">{client?.id || '-'}</span>
          </div>
          <div className="flex justify-between text-stone-400">
            <span>Username:</span>
            <span className="font-mono text-white font-bold">{client?.username || '-'}</span>
          </div>
          <div className="flex justify-between text-stone-400 pt-1 border-t border-stone-700/60">
            <span>Status:</span>
            <span className="text-rose-400 font-extrabold">FORCE BLOCKED BY ADMIN</span>
          </div>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed bg-rose-950/40 p-3 rounded-xl border border-rose-900/50">
          This POS terminal has been suspended by system administration. Order processing and receipt printing are temporarily frozen. Please contact head office immediately to resolve this matter.
        </p>

        {/* Support Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <a
            href={`tel:${adminConfig.contactPhone}`}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs border border-stone-600 transition"
          >
            <Phone className="w-4 h-4 text-rose-400" />
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

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-800 text-xs text-stone-400">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>

          <button
            onClick={() => {
              clientLogout();
              window.location.reload();
            }}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
