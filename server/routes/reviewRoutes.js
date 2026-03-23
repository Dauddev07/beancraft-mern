import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import * as review from "../controllers/reviewController.js";

const router = Router();

router.get("/recent", asyncHandler(review.recentReviews));
router.get("/pending-delivered", protect, asyncHandler(review.pendingDeliveredReviews));
router.get("/product/:productId", asyncHandler(review.listByProduct));
router.get("/admin", protect, adminOnly, asyncHandler(review.listReviewsAdmin));
router.post("/", protect, asyncHandler(review.createReview));
router.delete("/:id", protect, adminOnly, asyncHandler(review.deleteReviewAdmin));

export default router;
