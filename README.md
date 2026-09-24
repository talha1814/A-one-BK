# 🍔 A-one Bun Kabab - Point of Sale (POS) & Admin Licence System

A production-ready, single-URL Point of Sale system built for **A-one Bun Kabab** using **React 18**, **Vite**, **Tailwind CSS**, and **React Router DOM**. Everything is unified in **ONE single app with ONE URL** — no separate admin application needed.

---

## 📌 Architecture: Two Portals in One App

| Portal | Route | Description | Default Credentials |
| :--- | :--- | :--- | :--- |
| **Client POS** | `/` | Counter selling screen with Bun Kabab ordering, thermal receipt printing, and sales dashboard | Username: `aone001`<br>Password: `pass123` |
| **Admin Control** | `/admin` | Hidden management portal to create client logins, extend expiry, force-block terminals, and audit payments | Username: `admin`<br>Password: `adminpass123` |

---

## 🚀 Key Features

### 1. Client POS (`/`)
- **Single Product**: "Bun Kabab" - Rs 80 per piece with instant live calculation.
- **Customer Type Selection**:
  - 🟢 **WALK-IN CUSTOMER**: Emerald theme with person icon (Counter / Takeaway).
  - 🔴 **FOOD PANDA ORDER**: Signature Foodpanda pink/magenta theme (`#d70f64`) with delivery bike icon.
- **High-Speed Stepper**: Large +/- buttons and quick preset chips (`+1`, `+2`, `+3`, `+5`, `+10`).
- **Cash Tender & Change Helper**: Calculates exact change for Rs 100, 200, 500, and 1000 notes.
- **Dual Action Buttons**:
  - `SAVE WITHOUT PRINT`: Saves order to history only.
  - `SAVE WITH PRINT`: Saves order, plays a pleasant POS audio beep (synthesized via Web Audio API), and auto-triggers thermal receipt print dialog.
- **58mm / 80mm Monospace Thermal Receipt**:
  - Shop name `A-ONE BUN KABAB`
  - Date & Time
  - Order token # (auto-incrementing)
  - Customer type (`Walk-in` / `Food Panda`)
  - Items breakdown & Grand Total
  - Polite footer with phone & Urdu greeting
- **Dashboard & Analytics**:
  - Today's summary separated into Green Walk-in and Pink Food Panda cards.
  - Weekly 7-day Recharts bar chart (2 bars per day).
  - Monthly comparison chart.
  - Specific Date Calculator with calendar picker.
  - Recent 10 orders with instant reprint.
- **Order History & CSV Export**: Paginated orders with filter tabs, search, and CSV download.
- **Progressive Web App (PWA)**: Standalone manifest, service worker offline caching, and 1-click install button in header.

---

### 2. Client Licence & Security Gate
- **Authentication**: Clients must authenticate with credentials created in the Admin Panel.
- **Expiry Checking**: Runs on every app launch, on PWA launch from homescreen, on tab visibility change, and on a recurring **30-minute interval**.
- **7-Day Warning Banner**: Yellow banner alert when licence is within 7 days of expiry.
- **Expired Screen**: Full-screen lockout with contact numbers and direct WhatsApp button.
- **Administrative Force Block**: Full-screen emergency lockout when admin triggers `🔴 Force Block`.

---

### 3. Admin Panel (`/admin`)
- **Admin Authentication**: Hardcoded initial login (`admin` / `adminpass123`) with 30-minute idle auto-logout.
- **Dashboard Overview**: Metrics for Total Clients, Active Licences, Expiring Soon, Expired, Force-Blocked, and Total Revenue collected.
- **Client Manager**:
  - ➕ **Add New Client**: Provision username, password, shop name, phone, duration in days (30, 90, 180, 365), and fee.
  - ✏️ **Edit Client**: Update credentials and shop info.
  - 📅 **Extend Expiry**: Add days (+30, +90, +180, +365) and record renewal payment.
  - 🔴 **Force Block / Unblock**: Instantly freeze or re-enable client terminals.
  - 🗑️ **Delete Client**: Permanently removes client record.
  - 📋 **Copy Credentials**: 1-click clipboard copy of URL, username, and password to share with shop owner.
- **Password Generator Tool**: Generates cryptographically secure, readable passwords formatted like `AONE-CEHA-qg4y`.
- **Payment & Action Audit History**: Complete log of client activations, renewals, and payments with CSV export.
- **Data Management**: Full JSON backup download and restore.

---

### 4. Data Sharing & Cloud Sync Modes

- **Mode A: LocalAdmin (Same Device / Offline-First)**:
  - If admin and client use the same device or browser, data is shared instantaneously via `localStorage`. Works 100% offline.
- **Mode B: Remote Admin (Supabase Cloud Sync - Optional)**:
  - For remote control across different cities or devices:
  - Configure your free Supabase URL and Anon Key in **Admin Panel > Settings > Cloud Sync** or in `.env`:
    ```env
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-public-key
    ```
  - The client app checks Supabase on launch and every 30 minutes. Force-blocking or extending expiry syncs remotely across all devices.

---

## 💻 Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/talha1814/A-one-BK.git
cd A-one-BK

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **`http://localhost:3000`** for Client POS or **`http://localhost:3000/admin`** for the Admin Panel.

---

## 🧪 Testing Checklist

1. **Test Client POS**:
   - Open `http://localhost:3000/`.
   - Log in with `aone001` / `pass123`.
   - Place an order and click `SAVE WITHOUT PRINT` (beeps and updates order token).
   - Click `SAVE WITH PRINT` to trigger receipt printing.
2. **Test Admin Panel**:
   - Open `http://localhost:3000/admin`.
   - Log in with `admin` / `adminpass123`.
   - Click `Client Manager` and click `🔴 Force Block Client` on `CL001`.
   - Switch back to `http://localhost:3000/` and refresh: terminal shows **`⛔ TERMINAL BLOCKED`**.
   - Return to `/admin` and click `Unblock Client`: client terminal is restored.
   - Click `Generate Password` on the dashboard to test the `AONE-xxxx-xxxx` generator.

---

## 🚀 Deployment to Vercel (Single Project)

1. Push your repository to GitHub.
2. Import the repository in [Vercel Dashboard](https://vercel.com).
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. SPA routing is already pre-configured in `vercel.json` (`rewrites` to `/index.html`).
7. Deploy! Your app will be live at `https://your-project.vercel.app/` with `/admin` accessible at `https://your-project.vercel.app/admin`.

---

## 📄 License

MIT
