import React from 'react';
import { format } from 'date-fns';
import { getAdminConfig } from '../../utils/licence';

export default function Receipt({ order, isPreview = false }) {
  if (!order) return null;

  const adminConfig = getAdminConfig();
  const item = order.items?.[0] || { name: 'Bun Kabab', qty: 1, price: 80 };
  const dateFormatted = order.timestamp
    ? format(new Date(order.timestamp), 'dd-MM-yyyy')
    : format(new Date(), 'dd-MM-yyyy');
  const timeFormatted = order.timestamp
    ? format(new Date(order.timestamp), 'HH:mm')
    : format(new Date(), 'HH:mm');

  const customerTypeLabel = order.customerType === 'foodpanda' ? 'Food Panda' : 'Walk-in';

  return (
    <div
      id="thermal-receipt"
      className={`font-mono-receipt text-black bg-white select-none leading-tight ${
        isPreview
          ? 'p-5 w-[260px] mx-auto shadow-2xl border border-stone-300 rounded-sm'
          : 'thermal-receipt-area'
      }`}
      style={{
        maxWidth: '240px',
        fontSize: '11px',
        lineHeight: '1.25',
      }}
    >
      {/* Receipt Content */}
      <div className="text-center font-bold">
        <p>============================</p>
        <p className="text-sm font-black tracking-wider py-0.5">A-ONE BUN KABAB</p>
        <p>============================</p>
      </div>

      <div className="py-1 text-[11px] font-semibold">
        <div className="flex justify-between">
          <span>Date: {dateFormatted}</span>
          <span>Time: {timeFormatted}</span>
        </div>
        <p>Order #: {order.id}</p>
        <p>Customer: {customerTypeLabel}</p>
      </div>

      <p className="text-center">----------------------------</p>

      <div className="py-1">
        {order.items && order.items.length > 0 ? (
          order.items.map((it, idx) => (
            <div key={idx} className="flex justify-between font-bold">
              <span>{(it.name || 'Bun Kabab').slice(0, 15)} x {it.qty}</span>
              <span>Rs {it.qty * it.price}</span>
            </div>
          ))
        ) : (
          <div className="flex justify-between font-bold">
            <span>Bun Kabab   x {item.qty}</span>
            <span>Rs {order.total}</span>
          </div>
        )}
      </div>

      <p className="text-center">----------------------------</p>

      <div className="flex justify-between font-black text-xs py-1">
        <span>TOTAL:</span>
        <span className="text-sm">Rs {order.total}</span>
      </div>

      <div className="text-center font-bold pt-1">
        <p>============================</p>
        <p className="py-0.5">Thank you! Visit again</p>
        <p className="text-[10px]">Ph: {adminConfig.contactPhone}</p>
        <p>============================</p>
      </div>
    </div>
  );
}
