import { Request, Response } from "express";
import { prisma } from "../config/db.js";

// הגדרת interface עבור פרמטר ה-ID
interface CampaignParams {
  id: string;
}

// 1. קבלת מערכה לפי ID כולל כל הדמויות המשויכות
export const getCampaignById = async (
  req: Request<CampaignParams>,
  res: Response
): Promise<Response> => {
  try {
    const campaignId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

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

    // מיפוי נתוני הדמויות מפורמט ה-DB לפורמט ה-Frontend
    const formattedCharacters = (campaign.characters || []).map((char: any) => {
      const statsJson = char.stats || {};

      return {
        id: char.id,
        beyondId: char.beyondId,
        dndCharacterId: char.beyondId,
        name: char.name,
        player: char.player,
        class: char.className,
        race: char.race,
        level: char.level,
        proficiencyBonus: char.proficiencyBonus,
        initiative: char.initiative,
        avatarUrl: char.avatarUrl || "",
        hp: {
          current: char.currentHp ?? 10,
          max: char.maxHp ?? 10,
          temp: char.tempHp ?? 0,
        },
        ac: char.armorClass ?? 10,
        speed: char.speed ?? 30,
        stats: statsJson.stats || {},
        passiveSkills: statsJson.passiveSkills || {},
        inventory: char.equipment || [],
        spells: char.spells || [],
        features: char.features || [],
      };
    });

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
    const campaignId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
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
      characters: (campaign.characters || []).map((char: any) => {
        const statsJson = char.stats || {};
        return {
          id: char.id,
          beyondId: char.beyondId,
          dndCharacterId: char.beyondId,
          name: char.name,
          player: char.player,
          class: char.className,
          race: char.race,
          level: char.level,
          proficiencyBonus: char.proficiencyBonus,
          initiative: char.initiative,
          avatarUrl: char.avatarUrl || "",
          hp: {
            current: char.currentHp ?? 10,
            max: char.maxHp ?? 10,
            temp: char.tempHp ?? 0,
          },
          ac: char.armorClass ?? 10,
          speed: char.speed ?? 30,
          stats: statsJson.stats || {},
          passiveSkills: statsJson.passiveSkills || {},
          inventory: char.equipment || [],
          spells: char.spells || [],
          features: char.features || [],
        };
      }),
    }));

    return res.status(200).json(formattedCampaigns);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to fetch campaigns", error: errorMessage });
  }
};