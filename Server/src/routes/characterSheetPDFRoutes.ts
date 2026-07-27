import { Router } from 'express';
import multer from 'multer';
import { handleUploadCharacterSheet } from '../controllers/characterSheetPDFController.js';

const router = Router();

// הגדרת Multer לשמירה זמני בזיכרון (Memory Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // מגבלה של 10MB לקובץ
});

// POST /api/character-sheets/upload
router.post('/upload', upload.single('pdf'), handleUploadCharacterSheet);

export default router;