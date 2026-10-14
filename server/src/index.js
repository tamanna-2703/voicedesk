import express from "express";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();
app.use(express.json());

// Setup Swagger API Documentation
setupSwagger(app);

// Routes
app.use("/api/auth", authRoutes);

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Server and database connection status
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState });
});

try {
  await connectDB();
} catch (err) {
  console.error("Could not connect to MongoDB:", err.message);
  process.exit(1);
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger API Docs available at http://localhost:${port}/api/docs`);
});

