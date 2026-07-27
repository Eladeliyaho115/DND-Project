import { Router } from "express";
import multer from "multer";
import nodePath from "path";
import fs from "fs";
import {
  handleManualSummary,
  handleAISummary,
  handleGetCampaignSummaries,
  handleDeleteSummary,
} from "../controllers/ai/summaryController.js";

const router = Router();

// 1. הגדרת תיקיית העלאה דינמית עבור סיכומים
const uploadDir = nodePath.join(process.cwd(), "uploads", "summaries");

// וודא שהתיקייה קיימת (אם לא - יצור אותה)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. הגדרת האחסון של Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // יצירת שם קובץ ייחודי (זמן + שם מקורי)
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = nodePath.extname(file.originalname);
    cb(null, `summary-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

// 3. הגדרת ה-Routes
// upload.single("file") מטפל בבקשה, מפרק את req.body ומחלץ את req.file!
router.post("/manual", upload.single("file"), handleManualSummary);

router.post("/generate", handleAISummary);

router.get("/:campaignId", handleGetCampaignSummaries);

router.delete("/:summaryId", handleDeleteSummary);

export default router;