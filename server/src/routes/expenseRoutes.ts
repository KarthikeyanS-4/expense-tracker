import { Router } from "express";
import { 
  getAllExpenses, 
  getExpenseById, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  getExpensesSummary
} from "../controllers/expenseController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// All expense routes should be protected
router.use(authenticate);

// Expense routes
router.get("/", getAllExpenses);
router.get("/summary", getExpensesSummary);
router.get("/:id", getExpenseById);
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;