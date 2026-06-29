import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import productRoutes from "./routes/product.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/order.js";
import paymentRoutes from "./routes/payment.js";
import analyticsRoutes from "./routes/analytics.js";
import { razorpayWebhook } from "./controllers/webhookController.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL;
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : "*";

app.disable("x-powered-by");

app.use(cors({ origin: corsOrigins }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook,
);

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.send("E-Commerce API is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

const start = async () => {
  try {
    if (!MONGO_URL) {
      throw new Error("MONGO_URL is required");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required");
    }

    const connectionDB = await mongoose.connect(MONGO_URL);
    console.log(`MongoDB connected. Host: ${connectionDB.connection.host}`);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

start();
