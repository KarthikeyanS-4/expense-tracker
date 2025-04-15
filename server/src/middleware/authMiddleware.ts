import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
      };
    }
  }
}

interface JwtPayload {
  userId: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authorization token required"
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found or unauthorized"
      });
      return;
    }
    
    // Attach user to request object
    req.user = { userId: decoded.userId };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
      return;
    }
    next(error);
  }
};