import React from 'react';
import { AlertTriangle, Phone, MessageSquare } from 'lucide-react';
import { getAdminConfig } from '../../utils/licence';

export default function ExpiryBanner({ daysLeft }) {
  const adminConfig = getAdminConfig();

  return (
    <div className="bg-amber-400 text-amber-950 px-4 py-2.5 shadow-sm text-xs font-bold border-b border-amber-500 flex flex-wrap items-center justify-between gap-2 no-print">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-900 shrink-0" />
        <span>
          ⚠️ Attention: Your POS licence expires in <span className="underline decoration-amber-900 font-black">{daysLeft} day{daysLeft === 1 ? '' : 's'}</span>. Please renew timely to prevent terminal lockdown.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <a
          href={`tel:${adminConfig.contactPhone}`}
          className="flex items-center gap-1 hover:underline text-amber-950 font-black"
        >
          <Phone className="w-3 h-3" />
          <span>Call: {adminConfig.contactPhone}</span>
        </a>
        <a
          href={`https://wa.me/${adminConfig.whatsappNumber || '923001234567'}?text=Hello%2C%20I%20want%20to%20renew%20my%20A-one%20POS%20licence`}
          target="_blank"
          rel="noreferrer"
          className="bg-amber-950 text-amber-100 px-2.5 py-0.5 rounded-full hover:bg-black transition text-[11px]"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
