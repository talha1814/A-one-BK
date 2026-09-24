# 🍔 A-one Bun Kabab - Point of Sale (POS) System

A fast, mobile-friendly **Progressive Web App (PWA)** Point of Sale system built for **A-one Bun Kabab** using React, Vite, and Tailwind CSS.

## 🚀 Key Features

- **🍔 Bun Kabab Counter**: Dedicated single-product POS locked at Rs 80 per piece with live real-time auto-calculation.
- **🟢 / 🔴 Customer Type Selection**: 
  - **Walk-in Customer** (Emerald theme)
  - **Food Panda Order** (Signature Foodpanda pink/magenta theme)
- **⚡ High-Speed Stepper & Quick-Add Presets**: Large +/- quantity buttons plus rapid preset chips (+1, +2, +3, +5, +10) for peak rush hours.
- **💵 Cash Tender & Change Helper**: Quick note calculator (Rs 100, 200, 500, 1000) displaying exact change to return to the customer.
- **🖨️ Thermal Printer Support (58mm & 80mm)**:
  - Formatted `@media print` thermal receipt layout with shop branding, order number, customer type badge, items breakdown, and polite Urdu/English footer.
  - Dual action buttons: **"SAVE WITHOUT PRINT"** and **"SAVE WITH PRINT"** (auto-triggers receipt print).
  - Web Bluetooth ESC/POS printer driver support.
- **📊 Analytics Dashboard**:
  - Today's performance overview with Walk-in vs Food Panda separation.
  - Weekly 7-day Recharts bar chart with two bars per day.
  - Monthly trajectory and comparison.
  - Specific Date Calculator with calendar picker.
  - Recent 10 orders with instant reprint option.
- **📁 Order History & CSV Export**:
  - Paginated orders with filter tabs (All / Walk-in / Food Panda).
  - Search by Order ID and date.
  - 1-click **Export to CSV** for spreadsheets.
- **📱 Progressive Web App (PWA)**:
  - Offline-first with service worker (`sw.js`).
  - Standalone app manifest (`manifest.json`) and "Install App" prompt for Android/iOS/Desktop.

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Dates**: date-fns
- **Effects**: canvas-confetti
- **Storage**: Browser LocalStorage (Zero backend required, 100% offline capable)

## 💻 Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/talha1814/A-one-BK.git

# Navigate into project directory
cd A-one-BK

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 License

MIT
