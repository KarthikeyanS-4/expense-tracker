import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const createExpenseSchema = z.object({
  title: z.string().min(1).max(100),
  amount: z.number().positive(),
  categoryId: z.string().uuid(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  notes: z.string().max(500).optional()
});

const updateExpenseSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  notes: z.string().max(500).optional()
});

export const getAllExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      categoryId, 
      startDate, 
      endDate, 
      page = "1", 
      limit = "20",
      sortBy = "date",
      sortOrder = "desc"
    } = req.query;
    
    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Build filter object
    const filter: any = {
      userId: req.user.userId
    };
    
    // Apply category filter if provided
    if (categoryId && typeof categoryId === 'string') {
      filter.categoryId = categoryId;
    }
    
    // Apply date filters if provided
    if (startDate || endDate) {
      filter.date = {};
      
      if (startDate && typeof startDate === 'string') {
        filter.date.gte = new Date(startDate);
      }
      
      if (endDate && typeof endDate === 'string') {
        filter.date.lte = new Date(endDate);
      }
    }
    
    // Process sort options
    const allowedSortFields = ['date', 'amount', 'title', 'createdAt'];
    const allowedSortOrders = ['asc', 'desc'];
    
    const orderBy: any = {};
    if (allowedSortFields.includes(sortBy as string) && 
        allowedSortOrders.includes(sortOrder as string)) {
      orderBy[sortBy as string] = sortOrder;
    } else {
      orderBy.date = 'desc';
    }
    
    // Get total count for pagination
    const total = await prisma.expense.count({
      where: filter
    });
    
    // Get expenses with pagination and sorting
    const expenses = await prisma.expense.findMany({
      where: filter,
      include: {
        category: {
          select: {
            name: true,
            color: true
          }
        }
      },
      orderBy,
      skip,
      take: limitNum
    });
    
    res.status(200).json({
      success: true,
      count: expenses.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const expense = await prisma.expense.findUnique({
      where: {
        id,
        userId: req.user.userId
      },
      include: {
        category: true
      }
    });
    
    if (!expense) {
      res.status(404).json({
        success: false,
        message: "Expense not found"
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createExpenseSchema.parse(req.body);
    
    // Check if category exists and belongs to user
    const category = await prisma.category.findUnique({
      where: {
        id: validatedData.categoryId,
        userId: req.user.userId
      }
    });
    
    if (!category) {
      res.status(400).json({
        success: false,
        message: "Invalid category"
      });
      return;
    }
    
    const expense = await prisma.expense.create({
      data: {
        title: validatedData.title,
        amount: validatedData.amount.toString(),
        date: new Date(validatedData.date),
        notes: validatedData.notes,
        categoryId: validatedData.categoryId,
        userId: req.user.userId
      },
      include: {
        category: {
          select: {
            name: true,
            color: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = updateExpenseSchema.parse(req.body);
    
    // Check if expense exists and belongs to user
    const existingExpense = await prisma.expense.findUnique({
      where: {
        id,
        userId: req.user.userId
      }
    });
    
    if (!existingExpense) {
      res.status(404).json({
        success: false,
        message: "Expense not found"
      });
      return;
    }
    
    // If changing category, check if it exists and belongs to user
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: {
          id: validatedData.categoryId,
          userId: req.user.userId
        }
      });
      
      if (!category) {
        res.status(400).json({
          success: false,
          message: "Invalid category"
        });
        return;
      }
    }
    
    // Format data for update
    const updateData: any = {};
    
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    
    if (validatedData.amount !== undefined) {
      updateData.amount = validatedData.amount.toString();
    }
    
    if (validatedData.categoryId !== undefined) {
      updateData.categoryId = validatedData.categoryId;
    }
    
    if (validatedData.date !== undefined) {
      updateData.date = new Date(validatedData.date);
    }
    
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }
    
    const expense = await prisma.expense.update({
      where: {
        id,
        userId: req.user.userId
      },
      data: updateData,
      include: {
        category: {
          select: {
            name: true,
            color: true
          }
        }
      }
    });
    
    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Check if expense exists and belongs to user
    const existingExpense = await prisma.expense.findUnique({
      where: {
        id,
        userId: req.user.userId
      }
    });
    
    if (!existingExpense) {
      res.status(404).json({
        success: false,
        message: "Expense not found"
      });
      return;
    }
    
    await prisma.expense.delete({
      where: {
        id,
        userId: req.user.userId
      }
    });
    
    res.status(200).json({
      success: true,
      message: "Expense deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getExpensesSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFormat;
    let groupByField;
    let today = new Date();
    let startDate;
    
    // Set date boundaries based on period
    if (period === 'week') {
      // Last 7 days
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      dateFormat = '%Y-%m-%d'; // Daily format
      groupByField = 'day';
    } else if (period === 'year') {
      // Last 12 months
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
      dateFormat = '%Y-%m'; // Monthly format
      groupByField = 'month';
    } else {
      // Last 30 days (default)
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      dateFormat = '%Y-%m-%d'; // Daily format
      groupByField = 'day';
    }
    
    // Get expenses grouped by category
    const expensesByCategory = await prisma.$queryRaw<any[]>`
      SELECT 
        c.id AS "categoryId",
        c.name AS "categoryName",
        c.color AS "categoryColor",
        SUM(CAST(e.amount AS DECIMAL(10,2))) AS "totalAmount"
      FROM "Expense" e
      JOIN "Category" c ON e."categoryId" = c.id
      WHERE e."userId" = ${req.user.userId}
      AND e.date >= ${startDate}
      AND e.date <= ${today}
      GROUP BY c.id, c.name, c.color
      ORDER BY "totalAmount" DESC
    `;
    
    // Format for pie chart
    interface ExpenseByCategory {
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      totalAmount: string;
    }

    interface CategoryDataItem {
      id: string;
      name: string;
      color: string;
      value: number;
    }

    const categoryData: CategoryDataItem[] = (expensesByCategory as ExpenseByCategory[]).map((item: ExpenseByCategory) => ({
      id: item.categoryId,
      name: item.categoryName,
      color: item.categoryColor,
      value: parseFloat(item.totalAmount)
    }));
    
    // Calculate total
    const totalExpenses = categoryData.reduce((sum, item) => sum + item.value, 0);
    
    // Add percentage
    const categoryDataWithPercentage = categoryData.map(item => ({
      ...item,
      percentage: Math.round((item.value / totalExpenses) * 100)
    }));
    
    // Get expenses grouped by time period
    let timeSeriesData;
    
    if (groupByField === 'day') {
      // Daily data for week or month view
      timeSeriesData = await prisma.$queryRaw<any[]>`
        SELECT 
          TO_CHAR(e.date, 'YYYY-MM-DD') AS "period",
          SUM(CAST(e.amount AS DECIMAL(10,2))) AS "amount"
        FROM "Expense" e
        WHERE e."userId" = ${req.user.userId}
        AND e.date >= ${startDate}
        AND e.date <= ${today}
        GROUP BY TO_CHAR(e.date, 'YYYY-MM-DD')
        ORDER BY "period"
      `;
    } else {
      // Monthly data for year view
      timeSeriesData = await prisma.$queryRaw<any[]>`
        SELECT 
          TO_CHAR(e.date, 'YYYY-MM') AS "period",
          SUM(CAST(e.amount AS DECIMAL(10,2))) AS "amount"
        FROM "Expense" e
        WHERE e."userId" = ${req.user.userId}
        AND e.date >= ${startDate}
        AND e.date <= ${today}
        GROUP BY TO_CHAR(e.date, 'YYYY-MM')
        ORDER BY "period"
      `;
    }
    
    // Format for line chart
    interface RawTimeSeriesData {
        period: string;
        amount: string;
    }

    interface TimeDataItem {
        period: string;
        amount: number;
    }

    const timeData: TimeDataItem[] = timeSeriesData.map((item: RawTimeSeriesData) => ({
        period: item.period,
        amount: parseFloat(item.amount)
    }));
    
    res.status(200).json({
      success: true,
      data: {
        totalExpenses,
        categoryData: categoryDataWithPercentage,
        timeSeriesData: timeData,
        period: period
      }
    });
  } catch (error) {
    next(error);
  }
};