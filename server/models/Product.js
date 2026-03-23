import mongoose from "mongoose";

const STOCK = ["in_stock", "out_of_stock"];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    image: { type: String, required: true },
    stockStatus: { type: String, enum: STOCK, default: "in_stock" },
    /** Cached from reviews; updated when reviews change */
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    /** Total units ordered (sum of line item qty) for best-seller ranking */
    numberOfOrders: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

productSchema.index({ category: 1 });
productSchema.index({ numberOfOrders: -1 });
productSchema.index({ averageRating: -1 });

export const Product = mongoose.model("Product", productSchema);
