import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import * as product from "../controllers/productController.js";

const router = Router();

// Static paths before /:id so "best-sellers" is not parsed as an id.
router.get("/best-sellers", asyncHandler(product.bestSellers));
router.get("/", asyncHandler(product.listProducts));
router.get("/:id", asyncHandler(product.getProduct));

router.post("/", protect, adminOnly, asyncHandler(product.createProduct));
router.put("/:id", protect, adminOnly, asyncHandler(product.updateProduct));
router.delete("/:id", protect, adminOnly, asyncHandler(product.deleteProduct));

export default router;
