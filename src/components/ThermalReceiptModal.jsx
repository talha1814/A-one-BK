import React, { useState } from 'react';
import { X, Printer, Bluetooth, Check, Share2, Copy } from 'lucide-react';
import ThermalReceipt from './ThermalReceipt';
import { bluetoothPrinter, triggerPrintReceipt } from '../utils/thermalPrinter';

export default function ThermalReceiptModal({ order, isOpen, onClose }) {
  const [printerWidth, setPrinterWidth] = useState('58mm');
  const [bluetoothConnecting, setBluetoothConnecting] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const handleBrowserPrint = () => {
    triggerPrintReceipt(order);
  };

  const handleBluetoothPrint = async () => {
    setBluetoothConnecting(true);
    setBluetoothStatus('Connecting to Bluetooth printer...');
    try {
      if (!bluetoothPrinter.isConnected) {
        await bluetoothPrinter.connect();
      }
      setBluetoothStatus('Sending receipt commands...');
      await bluetoothPrinter.printReceipt(order);
      setBluetoothStatus('Print command sent successfully!');
      setTimeout(() => setBluetoothStatus(''), 3000);
    } catch (err) {
      console.error('Bluetooth print error:', err);
      setBluetoothStatus(`Bluetooth Error: ${err.message || 'Failed'}`);
    } finally {
      setBluetoothConnecting(false);
    }
  };

  const handleCopyReceiptText = () => {
    const item = order.items && order.items[0] ? order.items[0] : { qty: 1, price: 80 };
    const text = `--- A-ONE BUN KABAB ---\nOrder: ${order.id}\nType: ${order.customerType === 'foodpanda' ? 'Food Panda' : 'Walk-in'}\nItem: Bun Kabab x ${item.qty}\nTotal: Rs ${order.total}\nDate: ${new Date(order.timestamp).toLocaleString()}\nThank you! Visit again.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-stone-100 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-white border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-stone-900">
              Thermal Receipt Preview
            </h3>
            <p className="text-xs text-stone-600">
              Order {order.id} • Rs {order.total}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* 58mm / 80mm toggle */}
            <div className="flex bg-stone-100 p-0.5 rounded-lg text-[11px] font-bold text-stone-600">
              <button
                type="button"
                onClick={() => setPrinterWidth('58mm')}
                className={`px-2 py-1 rounded-md transition ${
                  printerWidth === '58mm'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPrinterWidth('80mm')}
                className={`px-2 py-1 rounded-md transition ${
                  printerWidth === '80mm'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                80mm
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-stone-200/50">
          <ThermalReceipt
            order={order}
            printerWidth={printerWidth}
            isPreview={true}
          />
        </div>

        {/* Status notice */}
        {bluetoothStatus && (
          <div className="px-4 py-2 bg-stone-900 text-stone-200 text-xs text-center font-mono">
            {bluetoothStatus}
          </div>
        )}

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-stone-200 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print (System)</span>
            </button>

            <button
              type="button"
              disabled={bluetoothConnecting}
              onClick={handleBluetoothPrint}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-extrabold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Bluetooth className="w-4 h-4 text-sky-400" />
              <span>{bluetoothConnecting ? 'Connecting...' : 'Bluetooth ESC/POS'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleCopyReceiptText}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-800 p-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Receipt Text!' : 'Copy Receipt Text'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-stone-600 hover:text-stone-800 p-1"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
