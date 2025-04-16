import { Router } from "express";
import { register, login, getCurrentUser } from "../controllers/authController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// Authentication routes
router.post("/signup", register);
router.post("/login", login);
router.get("/me", authenticate, getCurrentUser);

export default router;