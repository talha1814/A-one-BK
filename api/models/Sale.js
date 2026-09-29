import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  lineTotal: {
    type: Number,
    required: true,
  },
});

const saleSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      default: '',
    },
    items: [saleItemSchema],
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    customerType: {
      type: String,
      default: 'walkin', // 'walkin' | 'foodpanda' | 'delivery'
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'credit', 'online'],
      default: 'cash',
    },
    customerName: {
      type: String,
      default: '',
    },
    creditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Credit',
      default: null,
    },
    businessDate: {
      type: String, // YYYY-MM-DD (4:00 AM PKT rollover)
      required: true,
      index: true,
    },
    printed: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for high-speed multi-tenant reporting
saleSchema.index({ clientId: 1, businessDate: 1 });
saleSchema.index({ clientId: 1, createdAt: -1 });

export default mongoose.models.Sale || mongoose.model('Sale', saleSchema);
