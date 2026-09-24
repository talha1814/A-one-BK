// Thermal Printer integration & Audio Beep
import { format } from 'date-fns';

// Clean Web Audio API beep sound (works 100% offline without external mp3 files)
export function playBeepSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Pleasant high-frequency POS confirmation double-beep
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1800, now + 0.09);
    gain2.gain.setValueAtTime(0.2, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.22);
  } catch (e) {
    console.warn('Audio beep error:', e);
  }
}

// Window print trigger with zero lag
export function triggerPrint() {
  return new Promise((resolve) => {
    setTimeout(() => {
      window.print();
      resolve(true);
    }, 120);
  });
}

// Web Bluetooth ESC/POS Thermal Printer Driver
export class BluetoothThermalPrinter {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.isConnected = false;
  }

  isSupported() {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect() {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported on this device/browser.');
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        ],
      });

      const server = await this.device.gatt.connect();
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            this.isConnected = true;
            return this.device.name || 'Thermal Bluetooth Printer';
          }
        }
      }
      throw new Error('No writable printer characteristic found.');
    } catch (err) {
      this.isConnected = false;
      throw err;
    }
  }

  async printReceipt(order, shopPhone = '0300-1234567') {
    if (!this.characteristic) {
      throw new Error('Bluetooth printer not connected');
    }

    const item = order.items?.[0] || { name: 'Bun Kabab', qty: 1, price: 80 };
    const dateFormatted = format(new Date(order.timestamp), 'dd-MM-yyyy');
    const timeFormatted = format(new Date(order.timestamp), 'HH:mm');
    const custTypeLabel = order.customerType === 'foodpanda' ? 'Food Panda' : 'Walk-in';

    const ESC = 0x1b;
    const GS = 0x1d;
    const commands = [];
    const push = (arr) => commands.push(...arr);
    const text = (str) => {
      for (let i = 0; i < str.length; i++) commands.push(str.charCodeAt(i));
    };

    push([ESC, 0x40]); // Reset
    push([ESC, 0x61, 0x01]); // Center
    text('============================\n');
    push([GS, 0x21, 0x11]); // Double height+width
    text('A-ONE BUN KABAB\n');
    push([GS, 0x21, 0x00]); // Normal
    text('============================\n');

    push([ESC, 0x61, 0x00]); // Left
    text(`Date: ${dateFormatted}   Time: ${timeFormatted}\n`);
    text(`Order #: ${order.id}\n`);
    text(`Customer: ${custTypeLabel}\n`);
    text('----------------------------\n');

    const itemLine = `Bun Kabab   x ${String(item.qty).padEnd(2)}      Rs ${order.total}\n`;
    text(itemLine);
    text('----------------------------\n');

    push([GS, 0x21, 0x01]); // Double height
    text(`TOTAL:              Rs ${order.total}\n`);
    push([GS, 0x21, 0x00]);

    push([ESC, 0x61, 0x01]); // Center
    text('============================\n');
    text('   Thank you! Visit again\n');
    text(`   Ph: ${shopPhone}\n`);
    text('============================\n\n\n\n');
    push([GS, 0x56, 0x41, 0x00]); // Cut

    const uint8 = new Uint8Array(commands);
    const CHUNK_SIZE = 100;
    for (let i = 0; i < uint8.length; i += CHUNK_SIZE) {
      const chunk = uint8.slice(i, i + CHUNK_SIZE);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      await new Promise((r) => setTimeout(r, 25));
    }
    return true;
  }
}

export const bluetoothPrinter = new BluetoothThermalPrinter();
