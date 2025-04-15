import dotenv from "dotenv";
import app from "./app";
import { PrismaClient } from "@prisma/client";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Connect to database and start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("🔌 Connected to database successfully");

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle server shutdown gracefully
process.on("SIGINT", async () => {
  console.log("Server shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Promise Rejection:", reason);
  // Application will continue running
});

// Start the server
startServer();