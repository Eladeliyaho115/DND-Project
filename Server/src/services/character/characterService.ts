// backend/src/services/character/characterService.ts

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
 * Save or synchronize a D&D Beyond character
 * into our database.
 */
export const saveOrSyncBeyondCharacter = async (
  beyondId: string,
  campaignId?: string,
) => {
  // 1. Get latest character data
  //    from D&D Beyond
  const rawCharacter = await fetchRawBeyondCharacter(beyondId);

  // 2. Parse D&D Beyond data
  //    into our application format
  const parsed = parseBeyondToFrontend(rawCharacter);

  // 3. Build database payload
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

      passiveSkills: parsed.passiveSkills,
    },

    equipment: parsed.inventory,

    spells: parsed.spells,

    features: parsed.features,
  };

  // 4. Save or update character
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

  // 5. Convert DB object
  //    to frontend object
  return formatDbCharacterToFrontend(savedCharacter);
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
    where: {
      id,
    },
  });
};
