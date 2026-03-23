import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import * as auth from "../controllers/authController.js";

const router = Router();

router.post("/signup", asyncHandler(auth.signup));
router.post("/login", asyncHandler(auth.login));
router.get("/me", protect, asyncHandler(auth.me));

export default router;
