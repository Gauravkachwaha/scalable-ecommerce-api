// models/cart.js
import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
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
          // price at the time of adding
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

cartSchema.index({ userId: 1 }, { unique: true });

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
