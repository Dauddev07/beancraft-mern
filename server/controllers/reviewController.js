import mongoose from "mongoose";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { toReviewJSON } from "../utils/serialize.js";
import { recalcProductRating } from "../utils/productRating.js";

/** GET /api/reviews/product/:productId */
export async function listByProduct(req, res) {
  const { productId } = req.params;

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const reviews = await Review.find({ product: productId })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.json(reviews.map((r) => toReviewJSON(r)));
}

/** GET /api/reviews/pending-delivered — items from fulfilled orders not yet reviewed */
export async function pendingDeliveredReviews(req, res) {
  const orders = await Order.find({
    user: req.user.id,
    status: "fulfilled",
  })
    .sort({ deliveredAt: -1, createdAt: -1 })
    .lean();

  const reviewedRows = await Review.find({ user: req.user.id }).select("product").lean();
  const reviewedProductIds = new Set(reviewedRows.map((r) => String(r.product)));

  const out = [];
  for (const o of orders) {
    const lines = (o.items || []).map((line) => {
      const productId = String(line.product);
      return {
        productId,
        name: line.name,
        image: line.image || "",
        qty: line.qty,
        price: line.price,
        reviewed: reviewedProductIds.has(productId),
      };
    });
    const pendingItems = lines.filter((l) => !l.reviewed);
    if (pendingItems.length > 0) {
      out.push({
        orderId: String(o._id),
        deliveredAt: o.deliveredAt || o.updatedAt || o.createdAt,
        items: pendingItems,
      });
    }
  }

  res.json({ orders: out });
}

/** GET /api/reviews/recent — homepage / testimonials */
export async function recentReviews(req, res) {
  const limit = Math.min(Number(req.query.limit) || 6, 20);

  const reviews = await Review.find()
    .populate("user", "name")
    .populate("product", "name")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json(reviews.map((r) => toReviewJSON(r)));
}

/** GET /api/reviews/admin — all reviews (admin) */
export async function listReviewsAdmin(req, res) {
  const limit = Math.min(Number(req.query.limit) || 200, 500);

  const reviews = await Review.find()
    .populate("user", "name email")
    .populate("product", "name")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json(reviews.map((r) => toReviewJSON(r)));
}

/** DELETE /api/reviews/:id — admin */
export async function deleteReviewAdmin(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid review id." });
  }

  const review = await Review.findById(id);
  if (!review) {
    return res.status(404).json({ message: "Review not found." });
  }

  const productId = review.product;
  await Review.findByIdAndDelete(id);
  await recalcProductRating(productId);

  res.json({ message: "Review deleted." });
}

/** POST /api/reviews — authenticated user */
export async function createReview(req, res) {
  const { productId, rating, comment } = req.body;

  if (!productId || rating === undefined) {
    return res.status(400).json({ message: "productId and rating are required." });
  }

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: "Invalid product id." });
  }

  const r = Number(rating);
  if (r < 1 || r > 5 || Number.isNaN(r)) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found." });
  }

  const duplicate = await Review.findOne({ user: req.user.id, product: productId });
  if (duplicate) {
    return res.status(409).json({ message: "You already reviewed this product." });
  }

  const review = await Review.create({
    user: req.user.id,
    product: productId,
    rating: r,
    comment:
      typeof comment === "string" ? comment.trim().slice(0, 500) : "",
  });

  await recalcProductRating(productId);

  const populated = await Review.findById(review._id).populate("user", "name");

  res.status(201).json(toReviewJSON(populated));
}
