import mongoose from 'mongoose';

const dailySaleSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    businessDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    productBreakdown: [
      {
        name: String,
        qty: Number,
        revenue: Number,
      },
    ],
    closedManually: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

dailySaleSchema.index({ clientId: 1, businessDate: 1 }, { unique: true });

export default mongoose.models.DailySale || mongoose.model('DailySale', dailySaleSchema);
