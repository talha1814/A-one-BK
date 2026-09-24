import { PRODUCT, CUSTOMER_TYPES, STORAGE_KEY } from '../constants';
import { subDays, format, subHours, subMinutes } from 'date-fns';

// Helper to generate seed demo orders for today and past days
function generateDemoData() {
  const now = new Date();
  const demoOrders = [];
  let counter = 1;

  // Past 6 days orders
  for (let daysAgo = 6; daysAgo >= 1; daysAgo--) {
    const dayDate = subDays(now, daysAgo);
    // 6 to 12 orders per day
    const numOrders = Math.floor(Math.random() * 6) + 8;
    for (let i = 0; i < numOrders; i++) {
      const orderDate = new Date(dayDate);
      orderDate.setHours(12 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 59));
      const customerType = Math.random() > 0.45 ? CUSTOMER_TYPES.WALKIN : CUSTOMER_TYPES.FOODPANDA;
      const qty = customerType === CUSTOMER_TYPES.FOODPANDA ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 3) + 1;
      const orderId = `ORD-${String(counter).padStart(3, '0')}`;
      
      demoOrders.push({
        id: orderId,
        timestamp: orderDate.toISOString(),
        customerType,
        items: [{ name: PRODUCT.name, qty, price: PRODUCT.price }],
        total: qty * PRODUCT.price,
        printed: Math.random() > 0.3,
      });
      counter++;
    }
  }

  // Today's orders so far (8 orders today)
  const todayTimes = [
    subMinutes(now, 240),
    subMinutes(now, 180),
    subMinutes(now, 130),
    subMinutes(now, 85),
    subMinutes(now, 55),
    subMinutes(now, 32),
    subMinutes(now, 14),
    subMinutes(now, 5),
  ];

  todayTimes.forEach((time, idx) => {
    const customerType = idx % 2 === 0 ? CUSTOMER_TYPES.WALKIN : CUSTOMER_TYPES.FOODPANDA;
    const qty = [2, 1, 4, 2, 3, 1, 5, 2][idx];
    const orderId = `ORD-${String(counter).padStart(3, '0')}`;
    demoOrders.push({
      id: orderId,
      timestamp: time.toISOString(),
      customerType,
      items: [{ name: PRODUCT.name, qty, price: PRODUCT.price }],
      total: qty * PRODUCT.price,
      printed: true,
    });
    counter++;
  });

  return {
    orders: demoOrders,
    orderCounter: counter,
  };
}

export function loadPosData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = generateDemoData();
      savePosData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.orders || !Array.isArray(parsed.orders)) {
      const initial = generateDemoData();
      savePosData(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load POS data from localStorage:', err);
    return generateDemoData();
  }
}

export function savePosData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save POS data to localStorage:', err);
  }
}

export function saveOrder({ customerType, qty, printed = false }) {
  const currentData = loadPosData();
  const counter = currentData.orderCounter || 1;
  const orderId = `ORD-${String(counter).padStart(3, '0')}`;
  const total = qty * PRODUCT.price;

  const newOrder = {
    id: orderId,
    timestamp: new Date().toISOString(),
    customerType: customerType || CUSTOMER_TYPES.WALKIN,
    items: [
      {
        name: PRODUCT.name,
        qty: Number(qty),
        price: PRODUCT.price,
      },
    ],
    total,
    printed: Boolean(printed),
  };

  const updatedOrders = [newOrder, ...currentData.orders];
  const updatedData = {
    orders: updatedOrders,
    orderCounter: counter + 1,
  };

  savePosData(updatedData);
  return { newOrder, updatedData };
}

export function markOrderPrinted(orderId) {
  const currentData = loadPosData();
  const updatedOrders = currentData.orders.map((ord) =>
    ord.id === orderId ? { ...ord, printed: true } : ord
  );
  const updatedData = { ...currentData, orders: updatedOrders };
  savePosData(updatedData);
  return updatedData;
}

export function exportOrdersToCSV(orders) {
  if (!orders || orders.length === 0) {
    alert('No orders to export!');
    return;
  }

  const headers = ['Order ID', 'Date & Time', 'Customer Type', 'Item', 'Quantity', 'Unit Price', 'Total (Rs)', 'Printed'];
  const rows = orders.map((o) => {
    const item = o.items && o.items[0] ? o.items[0] : { name: PRODUCT.name, qty: 1, price: PRODUCT.price };
    const dateStr = format(new Date(o.timestamp), 'yyyy-MM-dd HH:mm:ss');
    const custTypeStr = o.customerType === CUSTOMER_TYPES.FOODPANDA ? 'Food Panda' : 'Walk-in';
    return [
      o.id,
      `"${dateStr}"`,
      `"${custTypeStr}"`,
      `"${item.name}"`,
      item.qty,
      item.price,
      o.total,
      o.printed ? 'Yes' : 'No',
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `a_one_bun_kabab_orders_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function resetToDemoData() {
  const data = generateDemoData();
  savePosData(data);
  return data;
}

export function clearAllOrders() {
  const blankData = {
    orders: [],
    orderCounter: 1,
  };
  savePosData(blankData);
  return blankData;
}
