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

// 2. עדכון רקע המערכה
export const updateCampaignBackground = async (
  campaignId: string,
  bgUrl: string,
) => {
  const updatedCampaign = await prisma.campaign.update({
    where: {
      id: campaignId,
    },
    data: {
      bgUrl,
    },
  });

  return updatedCampaign;
};

// 3. קבלת כל המערכות כולל הדמויות
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

// 4. יצירת קמפיין חדש
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

// 5. עדכון סטטוס קמפיין
export const updateCampaignStatus = async (
  campaignId: string,
  status: string,
) => {
  const updated = await prisma.campaign.update({
    where: {
      id: campaignId,
    },

    data: {
      status,
    },

    include: {
      characters: true,
    },
  });

  return {
    ...updated,

    characters: updated.characters.map(formatDbCharacterToFrontend),
  };
};

// 6. מחיקת קמפיין
export const deleteCampaign = async (campaignId: string) => {
  await prisma.campaign.delete({
    where: {
      id: campaignId,
    },
  });
};

// 7. עדכון פרטי קמפיין
export const updateCampaign = async (
  campaignId: string,
  data: {
    title?: string;
    description?: string;
    bgUrl?: string;
    status?: string;
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

      ...(data.status !== undefined && {
        status: data.status,
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
