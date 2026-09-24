import React from 'react';
import { SHOP_INFO, CUSTOMER_TYPES } from '../constants';
import { format } from 'date-fns';

export default function ThermalReceipt({ order, printerWidth = '58mm', isPreview = false }) {
  if (!order) return null;

  const item = order.items && order.items[0] ? order.items[0] : { name: 'Bun Kabab', qty: 1, price: 80 };
  const dateFormatted = order.timestamp
    ? format(new Date(order.timestamp), 'dd/MM/yyyy hh:mm a')
    : format(new Date(), 'dd/MM/yyyy hh:mm a');

  const isFoodPanda = order.customerType === CUSTOMER_TYPES.FOODPANDA;
  const customerTypeLabel = isFoodPanda ? 'FOOD PANDA ORDER' : 'WALK-IN CUSTOMER';

  return (
    <div
      id="thermal-receipt"
      className={`font-mono-receipt text-black bg-white select-none ${
        isPreview
          ? 'p-4 sm:p-6 w-full max-w-[340px] mx-auto shadow-2xl rounded-sm border border-stone-300 relative'
          : 'thermal-receipt-area'
      }`}
      style={{
        maxWidth: printerWidth === '80mm' ? '300px' : '230px',
        margin: isPreview ? 'auto' : '0',
      }}
    >
      {/* Thermal paper top tear effect when preview */}
      {isPreview && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(circle,_transparent_3px,_#ffffff_3px)] bg-[length:8px_4px]" />
      )}

      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-stone-700">
        <h1 className="text-xl font-black tracking-tight uppercase leading-tight">
          {SHOP_INFO.name}
        </h1>
        <p className="text-[11px] font-bold text-stone-700 mt-0.5">{SHOP_INFO.tagline}</p>
        <p className="text-[10px] text-stone-600 mt-0.5">{SHOP_INFO.address}</p>
        <p className="text-[10px] text-stone-600">Ph: {SHOP_INFO.phone}</p>
      </div>

      {/* Order Info & Customer Type Banner */}
      <div className="py-2 border-b border-dashed border-stone-700 space-y-1 text-xs">
        <div className="flex justify-between font-bold text-sm">
          <span>TOKEN / ORDER:</span>
          <span className="font-black text-base">{order.id}</span>
        </div>
        <div className="flex justify-between text-[11px] text-stone-600">
          <span>Date & Time:</span>
          <span>{dateFormatted}</span>
        </div>
        <div className="pt-1">
          <div
            className={`text-center py-1 px-2 rounded font-black text-xs tracking-wider uppercase border ${
              isFoodPanda
                ? 'border-black bg-stone-100 text-black font-extrabold'
                : 'border-black bg-stone-100 text-black font-extrabold'
            }`}
          >
            *** {customerTypeLabel} ***
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="py-2 border-b border-dashed border-stone-700 text-xs">
        <div className="flex justify-between font-bold pb-1 text-[11px] border-b border-stone-400">
          <span>ITEM</span>
          <div className="flex gap-3">
            <span className="w-8 text-center">QTY</span>
            <span className="w-10 text-right">RATE</span>
            <span className="w-12 text-right">TOTAL</span>
          </div>
        </div>
        <div className="flex justify-between py-1.5 font-bold">
          <span className="truncate pr-1">{item.name}</span>
          <div className="flex gap-3 text-stone-800">
            <span className="w-8 text-center">{item.qty}</span>
            <span className="w-10 text-right">{item.price}</span>
            <span className="w-12 text-right font-black text-black">
              {order.total}
            </span>
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="py-2 border-b-2 border-black text-sm">
        <div className="flex justify-between items-baseline font-black">
          <span className="text-base">GRAND TOTAL:</span>
          <span className="text-xl tracking-tight">Rs {order.total}</span>
        </div>
        <div className="flex justify-between text-[11px] text-stone-600 mt-0.5">
          <span>Items: {item.qty} pc</span>
          <span>Paid: Cash / Online</span>
        </div>
      </div>

      {/* Barcode representation */}
      <div className="py-2.5 text-center">
        <div className="inline-flex items-center gap-[2px] h-9 mx-auto">
          {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2].map((w, i) => (
            <div
              key={i}
              className="bg-black h-full"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
        <p className="text-[10px] tracking-widest text-stone-600 mt-1 font-mono">
          *{order.id}*
        </p>
      </div>

      {/* Footer */}
      <div className="text-center pt-1 pb-1 text-[11px] space-y-0.5 text-stone-700">
        <p className="font-bold uppercase tracking-wide">Thank you! Visit again</p>
        <p className="text-[10px]">بہترین ذائقہ، روایتی بن کباب</p>
        <p className="text-[9px] text-stone-500 pt-1">
          --------------------------------
        </p>
        <p className="text-[8px] text-stone-400">Powered by A-one POS</p>
      </div>
    </div>
  );
}
