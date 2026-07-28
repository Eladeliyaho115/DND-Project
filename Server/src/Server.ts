import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import characterSheetPDFRoutes from "./routes/characterSheetPDFRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import nodePath from "path";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Healthcheck Route
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/users", userRoutes);
app.use("/characters", characterRoutes);
app.use("/campaigns", campaignRoutes);
app.use("/ai", aiRoutes);
app.use("/character-sheets", characterSheetPDFRoutes);
app.use("/summaries", summaryRoutes);
app.use("/uploads", express.static(nodePath.join(process.cwd(), "uploads")));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
