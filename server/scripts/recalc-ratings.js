/**
 * Recompute averageRating / reviewCount on every product from Review docs.
 * Run once if reviews existed before the ObjectId $match fix: `npm run recalc-ratings --prefix server`
 */
import "../config/loadEnv.js";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Product } from "../models/Product.js";
import { recalcProductRating } from "../utils/productRating.js";

async function main() {
  await connectDB();
  const products = await Product.find().select("_id").lean();
  for (const p of products) {
    await recalcProductRating(p._id);
  }
  console.log(`Recalculated ratings for ${products.length} products.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
