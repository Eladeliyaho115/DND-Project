import { Router } from 'express';
import multer from 'multer';
import { handleUploadCharacterSheet } from '../controllers/characterSheetPDFController.js';

const router = Router();

// הגדרת Multer לשמירה זמנית בזיכרון בתוספת בדיקת סוג קובץ
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // מגבלה של 10MB לקובץ
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('רק קובצי PDF מותרים להעלאה!'));
    }
  },
});

// POST /api/character-sheets/upload
router.post('/upload', upload.single('pdf'), handleUploadCharacterSheet);

export default router;