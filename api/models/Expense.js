import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
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
    description: {
      type: String, // e.g. "Bun", "Aloo", "Kabab", "Dahi"
      required: true,
      trim: true,
    },
    units: {
      type: Number,
      required: true,
      default: 1,
    },
    unitType: {
      type: String,
      required: true,
      default: 'pcs', // pcs, kg, dozen, packet, etc.
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ clientId: 1, businessDate: 1 });

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
