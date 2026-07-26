import { Router } from "express";
import { 
  getCampaignById, 
  getAllCampaigns, 
  updateCampaignBackground 
} from "../controllers/campaignController.js";

const router = Router();

// GET /api/campaigns - קבלת כל המערכות מהדאטאבייס
router.get("/", getAllCampaigns);

// GET /api/campaigns/:id - קבלת מערכה ספציפית לפי ID
router.get("/:id", getCampaignById);

// PATCH /api/campaigns/:id/background - עדכון תמונת רקע
router.patch("/:id/background", updateCampaignBackground);

export default router;