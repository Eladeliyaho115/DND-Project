import { Request, Response } from "express";
import * as characterService from "../services/character/characterService.js";
import { prisma } from "../config/db.js";

interface BeyondParams {
  beyondId?: string;
  id?: string;
}

/**
 * GET /characters/beyond/:beyondId
 *
 * Get live character data from D&D Beyond, BUT overlay local HP if character exists in DB.
 */
export const getBeyondCharacterLive = async (
  req: Request<BeyondParams>,
  res: Response,
): Promise<Response> => {
  try {
    const beyondId = req.params.beyondId;

    if (!beyondId) {
      return res.status(400).json({
        message: "beyondId is required",
      });
    }

    // 1. קריאת הנתונים בלייב מ-D&D Beyond
    const character = await characterService.getBeyondCharacterLive(beyondId);

    // 2. בדיקה אם יש דמות כזו ב-DB המקומי כדי למשוך את ה-HP המעודכן שלה
    const dbCharacter = await prisma.character.findUnique({
      where: { beyondId: String(beyondId) },
    });

    // 3. אם יש דמות ב-DB, דורסים רק את ה-HP בלייב עם ה-HP מה-DB המקומי!
    if (dbCharacter) {
      // currentHp may be null in DB, so only override if it's a number
      character.hp.current = dbCharacter.currentHp ?? character.hp.current;
    }

    return res.status(200).json(character);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Error fetching live character:", errorMessage);

    return res.status(500).json({
      message: "Failed to fetch live character",
      error: errorMessage,
    });
  }
};

/**
 * POST /characters/beyond/:beyondId
 * Save or synchronize character from D&D Beyond into DB.
 */
export const saveOrSyncBeyondCharacter = async (
  req: Request<BeyondParams>,
  res: Response,
): Promise<Response> => {
  try {
    const beyondId = req.params.beyondId;
    const { campaignId } = req.body;

    if (!beyondId) {
      return res.status(400).json({
        message: "beyondId is required",
      });
    }

    const character = await characterService.saveOrSyncBeyondCharacter(
      beyondId,
      campaignId,
    );

    return res.status(200).json({
      message: "Character successfully saved to Database",
      character,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Error saving character to DB:", errorMessage);

    return res.status(500).json({
      message: "Failed to save character to DB",
      error: errorMessage,
    });
  }
};

/**
 * GET /characters
 * Get all characters from DB.
 */
export const getAllCharacters = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const characters = await characterService.getAllCharacters();
    return res.status(200).json(characters);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Error fetching characters:", errorMessage);

    return res.status(500).json({
      message: "Failed to fetch characters from DB",
      error: errorMessage,
    });
  }
};

/**
 * DELETE /characters/:id
 * Delete character from DB.
 */
export const deleteCharacter = async (
  req: Request<BeyondParams>,
  res: Response,
): Promise<Response> => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        message: "Character ID is required",
      });
    }

    await characterService.deleteCharacter(id);

    return res.status(200).json({
      message: "Character deleted successfully",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Error deleting character:", errorMessage);

    return res.status(500).json({
      message: "Failed to delete character",
      error: errorMessage,
    });
  }
};