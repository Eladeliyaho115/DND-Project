import { Request, Response } from "express";
import {
  createManualSummary,
  generateAISummary,
  getSummariesByCampaign,
} from "../../services/ai/summaryService.js";

// 1. קונטרולר להוספת סיכום ידני
export const handleManualSummary = async (req: Request, res: Response) => {
  try {
    const { campaignId, content } = req.body;

    if (!campaignId || !content) {
      return res
        .status(400)
        .json({ error: "campaignId and content are required" });
    }

    const summary = await createManualSummary(campaignId, content);
    return res.status(201).json({ success: true, summary });
  } catch (error) {
    console.error("Error in handleManualSummary:", error);
    return res.status(500).json({ error: "Failed to save manual summary" });
  }
};

// 2 + 3. קונטרולר לסיכום AI (לפי דרישה או אוטומטי)
export const handleAISummary = async (req: Request, res: Response) => {
  try {
    const { campaignId, history, createdVia } = req.body;

    if (!campaignId || !history || !Array.isArray(history)) {
      return res
        .status(400)
        .json({ error: "campaignId and history array are required" });
    }

    // ברירת מחדל ON_DEMAND במידה ולא נשלח
    const mode = createdVia === "AUTO" ? "AUTO" : "ON_DEMAND";

    const summary = await generateAISummary(campaignId, history, mode);
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error("Error in handleAISummary:", error);
    return res.status(500).json({ error: "Failed to generate AI summary" });
  }
};

// 3. קונטרולר לשליפת כל הסיכומים של קמפיין
export const handleGetCampaignSummaries = async (
  req: Request<{ campaignId: string }>, // 👈 הגדרת הטיפוס המפורש ל-req.params
  res: Response,
) => {
  try {
    const { campaignId } = req.params;

    if (!campaignId) {
      return res
        .status(400)
        .json({ error: "campaignId parameter is required" });
    }

    const summaries = await getSummariesByCampaign(campaignId);
    return res.status(200).json({ success: true, summaries });
  } catch (error) {
    console.error("Error in handleGetCampaignSummaries:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch campaign summaries" });
  }
};
