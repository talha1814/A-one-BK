import dotenv from 'dotenv';
dotenv.config();

import app from '../api/index.js';
import { connectDB } from '../api/_lib/mongodb.js';
import { seedInitialUsersAndProducts } from '../api/_routes/auth.js';
import { getBusinessDate } from '../api/_utils/getBusinessDate.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('================================================================');
  console.log('  🍔 A-ONE BUN KABAB - COMPLETE POS + ERP MANAGEMENT SYSTEM     ');
  console.log('  Production Ready for VERCEL + Node.js (MongoDB Atlas)         ');
  console.log('================================================================');

  try {
    await connectDB();
    await seedInitialUsersAndProducts();
  } catch (err) {
    console.error('⚠️ DB startup note:', err.message);
  }

  app.listen(PORT, () => {
    const bizDate = getBusinessDate();
    console.log(`🚀 Unified App running on: http://localhost:${PORT}`);
    console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Current Business Day: ${bizDate} (4:00 AM PKT Boundary)`);
    console.log('================================================================\n');
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting local server:', err);
});
