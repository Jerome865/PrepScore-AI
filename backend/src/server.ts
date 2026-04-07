import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import geminiRoutes from "./routes/geminiRoutes";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api", geminiRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

app.post("/test", (req, res) => {
  res.json({ message: "POST route works" });
});