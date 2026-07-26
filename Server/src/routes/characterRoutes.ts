import { Router } from "express";
import { 
  getBeyondCharacterLive, 
  saveOrSyncBeyondCharacter, 
  getAllCharacters,
  deleteCharacter 
} from "../controllers/characterController.js";

const router = Router();

// GET /api/characters - קבלת כל הדמויות מהדאטאבייס
router.get("/", getAllCharacters);

// GET /api/characters/beyond/:beyondId/live - קריאת Live מ מול D&D Beyond
router.get("/beyond/:beyondId/live", getBeyondCharacterLive);

// POST /api/characters/beyond/:beyondId/save - שמירה/סנכרון דמות לדאטאבייס
router.post("/beyond/:beyondId/save", saveOrSyncBeyondCharacter);

// DELETE /api/characters/:id - מחיקת דמות לפי ID
router.delete("/:id", deleteCharacter);

export default router;