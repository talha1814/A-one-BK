import mongoose from 'mongoose';

/**
 * Expense Schema
 * Tracks daily operational business expenses (Kharcha)
 * 
 * Fields:
 * - businessDate: String (format: "YYYY-MM-DD", mapped to 4:00 AM cutoff)
 * - title: String (e.g., "50 Buns", "Cooking Oil 5L", "Gas Cylinder")
 * - category: String ('raw-material', 'utilities', 'staff', 'packaging', 'other')
 * - amount: Number (cost in Rs)
 * - notes: String
 * - createdAt: Date
 */
const expenseSchema = new mongoose.Schema(
  {
    businessDate: {
      type: String,
      required: [true, 'Business date is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['raw-material', 'utilities', 'staff', 'packaging', 'other'],
      default: 'raw-material',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'Expense',
  }
);

export const Expense = mongoose.model('Expense', expenseSchema);
