import mongoose from 'mongoose';

/**
 * Transaction Sub-Schema
 * Tracks individual credit (udhaar) or repayment (vasooli) events
 */
const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['credit', 'payment'], // 'credit' = customer borrowed; 'payment' = customer repaid
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than 0'],
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

/**
 * CreditCustomer Schema (Udhaar Ledger)
 * Tracks customers with open or past credit accounts
 */
const creditCustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    balance: {
      type: Number,
      default: 0, // Positive balance means customer OWES money
    },
    transactions: {
      type: [transactionSchema],
      default: [],
    },
    notes: {
      type: String,
      default: '',
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
    timestamps: true,
    collection: 'CreditCustomer',
  }
);

// Recalculate balance on save
creditCustomerSchema.methods.recalculateBalance = function () {
  this.balance = this.transactions.reduce((sum, tx) => {
    if (tx.type === 'credit') {
      return sum + Number(tx.amount || 0);
    } else if (tx.type === 'payment') {
      return sum - Number(tx.amount || 0);
    }
    return sum;
  }, 0);
  this.updatedAt = new Date();
};

export const CreditCustomer = mongoose.model('CreditCustomer', creditCustomerSchema);
