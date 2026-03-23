import mongoose from "mongoose";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";

/**
 * Recomputes averageRating and reviewCount on Product from all Review docs.
 * $match must use ObjectId — matching a string often returns no rows, so averages never update.
 */
export async function recalcProductRating(productId) {
  const oid = new mongoose.Types.ObjectId(String(productId));
  const stats = await Review.aggregate([
    { $match: { product: oid } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = stats[0]?.avg ?? 0;
  const count = stats[0]?.count ?? 0;

  await Product.findByIdAndUpdate(oid, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
}
