import { Request, Response } from "express";
import {
  createManualSummary,
  generateAISummary,
  getSummariesByCampaign,
  deleteSummaryById,
  generateInitialMasterSummary,
} from "../../services/ai/summaryService.js";
import { prisma } from "../../config/db.js";

interface CampaignParams {
  id: string;
}

// 1. קונטרולר מאוחד להוספת סיכום ידני (עבודה מלאה בזיכרון מול Buffer)
export const handleManualSummary = async (req: Request, res: Response) => {
  try {
    const { campaignId, content, pdfUrl: bodyPdfUrl } = req.body || {};
    const file = req.file;

    if (!campaignId) {
      return res.status(400).json({ error: "campaignId is required" });
    }

    if (!content && !file && !bodyPdfUrl) {
      return res.status(400).json({ error: "Either content or a PDF file must be provided" });
    }

    // שליפת ה-Buffer והשם מהזיכרון
    const pdfBuffer = file ? file.buffer : undefined; // 👈 בול כמו בדף דמות!
    const pdfUrl = bodyPdfUrl || (file ? file.originalname : undefined);

    // העברת ה-Buffer ל-Service
    const summary = await createManualSummary(campaignId, content, pdfBuffer, pdfUrl);

    return res.status(201).json({ success: true, summary });
  } catch (error) {
    console.error("Error in handleManualSummary:", error);
    return res.status(500).json({ error: "Failed to save manual summary" });
  }
};

// 2. קונטרולר לסיכום AI (לפי דרישה ON_DEMAND או אוטומטי AUTO)
export const handleAISummary = async (req: Request, res: Response) => {
  try {
    const { campaignId, history, createdVia } = req.body;

    if (!campaignId || !history || !Array.isArray(history)) {
      return res.status(400).json({ error: "campaignId and history array are required" });
    }

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
  req: Request<{ campaignId: string }>,
  res: Response
) => {
  try {
    const { campaignId } = req.params;

    if (!campaignId) {
      return res.status(400).json({ error: "campaignId parameter is required" });
    }

    const summaries = await getSummariesByCampaign(campaignId);
    return res.status(200).json({ success: true, summaries });
  } catch (error) {
    console.error("Error in handleGetCampaignSummaries:", error);
    return res.status(500).json({ error: "Failed to fetch campaign summaries" });
  }
};

// 4. קונטרולר למחיקת סיכום
export const handleDeleteSummary = async (
  req: Request<{ summaryId: string }>,
  res: Response
) => {
  try {
    const { summaryId } = req.params;
    if (!summaryId) {
      return res.status(400).json({ error: "summaryId required" });
    }

    await deleteSummaryById(summaryId);
    return res.json({ success: true, message: "הסיכום שנבחר נמחק בהצלחה." });
  } catch (error) {
    console.error("Error deleting summary:", error);
    return res.status(500).json({ error: "שגיאה במחיקת הסיכום." });
  }
};

// 📖 5. קבלת ה-Master Summary של קמפיין
export const getMasterSummary = async (
  req: Request<CampaignParams>,
  res: Response
): Promise<Response> => {
  try {
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ message: "Campaign ID is required" });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, title: true, masterSummary: true },
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    return res.status(200).json(campaign);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to fetch master summary", error: errorMessage });
  }
};

// 🔄 6. יצירה מחדש של ה-Master Summary מתוך הסיכומים הקיימים
export const rebuildMasterSummary = async (
  req: Request<CampaignParams>,
  res: Response
): Promise<Response> => {
  try {
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ message: "Campaign ID is required" });
    }

    const newMaster = await generateInitialMasterSummary(campaignId);
    return res.status(200).json({
      message: "Master summary rebuilt successfully",
      masterSummary: newMaster,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      message: "Failed to rebuild master summary",
      error: errorMessage,
    });
  }
};