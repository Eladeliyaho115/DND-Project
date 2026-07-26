import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { formatDbCharacterToFrontend } from "../utils/characterParser.js";

interface CampaignParams {
  id: string;
}

// 1. קבלת מערכה לפי ID כולל כל הדמויות המשויכות
export const getCampaignById = async (
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
      include: {
        characters: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const formattedCharacters = (campaign.characters || []).map(formatDbCharacterToFrontend);

    return res.status(200).json({
      ...campaign,
      characters: formattedCharacters,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to fetch campaign", error: errorMessage });
  }
};

// 2. עדכון רקע המערכה
export const updateCampaignBackground = async (
  req: Request<CampaignParams>,
  res: Response
): Promise<Response> => {
  try {
    const campaignId = req.params.id;
    const { bgUrl } = req.body;

    if (!campaignId) {
      return res.status(400).json({ message: "Campaign ID is required" });
    }

    if (!bgUrl) {
      return res.status(400).json({ message: "bgUrl is required" });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { bgUrl },
    });

    return res.status(200).json(updatedCampaign);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to update background", error: errorMessage });
  }
};

// 3. קבלת כל המערכות מ-DB כולל הדמויות המשויכות
export const getAllCampaigns = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        characters: true,
      },
    });

    const formattedCampaigns = campaigns.map((campaign) => ({
      ...campaign,
      characters: (campaign.characters || []).map(formatDbCharacterToFrontend),
    }));

    return res.status(200).json(formattedCampaigns);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to fetch campaigns", error: errorMessage });
  }
};

// 4. יצירת קמפיין חדש
export const createCampaign = async (req: Request, res: Response): Promise<Response> => {
  console.log("📥 GOT POST REQUEST TO CREATE CAMPAIGN:", req.body); // 👈 לוג בדיקה
  try {
    const { title, description, bgUrl } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description: description || "",
        bgUrl: bgUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23",
        status: "active",
      },
      include: { characters: true },
    });

    return res.status(201).json({
      ...campaign,
      characters: [],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to create campaign", error: errorMessage });
  }
};

// 5. עדכון סטטוס קמפיין (active / completed)
export const updateCampaignStatus = async (req: Request<CampaignParams>, res: Response): Promise<Response> => {
  try {
    const campaignId = req.params.id;
    const { status } = req.body;

    if (!campaignId || !status) {
      return res.status(400).json({ message: "Campaign ID and status are required" });
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status },
      include: { characters: true },
    });

    return res.status(200).json(updated);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to update status", error: errorMessage });
  }
};

// 6. מחיקת קמפיין
export const deleteCampaign = async (req: Request<CampaignParams>, res: Response): Promise<Response> => {
  try {
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({ message: "Campaign ID is required" });
    }

    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    return res.status(200).json({ message: "Campaign deleted successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to delete campaign", error: errorMessage });
  }
};

// עדכון פרטי קמפיין (title, description, bgUrl, status)
export const updateCampaign = async (req: Request<CampaignParams>, res: Response): Promise<Response> => {
  try {
    const campaignId = req.params.id;
    const { title, description, bgUrl, status } = req.body;

    if (!campaignId) {
      return res.status(400).json({ message: "Campaign ID is required" });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(bgUrl !== undefined && { bgUrl }),
        ...(status !== undefined && { status }),
      },
      include: { characters: true },
    });

    return res.status(200).json(updatedCampaign);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to update campaign", error: errorMessage });
  }
};