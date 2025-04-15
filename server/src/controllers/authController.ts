import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100)
});

// Helper to generate JWT token
const generateToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d" // Token expires in 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    console.log(validatedData);
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      res.status(400).json({ 
        success: false, 
        message: "User with this email already exists" 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        // Create default categories for new users
        categories: {
          create: [
            { name: "Food", monthlyLimit: 500, color: "#FF5733" },
            { name: "Transport", monthlyLimit: 200, color: "#33FF57" },
            { name: "Rent", monthlyLimit: 1000, color: "#3357FF" },
            { name: "Utilities", monthlyLimit: 150, color: "#F3FF33" },
            { name: "Entertainment", monthlyLimit: 200, color: "#FF33F3" }
          ]
        }
      }
    });
    
    // Generate token
    const token = generateToken(user.id);
    
    // Send response
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (!user) {
      res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
      return;
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    
    if (!isPasswordValid) {
      res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
      return;
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // User is already attached to request by auth middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};