// backend/src/routes/characterRoutes.ts
import { Router } from "express";
import {
  getBeyondCharacterLive,
  saveOrSyncBeyondCharacter,
} from "../controllers/characterController.js";

const router = Router();

// Hook ה-5 שניות בפרונט פונה לפה (מהיר, ללא DB)
router.get("/beyond/:beyondId/live", getBeyondCharacterLive);

// כפתור הוספה / כפתור שמירה בסוף סשן פונה לפה (שומר ב-DB)
router.post("/beyond/:beyondId/save", saveOrSyncBeyondCharacter);

export default router;
