//for handling payment related operations normal api calls and also for creating the order in razorpay and returning the order details to the client
import Razorpay from 'razorpay';
import mongoose from "mongoose";
import Order from "../models/order.js";


const createRazorpayOrder = async (req,res,next) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid orderId is required" });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay credentials are not configured",
      });
    }

    const order = await Order.findById(orderId);

    //checking if the order does not exist
    if (!order) {
      return res
        .status(400)
        .json({ success: false, message: "Order not found" });
    }

    if (order.userId.toString() !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to pay for this order");
    }

    if (order.paymentInfo?.status === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Order is already paid" });
    }

    //creating a new payment order
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(order.totalAmount * 100), // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        orderId: order._id.toString(),
      },
    };
    //creating the order in razorpay
    const razorpayOrder = await razorpay.orders.create(options);
    order.paymentInfo = {
      ...order.paymentInfo,
      orderId: razorpayOrder.id,
      status: order.paymentInfo?.status || "pending",
      method: "razorpay",
    };
    await order.save();

    //returning the status and the order details to the client
    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
}

export { createRazorpayOrder };
