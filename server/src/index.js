import express from "express";
import { connectDB } from "./config/db.js";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState });
});

try {
  await connectDB();
} catch (err) {
  console.error("Could not connect to MongoDB:", err.message);
  process.exit(1);
}

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});