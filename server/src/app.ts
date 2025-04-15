import express, { Express, Request, Response, ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

// Create Express app
const app: Express = express();
export const prisma = new PrismaClient();

// Middleware setup
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan("dev")); // Request logging

// API Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// API Routes
app.use("/api", routes);

// 404 Handler for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl
  });
});
// Global error handler
app.use(errorHandler as ErrorRequestHandler);

export default app;