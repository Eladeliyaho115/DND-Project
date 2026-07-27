import { Request, Response } from "express";
import {
  createManualSummary,
  generateAISummary,
  getSummariesByCampaign,
  deleteSummaryById
} from "../../services/ai/summaryService.js";

// 1. קונטרולר מאוחד להוספת סיכום ידני (טקסט, העלאת קובץ PDF, או שניהם)
export const handleManualSummary = async (req: Request, res: Response) => {
  try {
    // כעת req.body מפוענח בבטחה ע"י Multer!
    const { campaignId, content, pdfUrl: bodyPdfUrl } = req.body || {};
    const file = req.file;

    if (!campaignId) {
      return res.status(400).json({ error: "campaignId is required" });
    }

    if (!content && !file && !bodyPdfUrl) {
      return res.status(400).json({ error: "Either content or a PDF file must be provided" });
    }

    // גזירת נתיב הקובץ במידה והועלה קובץ דרך Multer
    const pdfUrl = file ? `/uploads/summaries/${file.filename}` : bodyPdfUrl;

    const summary = await createManualSummary(campaignId, content, pdfUrl);
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