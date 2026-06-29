import Product from "../models/product.js";

const normalizeProductPayload = (body) => {
  const payload = { ...body };

  if (payload.price !== undefined) {
    payload.price = Number(payload.price);
  }

  if (payload.stock !== undefined) {
    payload.stock = Number(payload.stock);
  }

  return payload;
};

const validateProductPayload = (payload, { partial = false } = {}) => {
  const requiredFields = ["name", "description", "price", "stock", "category"];

  if (!partial) {
    const missingField = requiredFields.find((field) => payload[field] === undefined || payload[field] === "");
    if (missingField) {
      return `${missingField} is required`;
    }
  }

  if (payload.price !== undefined && (!Number.isFinite(payload.price) || payload.price < 0)) {
    return "Price must be a non-negative number";
  }

  if (
    payload.stock !== undefined &&
    (!Number.isInteger(payload.stock) || payload.stock < 0)
  ) {
    return "Stock must be a non-negative integer";
  }

  return null;
};

//create the route handler
const createProduct = async (req, res, next) => {
  try {
    const imagePaths = req.files
      ? req.files.map((file) => `/uploads/products/${file.filename}`)
      : []; // this will create the array of the image paths that will be stored in the database and will be used to display the images in the frontend
    //create the product in the database
    const payload = normalizeProductPayload(req.body);
    const validationError = validateProductPayload(payload);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const { name, description, price, stock, category } = payload;
    const product = new Product({
      name,
      description,
      price,
      stock,
      category,
      images: imagePaths,
    });

  

    await product.save();

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

//update controller
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const payload = normalizeProductPayload(req.body);
    const validationError = validateProductPayload(payload, { partial: true });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    // If new images are uploaded, add them
    if (req.files && req.files.length > 0) {
      const newImagePaths = req.files.map(
        (file) => `/uploads/products/${file.filename}`,
      );
      payload.images = [...(product.images || []), ...newImagePaths];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true,
        runValidators: true,
      },
    );
    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    next(error);
  }
};

//deleting controller
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};

//getproduct by id controller
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

//getting the all the products controller + search + filters + pagination
const getAllProducts = async (req, res, next) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be >= 1 and limit must be between 1 and 100",
      });
    }

    if (
      (minPrice !== undefined && !Number.isFinite(Number(minPrice))) ||
      (maxPrice !== undefined && !Number.isFinite(Number(maxPrice)))
    ) {
      return res.status(400).json({
        success: false,
        message: "Price filters must be valid numbers",
      });
    }

    const query = {};

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ]; // this will search for the keyword in the name and description fields of the product collection and will return the products that match the keyword in either of the fields
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = Number(minPrice); //typecasting
      }
      if (maxPrice) {
        query.price.$lte = Number(maxPrice); //typecasting
      }
    }
    const skip = (pageNumber - 1) * limitNumber; // this will calculate the number of documents to skip based on the current page and limit
    const products = await Product.find(query)
      .sort({ createdAt: -1 }) //Newest products first
      .skip(skip) // skip the number of documents based on the current page and the limit
      .limit(limitNumber); //take this many product at one got

   
    const total = await Product.countDocuments(query);

    
    res.status(200).json({
      success: true,
      totalProducts: total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// this is for exporting the controller the q controller will be used in the routes file to handle the requests for the product routes
export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
