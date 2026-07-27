import { Router } from 'express';
import { 
  handleManualSummary, 
  handleAISummary, 
  handleGetCampaignSummaries
} from '../controllers/summaryController.js';

const router = Router();

// נתיב לסיכום ידני
router.post('/manual', handleManualSummary);

// נתיב לסיכום AI (מכסה גם On-Demand וגם Auto)
router.post('/generate', handleAISummary);

// 👈 Endpoint חדש: שליפת כל הסיכומים של קמפיין
router.get('/:campaignId', handleGetCampaignSummaries);

export default router;