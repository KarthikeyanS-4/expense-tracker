import { Router } from "express";
import authRoutes from "./authRoutes";
import expenseRoutes from "./expenseRoutes";
import categoryRoutes from "./categoryRoutes";

const router = Router();

// Mount route groups
router.use("/auth", authRoutes);
router.use("/expenses", expenseRoutes);
router.use("/categories", categoryRoutes);

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    name: "Expense Tracker API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      expenses: "/api/expenses",
      categories: "/api/categories"
    }
  });
});

export default router;