import Cart from "../models/cart.js";
import Product from "../models/product.js";

//Add to the cart controller
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const requestedQuantity = Number(quantity);

    if (
      !productId ||
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid productId and quantity are required",
      });
    }

    const product = await Product.findById(productId);
    //if the product is not found in the database
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.stock < requestedQuantity) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough stock available" });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    //if the cart of the user does not exist then create a new cart
    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    //if it does not exist then add the product to the cart otherwise update the quantity of the product in the cart
    if (existingItem) {
      if (product.stock < existingItem.quantity + requestedQuantity) {
        return res
          .status(400)
          .json({ success: false, message: "Not enough stock available" });
      }

      // Update quantity
      existingItem.quantity += requestedQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: requestedQuantity,
        price: product.price,
      });
    }

    await cart.save();
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

//get the cart of the user
const getCart = async (req, res, next) => {
  try {
    //.populate will replace the product id in the cart with the actual product details from the product collection
    let cart = await Cart.findOne({ userId: req.user.id }).populate(
      "items.product",
    );

    if (!cart) {
      return res
        .status(200)
        .json({ success: true, items: [], totalItems: 0, totalPrice: 0 });
    }

    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );

    res.status(200).json({
      success: true,
      //storing the value to the cart object to send the response to the client
      items: cart.items,
      totalItems,
      totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

//update cart controller
const updateCartItem = async (req, res, next) => {
  try {
    //we are getting the product id from the url parameters and the quantity from the request body
    const { productId } = req.params;
    //we are getting the quantity from the request body
    const { quantity } = req.body;
    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    //id the cart does not exist
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    if (product.stock < requestedQuantity) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough stock" });
    }

    item.quantity = requestedQuantity;
    await cart.save();

    res.status(200).json({ success: true, cart });
  } catch (error) {
    next(error);
  }
};
//Remove item from the cart
const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter((i) => i.product.toString() !== productId); // remove the item from the cart that matches the product id
    await cart.save();
    res
      .status(200)
      .json({ success: true, message: "Item removed from cart", cart });
  } catch (error) {
    next(error);
  }
};

// Clear entire cart
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (error) {
    next(error);
  }
};

export { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
