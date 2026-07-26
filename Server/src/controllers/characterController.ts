import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { fetchRawBeyondCharacter } from "../services/dndBeyondService.js";
import { formatDbCharacterToFrontend } from "../utils/characterParser.js";

interface BeyondParams {
  beyondId?: string;
  id?: string;
}

// 1. קריאת Live בלבד מול D&D Beyond (ללא שמירה ב-DB)
export const getBeyondCharacterLive = async (
  req: Request<BeyondParams>,
  res: Response
): Promise<Response> => {
  try {
    const beyondId = req.params.beyondId;

    if (!beyondId) {
      return res.status(400).json({ message: "beyondId is required" });
    }

    const liveCharacter = await fetchRawBeyondCharacter(beyondId);
    return res.status(200).json(liveCharacter);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to fetch live character", error: errorMessage });
  }
};

// 2. שמירה / סנכרון דמות מ-D&D Beyond ל-DB (כולל שיוך למערכה)
export const saveOrSyncBeyondCharacter = async (
  req: Request<BeyondParams>,
  res: Response
): Promise<Response> => {
  try {
    const beyondId = req.params.beyondId;
    const { campaignId } = req.body;

    if (!beyondId) {
      return res.status(400).json({ message: "beyondId is required" });
    }

    const parsed = await fetchRawBeyondCharacter(beyondId);

    const basePayload = {
      beyondId: parsed.beyondId,
      name: parsed.name,
      player: parsed.player || "Player",
      avatarUrl: parsed.avatarUrl,
      race: parsed.race,
      className: parsed.class,
      level: parsed.level,
      proficiencyBonus: parsed.proficiencyBonus,
      initiative: parsed.initiative,
      currentHp: parsed.hp.current,
      maxHp: parsed.hp.max,
      tempHp: parsed.hp.temp,
      armorClass: parsed.ac,
      speed: parsed.speed,
      stats: {
        stats: parsed.stats,
        passiveSkills: parsed.passiveSkills
      },
      equipment: parsed.inventory,
      spells: parsed.spells,
      features: parsed.features,
    };

    const savedCharacter = await prisma.character.upsert({
      where: { beyondId: String(beyondId) },
      update: {
        ...basePayload,
        ...(campaignId !== undefined ? { campaignId } : {})
      },
      create: {
        ...basePayload,
        campaignId: campaignId || null,
      },
    });

    const formattedCharacter = formatDbCharacterToFrontend(savedCharacter);

    return res.status(200).json({
      message: "Character successfully saved to Database",
      character: formattedCharacter
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error saving character to DB:", errorMessage);
    return res.status(500).json({ message: "Failed to save character to DB", error: errorMessage });
  }
};

// 3. קבלת כל הדמויות מ-DB
export const getAllCharacters = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const dbCharacters = await prisma.character.findMany();
    const formattedCharacters = dbCharacters.map(formatDbCharacterToFrontend);

    return res.status(200).json(formattedCharacters);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to fetch characters from DB", error: errorMessage });
  }
};

// 4. מחיקת דמות מ-DB לפי ID
export const deleteCharacter = async (req: Request<BeyondParams>, res: Response): Promise<Response> => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Character ID is required" });
    }

    await prisma.character.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Character deleted successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to delete character", error: errorMessage });
  }
};