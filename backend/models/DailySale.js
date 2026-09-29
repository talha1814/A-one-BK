import mongoose from 'mongoose';

/**
 * Item schema:
 * { name, quantity, price, total }
 */
const saleItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total must be non-negative'],
    },
  },
  { _id: false }
);

/**
 * DailySale Schema
 * Stores finalized/archived sales for completed business days.
 * 
 * Fields required:
 * - date (String, format: "YYYY-MM-DD")
 * - items (Array) - each item: { name, quantity, price, total }
 * - totalSale (Number)
 * - createdAt (Date)
 * - updatedAt (Date)
 */
const dailySaleSchema = new mongoose.Schema(
  {
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
      index: true,
    },
    items: {
      type: [saleItemSchema],
      default: [],
    },
    totalSale: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Explicitly managed as requested in requirements
    collection: 'DailySale',
  }
);

// Pre-save hook to ensure totals and dates are always accurate
dailySaleSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (Array.isArray(this.items)) {
    this.totalSale = this.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  }
  next();
});

export const DailySale = mongoose.model('DailySale', dailySaleSchema);
