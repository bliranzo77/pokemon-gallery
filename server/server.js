import express from "express";
import dotenv from "dotenv";
import connectDB from "./db.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "API running" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
