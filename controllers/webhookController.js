// controllers/webhookController.js
import crypto from "crypto";
import Order from "../models/order.js";

const razorpayWebhook = async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay webhook secret is not configured",
      });
    }

    const signature = req.headers["x-razorpay-signature"];
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const signatureBuffer = Buffer.from(signature || "", "utf8");

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      return res.status(400).json({ success: false, error: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;
      const orderId = paymentEntity?.notes?.orderId || orderEntity?.notes?.orderId;

      if (orderId) {
        const update = {
          status: "processing",
          "paymentInfo.status": "paid",
          "paymentInfo.method": "razorpay",
        };

        if (paymentEntity?.id) {
          update["paymentInfo.paymentId"] = paymentEntity.id;
        }

        await Order.findByIdAndUpdate(orderId, update);
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    next(error);
  }
};

export { razorpayWebhook };
