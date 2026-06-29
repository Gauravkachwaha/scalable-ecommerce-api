// models/order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentInfo: {
      orderId: String,
      paymentId: String,
      status: String,
      method: String,
    },
    shippingAddress: {
      address: String,
      city: String,
      postalCode: String,
      country: String,
    },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
