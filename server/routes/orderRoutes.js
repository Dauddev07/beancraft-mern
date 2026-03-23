import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import * as order from "../controllers/orderController.js";

const router = Router();

router.post("/", protect, asyncHandler(order.createOrder));
router.get("/my", protect, asyncHandler(order.myOrders));
router.get("/all", protect, adminOnly, asyncHandler(order.allOrders));
router.patch("/:id/accept", protect, adminOnly, asyncHandler(order.acceptOrder));
router.patch("/:id/deliver", protect, adminOnly, asyncHandler(order.markOrderDelivered));
router.patch("/:id/cancel", protect, asyncHandler(order.cancelMyOrder));
router.delete("/:id", protect, adminOnly, asyncHandler(order.deleteOrder));

export default router;
