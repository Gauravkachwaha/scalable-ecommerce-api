// controllers/authController.js
import User from "../models/user.js"; // ← Capital U + correct path
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

// Register
const register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all the required fields",
      });
    }

    if (!isValidEmail(email) || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email and password with at least 6 characters",
      });
    }

    const existUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this username or email",
      });
    }

    const user = new User({
      name,
      username,
      email,
      password, 
    });

    await user.save();

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all the required fields",
      });
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = signToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const bootstrapAdmin = async (req, res, next) => {
  try {
    const { name, username, email, password, bootstrapSecret } = req.body;

    if (!process.env.ADMIN_BOOTSTRAP_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Admin bootstrap is not enabled",
      });
    }

    if (bootstrapSecret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid bootstrap secret",
      });
    }

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin user already exists",
      });
    }

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all the required fields",
      });
    }

    if (!isValidEmail(email) || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email and password with at least 6 characters",
      });
    }

    const existUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this username or email",
      });
    }

    const user = await User.create({
      name,
      username,
      email,
      password,
      role: "admin",
    });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: "Admin user created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { register, login, bootstrapAdmin };
