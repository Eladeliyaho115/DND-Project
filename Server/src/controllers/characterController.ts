import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { fetchRawBeyondCharacter } from "../services/dndBeyondService.js";

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
    const beyondId = Array.isArray(req.params.beyondId)
      ? req.params.beyondId[0]
      : req.params.beyondId;

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
    const beyondId = Array.isArray(req.params.beyondId) 
      ? req.params.beyondId[0] 
      : req.params.beyondId;

    const { campaignId } = req.body;

    if (!beyondId) {
      return res.status(400).json({ message: "beyondId is required" });
    }

    // שואבים ומעבדים את הנתונים מ-D&D Beyond
    const parsed = await fetchRawBeyondCharacter(beyondId);

    // אובייקט הנתונים הבסיסי
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
      // בעדכון: מעדכנים את campaignId אך ורק אם משהו מפורש נשלח ב-body
      update: {
        ...basePayload,
        ...(campaignId !== undefined ? { campaignId } : {})
      },
      // ביצירה: מגדירים את ה-campaignId או שמים null אם עדיין אין קמפיין
      create: {
        ...basePayload,
        campaignId: campaignId || null,
      },
    });

    console.log(`Character ${beyondId} successfully saved to DB (Campaign: ${savedCharacter.campaignId || 'None'}).`);

    // חילוץ בטוח של ה-JSON שמאוחסן ב-DB
    const statsJson = (savedCharacter.stats as any) || {};

    // בניית האובייקט המדויק שהפרונט-אנד מצפה לקבל
    const formattedCharacter = {
      id: savedCharacter.id,
      beyondId: savedCharacter.beyondId,
      dndCharacterId: savedCharacter.beyondId,
      campaignId: savedCharacter.campaignId,
      name: savedCharacter.name,
      player: savedCharacter.player,
      class: savedCharacter.className,
      race: savedCharacter.race,
      level: savedCharacter.level,
      proficiencyBonus: savedCharacter.proficiencyBonus,
      initiative: savedCharacter.initiative,
      avatarUrl: savedCharacter.avatarUrl || "",
      hp: {
        current: savedCharacter.currentHp ?? 10,
        max: savedCharacter.maxHp ?? 10,
        temp: savedCharacter.tempHp ?? 0,
      },
      ac: savedCharacter.armorClass ?? 10,
      speed: savedCharacter.speed ?? 30,
      stats: statsJson.stats || {},
      passiveSkills: statsJson.passiveSkills || {},
      inventory: savedCharacter.equipment || [],
      spells: savedCharacter.spells || [],
      features: savedCharacter.features || [],
    };

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

    const formattedCharacters = dbCharacters.map((char: any) => {
      const statsJson = char.stats || {};
      
      return {
        id: char.id,
        beyondId: char.beyondId,
        dndCharacterId: char.beyondId,
        campaignId: char.campaignId,
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

    return res.status(200).json(formattedCharacters);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: "Failed to fetch characters from DB", error: errorMessage });
  }
};

// 4. מחיקת דמות מ-DB לפי ID
export const deleteCharacter = async (req: Request<BeyondParams>, res: Response): Promise<Response> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

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