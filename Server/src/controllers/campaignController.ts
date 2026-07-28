// backend/src/controllers/campaignController.ts

import { Request, Response } from "express";
import * as campaignService from "../services/campaign/campaignService.js";

interface CampaignParams {
  id: string;
}

// 1. קבלת מערכה לפי ID
export const getCampaignById = async (
  req: Request<CampaignParams>,
  res: Response,
): Promise<Response> => {
  try {
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({
        message: "Campaign ID is required",
      });
    }

    const campaign = await campaignService.getCampaignById(campaignId);

    return res.status(200).json(campaign);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (errorMessage === "Campaign not found") {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    return res.status(500).json({
      message: "Failed to fetch campaign",
      error: errorMessage,
    });
  }
};

// 2. קבלת כל המערכות
export const getAllCampaigns = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const campaigns = await campaignService.getAllCampaigns();

    return res.status(200).json(campaigns);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      message: "Failed to fetch campaigns",
      error: errorMessage,
    });
  }
};

// 3. יצירת קמפיין חדש
export const createCampaign = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  console.log("📥 GOT POST REQUEST TO CREATE CAMPAIGN:", req.body);

  try {
    const { title, description, bgUrl } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const campaign = await campaignService.createCampaign(
      title,
      description,
      bgUrl,
    );

    return res.status(201).json(campaign);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      message: "Failed to create campaign",
      error: errorMessage,
    });
  }
};

// 4. עדכון פרטי קמפיין (כולל title, description, bgUrl, mapUrl, status)
export const updateCampaign = async (
  req: Request<CampaignParams>,
  res: Response,
): Promise<Response> => {
  try {
    const campaignId = req.params.id;
    const { title, description, bgUrl, mapUrl, status } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        message: "Campaign ID is required",
      });
    }

    const updatedCampaign = await campaignService.updateCampaign(campaignId, {
      title,
      description,
      bgUrl,
      mapUrl,
      status,
    });

    return res.status(200).json(updatedCampaign);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      message: "Failed to update campaign",
      error: errorMessage,
    });
  }
};

// 5. עדכון סטטוס קמפיין בלבד
export const updateCampaignStatus = async (
  req: Request<CampaignParams>,
  res: Response,
): Promise<Response> => {
  try {
    const campaignId = req.params.id;
    const { status } = req.body;

    if (!campaignId || !status) {
      return res.status(400).json({
        message: "Campaign ID and status are required",
      });
    }

    const updated = await campaignService.updateCampaignStatus(
      campaignId,
      status,
    );

    return res.status(200).json(updated);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      message: "Failed to update status",
      error: errorMessage,
    });
  }
};

// 6. מחיקת קמפיין
export const deleteCampaign = async (
  req: Request<CampaignParams>,
  res: Response,
): Promise<Response> => {
  try {
    const campaignId = req.params.id;

    if (!campaignId) {
      return res.status(400).json({
        message: "Campaign ID is required",
      });
    }

    await campaignService.deleteCampaign(campaignId);

    return res.status(200).json({
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      message: "Failed to delete campaign",
      error: errorMessage,
    });
  }
};