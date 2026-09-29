import mongoose from 'mongoose';

const creditPaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    default: '',
  },
});

const creditSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    items: {
      type: String, // e.g. "10 Bun Kabab" or description
      default: '',
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
      index: true,
    },
    businessDate: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    payments: [creditPaymentSchema],
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      default: null,
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
  { timestamps: true }
);

creditSchema.index({ clientId: 1, status: 1 });
creditSchema.index({ clientId: 1, customerName: 1 });

export default mongoose.models.Credit || mongoose.model('Credit', creditSchema);
