// backend/src/services/campaign/campaignService.ts

import { prisma } from "../../config/db.js";
import { formatDbCharacterToFrontend } from "../character/characterMapper.js";

// 1. קבלת מערכה לפי ID כולל כל הדמויות
export const getCampaignById = async (campaignId: string) => {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: campaignId,
    },
    include: {
      characters: true,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const formattedCharacters = campaign.characters.map(
    formatDbCharacterToFrontend,
  );

  return {
    ...campaign,
    characters: formattedCharacters,
  };
};

// 2. קבלת כל המערכות כולל הדמויות
export const getAllCampaigns = async () => {
  const campaigns = await prisma.campaign.findMany({
    include: {
      characters: true,
    },
  });

  return campaigns.map((campaign) => ({
    ...campaign,
    characters: campaign.characters.map(formatDbCharacterToFrontend),
  }));
};

// 3. יצירת קמפיין חדש
export const createCampaign = async (
  title: string,
  description?: string,
  bgUrl?: string,
) => {
  const campaign = await prisma.campaign.create({
    data: {
      title,
      description: description || "",
      bgUrl:
        bgUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23",
      status: "active",
    },
    include: {
      characters: true,
    },
  });

  return {
    ...campaign,
    characters: [],
  };
};

// 4. עדכון פרטי קמפיין (כולל סטטוס, תמונת רקע, מפת עולם ו-Master Summary)
export const updateCampaign = async (
  campaignId: string,
  data: {
    title?: string;
    description?: string;
    bgUrl?: string;
    mapUrl?: string;
    status?: string;
    masterSummary?: string; // 🟢 הוספת התמיכה בסיכום העל
  },
) => {
  const updatedCampaign = await prisma.campaign.update({
    where: {
      id: campaignId,
    },
    data: {
      ...(data.title !== undefined && {
        title: data.title,
      }),
      ...(data.description !== undefined && {
        description: data.description,
      }),
      ...(data.bgUrl !== undefined && {
        bgUrl: data.bgUrl,
      }),
      ...(data.mapUrl !== undefined && {
        mapUrl: data.mapUrl,
      }),
      ...(data.status !== undefined && {
        status: data.status,
      }),
      ...(data.masterSummary !== undefined && {
        masterSummary: data.masterSummary,
      }),
    },
    include: {
      characters: true,
    },
  });

  return {
    ...updatedCampaign,
    characters: updatedCampaign.characters.map(formatDbCharacterToFrontend),
  };
};

// 5. עדכון סטטוס קמפיין
export const updateCampaignStatus = async (
  campaignId: string,
  status: string,
) => {
  return updateCampaign(campaignId, { status });
};

// 6. מחיקת קמפיין
export const deleteCampaign = async (campaignId: string) => {
  await prisma.campaign.delete({
    where: {
      id: campaignId,
    },
  });
};