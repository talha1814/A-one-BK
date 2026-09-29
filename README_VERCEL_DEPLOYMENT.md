# 🍔 A-One Bun Kabab — Business Management System
### Complete Sales, Expenses (Kharcha), and Customer Credit (Udhaar) Ledger
**Production-Ready for Vercel Serverless & MongoDB Atlas**

---

## 📌 Project Overview
A single, mobile-responsive full-stack web application designed for food business owners to manage their entire operation from any device (mobile phone, tablet, or PC):
- 🛒 **Sales & POS Counter**: Live sales tracking with Bun Kabab presets, real-time cart, and 4:00 AM day-change boundary.
- 💸 **Daily Expenses (Kharcha)**: Itemized daily costs (raw materials, utilities, staff daily wages, packaging) with category analytics.
- 📖 **Customer Credit Ledger (Udhaar Book)**: Record credit given (+Udhaar) and payments received (+Vasooli) with full customer ledger statements.
- 📊 **Financial Reports & Net Profit**: Real-time Net Profit (`Sales - Expenses`) and lifetime revenue tracking.
- 🔐 **Shared Client Authentication**: Secure JWT-based single-login session that stays logged in on mobile devices.

---

## 🚀 CRITICAL FIX: MongoDB Atlas Setup (For Vercel Cloud Deployment)

### Why Localhost Fails on Vercel:
On Vercel, the application runs on cloud serverless infrastructure (AWS/GCP), **not on your local computer**. Connecting to `mongodb://localhost:27017/` will fail with `ECONNREFUSED`.

### 5-Minute Free MongoDB Atlas Setup:
1. **Create Free Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. **Create Cluster**:
   - Click **Create Deployment** → Select **M0 Free Cluster** (Shared) → Select region closest to you (e.g. Frankfurt, Mumbai, or Singapore) → Click **Create**.
3. **Create Database User**:
   - Go to **Security** → **Database Access** → Click **Add New Database User**.
   - Choose **Password** authentication.
   - Enter Username (e.g. `admin`) and a strong Password (e.g. `kababPass2026`).
   - Assign Role: `Read and write to any database`. Click **Add User**.
4. **Network Access (CRITICAL FOR VERCEL)**:
   - Go to **Security** → **Network Access** → Click **Add IP Address**.
   - Select **Allow Access From Anywhere (`0.0.0.0/0`)** (Required for Vercel dynamic serverless IPs).
   - Click **Confirm**.
5. **Get Connection String**:
   - Click **Deployment** → **Database** → Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy your connection string:
     ```
     mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/salesDB?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password and ensure `/salesDB` is specified as the database name.

---

## ☁️ Deploying to Vercel in 3 Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Complete Business Management App with MongoDB Atlas and Vercel serverless API"
git push origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New...** → **Project**.
3. Select your repository.
4. **Framework Preset**: Vite (or Other).
5. Output Directory: `dist` (pre-configured).

### Step 3: Add Environment Variables in Vercel
In the Vercel project configuration, expand **Environment Variables** and add:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://admin:pass@cluster0.../salesDB` | MongoDB Atlas cloud connection |
| `ADMIN_USERNAME` | `admin` | Portal login user ID |
| `ADMIN_PASSWORD` | `admin123` | Portal login password |
| `JWT_SECRET` | `aone_bun_kabab_super_secret_jwt_2026` | Token encryption key |

Click **Deploy**! Your app will be live with a free `.vercel.app` URL.

---

## ⏰ Day Rollover Logic (4:00 AM Boundary)

- **Business Day Rule**: Business day ends at **4:00 AM**, NOT midnight.
  - Transactions between 4:00 AM today and 3:59:59 AM tomorrow belong to today's shift.
- **Auto-Rollover on Vercel**:
  - `vercel.json` has a pre-configured Vercel Cron Job scheduled at `0 23 * * *` (23:00 UTC = 04:00 AM PKT).
  - It automatically triggers `/api/rollover` every morning at 4:00 AM.
- **Manual "Close Day Now" Button**:
  - Located directly in the top header and banner of the app so the owner can close their shift at any time.

---

## 💻 Local Development Setup

To run locally on your computer:
```bash
# 1. Install dependencies
npm install

# 2. Configure .env
cp .env.example .env
# Edit .env with your MongoDB Atlas or local MongoDB URI

# 3. Start server
npm run server
# or
npm start
```
Open **`http://localhost:5000`** in your browser.

---

## 🔐 Default Login Credentials
- **User ID**: `admin`
- **Password**: `admin123`
*(Can be changed in `.env` or Vercel Environment Variables via `ADMIN_USERNAME` and `ADMIN_PASSWORD`)*
