import { Router } from "express";
import { 
  getAllCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getCategorySummary
} from "../controllers/categoryController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

// All category routes should be protected
router.use(authenticate);

// Category routes
router.get("/", getAllCategories);
router.get("/summary", getCategorySummary);
router.get("/:id", getCategoryById);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;