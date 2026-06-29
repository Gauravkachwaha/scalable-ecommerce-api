// routes/product.js
import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import upload from "../middleware/upload.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Create product with up to 5 images
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  upload.array("images", 5),
  createProduct,
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  upload.array("images", 5),
  updateProduct,
);
router.delete("/:id", protect, authorizeRoles("admin"), deleteProduct);

export default router;
