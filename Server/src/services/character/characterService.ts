import { prisma } from "../../config/db.js";
import { fetchRawBeyondCharacter } from "../dndBeyondService.js";
import { parseBeyondToFrontend } from "./characterParser.js";
import { formatDbCharacterToFrontend } from "./characterMapper.js";

/**
 * Get a character directly from D&D Beyond.
 * Nothing is saved to the database.
 */
export const getBeyondCharacterLive = async (beyondId: string) => {
  const rawCharacter = await fetchRawBeyondCharacter(beyondId);
  return parseBeyondToFrontend(rawCharacter);
};

/**
 * Save or synchronize a D&D Beyond character into our database.
 * Preserves local HP changes made during gameplay by AI/DM!
 */
export const saveOrSyncBeyondCharacter = async (
  beyondId: string,
  campaignId?: string,
) => {
  // 1. קריאת הנתונים העדכניים מ-D&D Beyond
  const rawCharacter = await fetchRawBeyondCharacter(beyondId);
  const parsed = parseBeyondToFrontend(rawCharacter);

  // 2. בדיקה אם הדמות כבר קיימת אצלנו ב-DB
  const existingCharacter = await prisma.character.findUnique({
    where: { beyondId: String(beyondId) },
  });

  // 3. הגדרה מחדש של ה-HP: אם הדמות קיימת ב-DB, נשמור על ה-HP המקומי שלה!
  // (אלא אם כן זו יצירה ראשונית של הדמות)
  const currentHpToSave = existingCharacter 
    ? existingCharacter.currentHp 
    : parsed.hp.current;

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
    currentHp: currentHpToSave, // 🛡️ מוגן מדריסה!
    maxHp: parsed.hp.max,
    tempHp: parsed.hp.temp,
    armorClass: parsed.ac,
    speed: parsed.speed,
    stats: {
      stats: parsed.stats,
      passiveSkills: parsed.passiveSkills,
    },
    equipment: parsed.inventory,
    spells: parsed.spells,
    features: parsed.features,
  };

  // 4. שמירה/עדכון ב-DB
  const savedCharacter = await prisma.character.upsert({
    where: {
      beyondId: String(beyondId),
    },
    update: {
      ...basePayload,
      ...(campaignId !== undefined ? { campaignId } : {}),
    },
    create: {
      ...basePayload,
      campaignId: campaignId || null,
    },
  });

  return formatDbCharacterToFrontend(savedCharacter);
};

/**
 * Update HP for a character (e.g. from AI damage or healing)
 */
export const updateCharacterHp = async (
  characterIdOrName: string,
  changeAmount: number,
  campaignId?: string
) => {
  const character = await prisma.character.findFirst({
    where: {
      OR: [
        { id: characterIdOrName },
        { beyondId: characterIdOrName },
        { name: { contains: characterIdOrName, mode: "insensitive" } },
      ],
      ...(campaignId ? { campaignId } : {}),
    },
  });

  if (!character) {
    console.warn(`[updateCharacterHp] Character "${characterIdOrName}" not found in DB.`);
    return null;
  }

  const newHp = Math.min(
    character.maxHp || 0,
    Math.max(0, (character.currentHp || 0) + changeAmount)
  );

  console.log(`[updateCharacterHp] Updating ${character.name}'s HP: ${character.currentHp} -> ${newHp} (${changeAmount})`);

  const updated = await prisma.character.update({
    where: { id: character.id },
    data: { currentHp: newHp },
  });

  return formatDbCharacterToFrontend(updated);
};

/**
 * Get all characters stored in DB.
 */
export const getAllCharacters = async () => {
  const dbCharacters = await prisma.character.findMany();
  return dbCharacters.map(formatDbCharacterToFrontend);
};

/**
 * Delete a character from DB.
 */
export const deleteCharacter = async (id: string) => {
  await prisma.character.delete({
    where: { id },
  });
};