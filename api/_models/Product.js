import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      default: 'global',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'bun-kabab',
    },
    emoji: {
      type: String,
      default: '🍔',
    },
    active: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model('Product', productSchema);
