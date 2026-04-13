import express from "express";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.route.js";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API running...");
});

connectDB();

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
