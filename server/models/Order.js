import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    paymentMethod: { type: String, required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "fulfilled", "cancelled"],
      default: "pending",
    },
    /** Shown in customer profile when order is cancelled */
    cancelReason: { type: String, default: "" },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ["user", "admin"] },
    /** Admin dashboard hides these; customer still sees the order as cancelled */
    hiddenFromAdmin: { type: Boolean, default: false },
    /** Set when admin marks order delivered (status fulfilled) */
    deliveredAt: { type: Date },
    /** Set when admin accepts the order; customer can no longer cancel */
    acceptedAt: { type: Date },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
