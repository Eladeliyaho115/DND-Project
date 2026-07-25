// backend/src/controllers/characterController.ts
import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import axios from "axios";

interface BeyondParams {
  beyondId: string;
}

// פונקציית תרגום מנתוני D&D Beyond לפרונט-אנד
const parseBeyondToFrontend = (rawData: any) => {
  const primaryClass = rawData.classes?.[0];
  const totalLevel: number =
    rawData.classes?.reduce(
      (acc: number, c: { level?: number }) => acc + (c.level || 0),
      0
    ) || 1;

  const baseHp = rawData.baseHitPoints || 10;
  const bonusHp = rawData.bonusHitPoints || 0;
  const overrideHp = rawData.overrideHitPoints;
  const calculatedMaxHp = overrideHp || (baseHp + bonusHp);
  const currentHp = calculatedMaxHp - (rawData.removedHitPoints || 0);

  // חילוץ ה-Stats
  const rawStats = rawData.stats || [];
  const getStatVal = (id: number) => rawStats.find((s: any) => s.id === id)?.value ?? 10;

  const stats = {
    str: getStatVal(1),
    dex: getStatVal(2),
    con: getStatVal(3),
    int: getStatVal(4),
    wis: getStatVal(5),
    cha: getStatVal(6),
  };

  const proficiencyBonus = Math.ceil(1 + totalLevel / 4);
  const wisMod = Math.floor((stats.wis - 10) / 2);
  const intMod = Math.floor((stats.int - 10) / 2);

  return {
    beyondId: String(rawData.id),
    dndCharacterId: String(rawData.id),
    name: rawData.name || "Unnamed Character",
    player: "לא הוגדר",
    class: primaryClass?.definition?.name || "Unknown Class",
    subclass: primaryClass?.subclassDefinition?.name || null,
    race: rawData.race?.fullName || rawData.race?.baseName || "Unknown Race",
    level: totalLevel,
    hp: {
      current: currentHp,
      max: calculatedMaxHp,
      temp: rawData.temporaryHitPoints || 0,
    },
    ac: rawData.overrideStats?.[0]?.value || 10,
    speed: rawData.race?.weightSpeeds?.normal?.walk || 30,
    initiative: Math.floor((stats.dex - 10) / 2),
    avatarUrl: rawData.decorations?.avatarUrl || rawData.avatarUrl || "",
    proficiencyBonus,
    passiveSkills: {
      perception: 10 + wisMod,
      investigation: 10 + intMod,
      insight: 10 + wisMod,
    },
    stats,
    inventory: rawData.inventory || [],
    spells: rawData.spells || {},
    rawBeyondStats: rawData.stats || [] // לשמירה ב-DB במידת הצורך
  };
};

// -------------------------------------------------------------------
// 1. קבלת נתונים בלייב מ-D&D Beyond (ללא שמירה/פנייה ל-DB!)
// -------------------------------------------------------------------
export const getBeyondCharacterLive = async (
  req: Request<BeyondParams>,
  res: Response
): Promise<Response> => {
  try {
    const { beyondId } = req.params;

    if (!beyondId) {
      return res.status(400).json({ message: "beyondId parameter is required" });
    }

    const response = await axios.get(
      `https://character-service.dndbeyond.com/character/v5/character/${beyondId}`
    );

    const rawData = response.data?.data;
    if (!rawData) {
      return res.status(404).json({ message: "Character not found on D&D Beyond" });
    }

    // המרה למבנה שהפרונט מבין והחזרה מיידית
    const liveCharacter = parseBeyondToFrontend(rawData);
    return res.status(200).json(liveCharacter);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching live character from Beyond:", errorMessage);
    return res.status(500).json({ message: "Failed to fetch live character data", error: errorMessage });
  }
};

// -------------------------------------------------------------------
// 2. שמירה / סנכרון ל-DB (לכפתור שמירה בסוף סשן או הוספת דמות)
// -------------------------------------------------------------------
export const saveOrSyncBeyondCharacter = async (
  req: Request<BeyondParams>,
  res: Response
): Promise<Response> => {
  try {
    const { beyondId } = req.params;

    if (!beyondId) {
      return res.status(400).json({ message: "beyondId parameter is required" });
    }

    // מושכים את המידע הטרי ביותר מ-Beyond
    const response = await axios.get(
      `https://character-service.dndbeyond.com/character/v5/character/${beyondId}`
    );

    const rawData = response.data?.data;
    if (!rawData) {
      return res.status(404).json({ message: "Character not found on D&D Beyond" });
    }

    const parsed = parseBeyondToFrontend(rawData);

    // מכינים אובייקט להכנסה/עדכון ב-Prisma DB
    const dbPayload = {
      beyondId: parsed.beyondId,
      name: parsed.name,
      avatarUrl: parsed.avatarUrl,
      race: parsed.race,
      className: parsed.class,
      subclass: parsed.subclass,
      level: parsed.level,
      currentHp: parsed.hp.current,
      maxHp: parsed.hp.max,
      tempHp: parsed.hp.temp,
      armorClass: parsed.ac,
      speed: parsed.speed,
      stats: {
        stats: parsed.rawBeyondStats,
      },
      equipment: parsed.inventory,
      spells: parsed.spells,
    };

    // Upsert: אם הדמות קיימת ב-DB יעדכן אותה, אם לא - ייצור חדשה
    const savedCharacter = await prisma.character.upsert({
      where: { beyondId: String(beyondId) },
      update: dbPayload,
      create: dbPayload,
    });

    console.log(`Character ${beyondId} successfully saved/updated in Database.`);
    return res.status(200).json({
      message: "Character successfully saved to Database",
      character: parsed
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error saving character to DB:", errorMessage);
    return res.status(500).json({ message: "Failed to save character to DB", error: errorMessage });
  }
};