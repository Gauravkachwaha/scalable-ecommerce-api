import express from "express";
import { createRazorpayOrder } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to create a Razorpay order
router.post("/create-order", protect, createRazorpayOrder);

export default router;
