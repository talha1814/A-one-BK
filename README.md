# =====================================================================
# 🍔 A-ONE BUN KABAB — Complete POS + ERP Management System
# =====================================================================

Production-ready, full-stack POS + ERP web application for **A-One Bun Kabab**.
Built with **React 18 (Vite)** on the frontend, **Node.js + Express (Vercel Serverless Functions)** on the backend, and **MongoDB Atlas** for multi-device cloud persistence.

---

## 🚀 LIVE TARGET & ARCHITECTURE

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend API**: Node.js + Express hosted as Vercel Serverless Functions (`/api/*`)
- **Database**: MongoDB Atlas (Multi-host ReplicaSet `aone_bunkabab`)
- **Multi-Tenant Architecture**: Every document (`Sale`, `Expense`, `Credit`, `Product`) contains a `clientId` field.
- **Multi-Device Real-Time Sync**: All data lives in MongoDB Atlas. Every mobile, tablet, and PC logging in with the same client ID sees the exact same updated figures immediately.

---

## 🔐 MONGODB ATLAS CONNECTION

Connection string configured in `.env`:
```env
MONGODB_URI=mongodb://themultitaskers31_db_user:ZJxFDKvlEvTLEAmX@ac-inuby7g-shard-00-00.lkajwq4.mongodb.net:27017,ac-inuby7g-shard-00-01.lkajwq4.mongodb.net:27017,ac-inuby7g-shard-00-02.lkajwq4.mongodb.net:27017/aone_bunkabab?replicaSet=atlas-pki0ex-shard-0&ssl=true&authSource=admin
```

### Serverless-Safe Cached Connection (`api/lib/mongodb.js`)
- Maintains a global cached Mongoose promise (`global.mongoose`).
- Prevents database connection exhaustion during high-concurrency Vercel serverless function invocations.
- Reuses the existing connection across warm function instances.
- Configured with:
  ```js
  { serverSelectionTimeoutMS: 15000, socketTimeoutMS: 45000, maxPoolSize: 10 }
  ```

---

## 🗓️ 4:00 AM BUSINESS DAY ROLLOVER LOGIC

- **Timezone**: `Asia/Karachi` (PKT, UTC+5)
- **Shop Reality**: A-One Bun Kabab operates late into the night past 12:00 AM.
- **Rule**:
  - Any sale made between **12:00 AM midnight and 03:59:59 AM** belongs to **YESTERDAY's** business date.
  - At **04:00 AM PKT**, the new business day officially begins.
- **Implementation**:
  - `api/utils/getBusinessDate.js`: Calculates the business date using `Asia/Karachi` timezone with a 4 AM threshold.
  - Vercel Cron Job configured in `vercel.json` (`schedule: "0 23 * * *"` = 23:00 UTC = 04:00 AM PKT) to automatically archive daily totals into `DailySale`.
  - Manual **"Close Day Now"** button provided on the Super Admin Panel as an instant backup.

---

## 👥 TWO PANELS & DEFAULT CREDENTIALS

### 1. Client Shop Panel (`/`)
- Main POS counter selling screen, ERP Dashboard, Reports, Daily Expenses, and Udhaar Ledger.
- **Default Username**: `aone`
- **Default Password**: `123`
- Sees strictly their own shop's data.

### 2. Super Admin Panel (`/admin`)
- Master oversight portal for the developer/owner.
- **Default Username**: `superadmin`
- **Default Password**: `admin123`
- Manage clients: create new client logins, reset passwords, enable/disable access, and delete accounts.
- View cross-shop metrics (global revenue, today's sales, all-time totals).
- View per-client individual reports.
- Global product catalog management.
- Manual "Close Day Now" rollover trigger.

---

## 🍔 DEFAULT PRODUCTS (Auto-Seeded on First Run)

1. **Bun Kabab** — Rs 80
2. **Classic Bun Kabab** — Rs 100
3. **Premium Anda Bun Kabab** — Rs 150

Products can be dynamically added, updated, and re-priced from the Admin Panel.

---

## 🛒 CORE MODULES & FEATURES

### 1. Point of Sale (POS) — Primary Screen (`/`)
- Mobile-first layout optimized for single-hand phone usage and fast counter touchscreens.
- Large touch product cards with real-time in-cart badges.
- Cart with live item totals, quantity stepper (`+` / `-`), and line item removal (`🗑️`).
- **Instant Mistake Correction**: Counter operator can delete any cart item or wrong order **without admin login**.
- Payment Mode Selector: **Cash (Naqad)** or **On Account (Udhaar)**.
- Finalizing sale instantly writes to MongoDB Atlas and plays a POS confirmation audio chime.

### 2. ERP Overview Dashboard (`/dashboard`)
- **6 Colorful Stat Cards**:
  1. `Aaj ki Sale` (Today's Sale) — Emerald Green
  2. `Kal ki Sale` (Yesterday's Sale) — Stone
  3. `Aaj ka Kharcha` (Today's Expense) — Crimson Red
  4. `Aaj ka Munafa` (Today's Net Profit) — Green if +, Red if −
  5. `Udhaar Baaki` (Outstanding Credit) — Amber
  6. `Kul Orders` (Today's Total Orders) — Sky Blue
- Top Selling Products ranking bar chart.
- Recent 10 orders with instant order delete button.
- Quick navigation buttons to new sale, expense, credit, and reports.
- Auto-refreshes every 30 seconds for multi-device sync.

### 3. Sales & Financial Reports (`/reports`)
- Comprehensive Date Range Picker:
  - Presets: `Today (Aaj)`, `Yesterday (Kal)`, `Last 7 Days`, `This Month`, `Custom Range`
- Report Output:
  - Total Sales, Total Orders, Total Expenses, Net Profit
  - Product-wise breakdown (quantities sold and revenues per item)
  - Daily breakdown table (Date, Orders, Sales, Expense, Profit)
  - Click any day to view full day details (all individual receipts, expenses, udhaar)
- One-click **Export to CSV**.
- Clean **Print-Friendly Format** (`window.print()`).

### 4. Daily Expenses Page (`/expenses`)
- Form to log raw material purchases (Bun, Aloo, Kabab, Oil, Dahi, Masalay) and utilities.
- Fields: Item Description, Quantity/Units, Unit Type (pcs, kg, dozen, packet, liter), Total Price (Rs), Date, Notes.
- Filter by Today, This Week, This Month, or Custom Range.
- In-place edit and delete capabilities.

### 5. On Account / Udhaar Khata (`/credits`)
- Complete credit ledger for regular and shop customers.
- Status badges: `UNPAID` (Red), `PARTIAL` (Amber), `PAID` (Emerald).
- Search by customer name, phone number, or items taken.
- **Receive Cash Modal**: Records partial or full payment, computes remaining balance, and automatically transitions status to `PAID` when fully settled.
- Payment history log per customer.

---

## 🌐 API ENDPOINTS

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate client or admin, returns 7-day JWT |
| `GET` | `/api/auth/me` | Fetch currently authenticated user |
| `GET` | `/api/products` | Get active product catalog |
| `POST` | `/api/products` | Create new product (Admin or Client) |
| `PUT` | `/api/products/:id` | Update product details or price |
| `DELETE` | `/api/products/:id` | Remove product |
| `POST` | `/api/sales` | Finalize sale from POS |
| `GET` | `/api/sales/today` | Fetch today's sales (4 AM boundary) |
| `GET` | `/api/sales/dashboard` | Aggregated metrics for ERP dashboard |
| `GET` | `/api/sales/date/:date` | Fetch sales & expenses for specific date |
| `GET` | `/api/sales/range` | Fetch sales for date range |
| `GET` | `/api/sales/report` | Aggregated report overview for range |
| `DELETE` | `/api/sales/:id` | Delete wrong sale entry (immediate client permission) |
| `POST` | `/api/expenses` | Add new daily expense |
| `GET` | `/api/expenses/today` | Fetch today's expenses |
| `GET` | `/api/expenses/range` | Fetch expenses for date range |
| `PUT` | `/api/expenses/:id` | Update expense entry |
| `DELETE` | `/api/expenses/:id` | Delete expense entry |
| `POST` | `/api/credits` | Create new customer credit entry |
| `GET` | `/api/credits` | List credits with status & search filters |
| `GET` | `/api/credits/unpaid` | List active debtors |
| `POST` | `/api/credits/:id/payment` | Record payment against customer credit |
| `DELETE` | `/api/credits/:id` | Delete customer credit record |
| `GET` | `/api/admin/overview` | Super Admin global overview across all shops |
| `GET` | `/api/admin/clients` | List all client tenant accounts |
| `POST` | `/api/admin/clients` | Create new client tenant account |
| `PUT` | `/api/admin/clients/:id` | Update client, reset password, enable/disable |
| `DELETE` | `/api/admin/clients/:id` | Remove client and tenant records |
| `GET` | `/api/admin/reports/:clientId`| Generate detailed report for specific client |
| `POST` | `/api/admin/close-day` | Manual "Close Day Now" trigger for 4 AM rollover |
| `GET` | `/api/cron/rollover` | Daily 4 AM automated archive (scheduled at 23:00 UTC) |

---

## 🚢 STEP-BY-STEP VERCEL DEPLOYMENT

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Production-ready A-One Bun Kabab POS + ERP system"
   git push origin main
   ```

2. **Import on Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your GitHub repository.

3. **Configure Environment Variables**:
   In Vercel Project Settings → **Environment Variables**, add:
   - `MONGODB_URI`:
     ```
     mongodb://themultitaskers31_db_user:ZJxFDKvlEvTLEAmX@ac-inuby7g-shard-00-00.lkajwq4.mongodb.net:27017,ac-inuby7g-shard-00-01.lkajwq4.mongodb.net:27017,ac-inuby7g-shard-00-02.lkajwq4.mongodb.net:27017/aone_bunkabab?replicaSet=atlas-pki0ex-shard-0&ssl=true&authSource=admin
     ```
   - `JWT_SECRET`: Any random 32+ character string.
   - `ADMIN_USERNAME`: `superadmin`
   - `ADMIN_PASSWORD`: `admin123`
   - `CRON_SECRET`: Any random secure string.

4. **Verify `vercel.json`**:
   The included `vercel.json` routes `/api/(.*)` to `/api/index.js`, rewrites all web requests to `/index.html`, and configures the automated 4:00 AM PKT rollover cron:
   ```json
   {
     "version": 2,
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api/index.js" },
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "crons": [
       { "path": "/api/cron/rollover", "schedule": "0 23 * * *" }
     ]
   }
   ```

5. **Deploy**:
   Click **Deploy**. Both the React frontend and Node.js serverless functions will be deployed together under a single domain.

---

## 💻 LOCAL DEVELOPMENT

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run local server & Vite dev**:
   ```bash
   # Terminal 1: Run Express Server (Port 5000)
   npm run server

   # Terminal 2: Run Vite Dev Server (Port 3000)
   npm run dev
   ```

3. **Build Production Bundle**:
   ```bash
   npm run build
   ```
