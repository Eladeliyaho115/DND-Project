import { Router } from "express";
import {
  getCampaignById,
  getAllCampaigns,
  updateCampaignBackground,
  createCampaign,
  updateCampaignStatus,
  updateCampaign, // 👈 1. ייבוא
  deleteCampaign,
} from "../controllers/campaignController.js";

const router = Router();

router.get("/", getAllCampaigns);
router.post("/", createCampaign);
router.get("/:id", getCampaignById);
router.put("/:id", updateCampaign); // 👈 2. הוספת ה-Route לעדכון כללי
router.patch("/:id/background", updateCampaignBackground);
router.patch("/:id/status", updateCampaignStatus);
router.delete("/:id", deleteCampaign);

export default router;
