import Order from "../models/order.js";
import Product from "../models/product.js";
import Cart from "../models/cart.js";

const requiredShippingFields = ["address", "city", "postalCode", "country"];

// Create a new order
// Create a new order - Phase 5 (with MongoDB Transaction)
const createOrder = async (req, res, next) => {
  const { items, shippingAddress } = req.body; // ← changed "item" to "items"

  if (!items || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No items provided" });
  }

  const hasInvalidItem = items.some(
    (item) =>
      !item.product ||
      !Number.isInteger(Number(item.quantity)) ||
      Number(item.quantity) < 1,
  );

  if (hasInvalidItem) {
    return res.status(400).json({
      success: false,
      message: "Each order item must include a product and positive quantity",
    });
  }

  if (
    !shippingAddress ||
    requiredShippingFields.some((field) => !shippingAddress[field])
  ) {
    return res.status(400).json({
      success: false,
      message: "Complete shipping address is required",
    });
  }

  const session = await Order.startSession(); //This creates a temporary box (a session). We can put multiple operations inside this box, and if any of them fail, we can throw everything away and start over. This way, we ensure that all operations either succeed together or fail together, keeping our data consistent.
  session.startTransaction(); //Start recording all changes inside this temporary box

  try {
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error(`Product with ID ${item.product} not found`);
      }

      const quantity = Number(item.quantity);

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        quantity,
        price: product.price,
      });

      // Reduce stock inside transaction
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -quantity } },
        { session },
      );
    }

    // Create order transaction
    const order = await Order.create(
      [
        {
          userId: req.user.id,
          items: orderItems,
          totalAmount,
          shippingAddress,
          status: "pending",
          paymentInfo: { status: "pending" },
        },
      ],
      { session },
    );

    // Clear cart  transaction
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { items: [] },
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Order created successfully (Atomic Transaction)",
      order: order[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Getting all the orders of the user 
const getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("items.product")
      .sort({ createdAt: -1 });//sorting the orders by createdAt in descending order to show the most recent orders first

    res.json({
      success: true,
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

//Getting a single order by its ID
const getOrderById = async (req, res,next) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Only allow user to see their own order
    if (order.userId.toString() !== req.user.id) {
      res.status(403);
      throw new Error("Not authorized to view this order");
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

export { createOrder, getUserOrders, getOrderById };
