import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().optional(),
  monthlyLimit: z.number().nonnegative().optional()
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().optional(),
  monthlyLimit: z.number().nonnegative().optional()
});

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        userId: req.user.userId
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: {
        id,
        userId: req.user.userId
      }
    });
    
    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found"
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);
    
    // Check for duplicate category name for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: validatedData.name,
        userId: req.user.userId
      }
    });
    
    if (existingCategory) {
      res.status(400).json({
        success: false,
        message: "You already have a category with this name"
      });
    return;
    }
    
    const category = await prisma.category.create({
      data: {
        ...validatedData,
        userId: req.user.userId,
        // Convert number to Decimal for database
        monthlyLimit: validatedData.monthlyLimit ? validatedData.monthlyLimit.toString() : null
      }
    });
    
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);
    
    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findUnique({
      where: {
        id,
        userId: req.user.userId
      }
    });
    
    if (!existingCategory) {
      res.status(404).json({
        success: false,
        message: "Category not found"
      });
      return;
    }
    
    // Check for duplicate category name for this user
    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: validatedData.name,
          userId: req.user.userId,
          id: { not: id }
        }
      });
      
      if (duplicateCategory) {
        res.status(400).json({
          success: false,
          message: "You already have a category with this name"
        });
        return;
      }
    }
    
    const category = await prisma.category.update({
      where: {
        id,
        userId: req.user.userId
      },
      data: {
        ...validatedData,
        // Convert number to Decimal for database if provided
        monthlyLimit: validatedData.monthlyLimit !== undefined 
          ? validatedData.monthlyLimit.toString() 
          : undefined
      }
    });
    
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findUnique({
      where: {
        id,
        userId: req.user.userId
      }
    });
    
    if (!existingCategory) {
      res.status(404).json({
        success: false,
        message: "Category not found"
      });
      return;
    }
    
    // Check if there are any expenses using this category
    const expensesCount = await prisma.expense.count({
      where: {
        categoryId: id
      }
    });
    
    if (expensesCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used by ${expensesCount} expenses.`
      });
      return;
    }
    
    await prisma.category.delete({
      where: {
        id,
        userId: req.user.userId
      }
    });
    
    res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getCategorySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month } = req.query;
    
    if (!month || typeof month !== 'string' || !month.match(/^\d{4}-\d{2}$/)) {
      res.status(400).json({
        success: false,
        message: "Month parameter required in format YYYY-MM"
      });
      return;
    }
    
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of month
    
    // Get all categories for the user
    const categories = await prisma.category.findMany({
      where: {
        userId: req.user.userId
      },
      include: {
        expenses: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            amount: true
          }
        }
      }
    });
    
    // Calculate total spent per category
    interface CategorySummary {
      id: string;
      name: string;
      color: string | null;
      monthlyLimit: number | null;
      totalSpent: number;
      percentage: number | null;
      status: "green" | "yellow" | "red" | null;
    }

    // Remove Expense and Category interfaces, use actual Prisma return types

    const categorySummary: CategorySummary[] = categories.map((category) => {
      const totalSpent = category.expenses.reduce((sum: number, expense) => {
        // expense.amount is a Prisma Decimal, convert to number
        return sum + Number(expense.amount);
      }, 0);

      // category.monthlyLimit is a Prisma Decimal or null, convert to number or null
      const limit = category.monthlyLimit !== null ? Number(category.monthlyLimit) : null;
      const percentage = limit ? (totalSpent / limit) * 100 : null;
      let status: "green" | "yellow" | "red" | null = null;

      if (percentage !== null) {
        if (percentage < 60) {
          status = "green";
        } else if (percentage >= 60 && percentage <= 100) {
          status = "yellow";
        } else {
          status = "red";
        }
      }

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        monthlyLimit: limit,
        totalSpent,
        percentage: percentage ? Math.round(percentage) : null,
        status
      };
    });
    
    res.status(200).json({
      success: true,
      month: month,
      data: categorySummary
    });
  } catch (error) {
    next(error);
  }
};