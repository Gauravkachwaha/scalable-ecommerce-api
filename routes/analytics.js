// routes/analytics.js
import express from "express";
import {
  getSalesAnalytics,
  getRevenueByCategory,
  getTopProducts,
  getDailySales,
} from "../controllers/analyticsController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/summary", getSalesAnalytics);
router.get("/category", getRevenueByCategory);
router.get("/top-products", getTopProducts);
router.get("/daily", getDailySales);

export default router;
