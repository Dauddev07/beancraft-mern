import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import * as cat from "../controllers/categoryController.js";

const router = Router();

router.get("/", asyncHandler(cat.listCategories));
router.post("/", protect, adminOnly, asyncHandler(cat.createCategory));
router.put("/:id", protect, adminOnly, asyncHandler(cat.updateCategory));
router.delete("/:id", protect, adminOnly, asyncHandler(cat.deleteCategory));

export default router;
