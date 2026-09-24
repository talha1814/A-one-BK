// Thermal Printer utilities supporting window.print() and Web Bluetooth API (ESC/POS)
import { SHOP_INFO, CUSTOMER_TYPES } from '../constants';
import { format } from 'date-fns';

// Direct browser printing using window.print()
export function triggerPrintReceipt(order) {
  return new Promise((resolve) => {
    // Small timeout to allow DOM to render receipt if needed
    setTimeout(() => {
      window.print();
      resolve(true);
    }, 150);
  });
}

// Web Bluetooth ESC/POS Thermal Printing (for direct Android / Chrome Bluetooth connectivity)
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
      throw new Error('Web Bluetooth is not supported on this browser or platform.');
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent
        ],
      });

      const server = await this.device.gatt.connect();
      // Try to find the writable characteristic
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            this.characteristic = char;
            this.isConnected = true;
            return this.device.name || 'Bluetooth Printer';
          }
        }
      }
      throw new Error('No writable characteristic found on printer.');
    } catch (err) {
      this.isConnected = false;
      throw err;
    }
  }

  async printReceipt(order) {
    if (!this.characteristic) {
      throw new Error('Bluetooth printer not connected');
    }

    const item = order.items && order.items[0] ? order.items[0] : { name: 'Bun Kabab', qty: 1, price: 80 };
    const dateFormatted = format(new Date(order.timestamp), 'dd/MM/yyyy hh:mm a');
    const custTypeLabel = order.customerType === CUSTOMER_TYPES.FOODPANDA ? 'FOOD PANDA ORDER' : 'WALK-IN CUSTOMER';

    // Build ESC/POS Byte array commands
    const ESC = 0x1b;
    const GS = 0x1d;

    const commands = [];
    const push = (arr) => commands.push(...arr);
    const text = (str) => {
      for (let i = 0; i < str.length; i++) {
        commands.push(str.charCodeAt(i));
      }
    };

    // Initialize printer
    push([ESC, 0x40]); // Reset
    push([ESC, 0x61, 0x01]); // Align Center

    // Shop Header
    push([GS, 0x21, 0x11]); // Double height + double width
    text(`${SHOP_INFO.name}\n`);
    push([GS, 0x21, 0x00]); // Normal
    text(`${SHOP_INFO.tagline}\n`);
    text(`${SHOP_INFO.address}\n`);
    text(`Ph: ${SHOP_INFO.phone}\n`);
    text('--------------------------------\n');

    // Order info
    push([ESC, 0x61, 0x00]); // Align Left
    text(`Order No:  ${order.id}\n`);
    text(`Date/Time: ${dateFormatted}\n`);
    text(`Type:      ${custTypeLabel}\n`);
    text('--------------------------------\n');
    text('ITEM             QTY  RATE TOTAL\n');
    text('--------------------------------\n');
    
    // Line item (58mm width ~ 32 chars)
    const itemLine = `${item.name.padEnd(16)} ${String(item.qty).padStart(2)}  ${String(item.price).padStart(3)}  ${String(order.total).padStart(4)}\n`;
    text(itemLine);
    text('--------------------------------\n');

    // Total
    push([ESC, 0x61, 0x02]); // Align Right
    push([GS, 0x21, 0x01]); // Double height
    text(`TOTAL: Rs ${order.total}\n`);
    push([GS, 0x21, 0x00]); // Normal

    // Footer
    push([ESC, 0x61, 0x01]); // Align Center
    text('--------------------------------\n');
    text('Thank you! Visit again\n');
    text('Fresh & Crispy Always!\n\n\n\n');
    push([GS, 0x56, 0x41, 0x00]); // Cut paper

    // Send chunks to characteristic
    const uint8 = new Uint8Array(commands);
    const CHUNK_SIZE = 100;
    for (let i = 0; i < uint8.length; i += CHUNK_SIZE) {
      const chunk = uint8.slice(i, i + CHUNK_SIZE);
      if (this.characteristic.properties.writeWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      await new Promise((r) => setTimeout(r, 20));
    }

    return true;
  }
}

export const bluetoothPrinter = new BluetoothThermalPrinter();
