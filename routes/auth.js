import express from "express";
import { bootstrapAdmin, register, login } from "../controllers/authControllers.js";

const router = express.Router();

// Register route
router.post("/register", register);
// Login route
router.post("/login", login);
// One-time admin bootstrap route. Requires ADMIN_BOOTSTRAP_SECRET.
router.post("/bootstrap-admin", bootstrapAdmin);

export default router;
