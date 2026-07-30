import { Router } from "express";
import multer from "multer";
import {
  handleManualSummary,
  handleAISummary,
  handleGetCampaignSummaries,
  handleDeleteSummary,
  getMasterSummary,
  rebuildMasterSummary,
} from "../controllers/ai/summaryController.js";

const router = Router();

// הגדרת Multer לשמירה בזיכרון (MemoryStorage) - בדיוק כמו בדף דמות!
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // מגבלה של 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('רק קובצי PDF מותרים להעלאה!'));
    }
  },
});

// Routes
router.post("/manual", upload.single("file"), handleManualSummary);
router.post("/generate", handleAISummary);
router.get("/:campaignId", handleGetCampaignSummaries);
router.delete("/:summaryId", handleDeleteSummary);

// Master Summary Routes
router.get("/:id/master-summary", getMasterSummary);
router.post("/:id/rebuild-master-summary", rebuildMasterSummary);

export default router;