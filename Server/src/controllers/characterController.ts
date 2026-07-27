// backend/src/controllers/characterController.ts

import { Request, Response } from "express";

import * as characterService from "../services/character/characterService.js";

interface BeyondParams {
  beyondId?: string;
  id?: string;
}

/**
 * GET /characters/beyond/:beyondId
 *
 * Get live character data from D&D Beyond.
 * Does not save anything to DB.
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

    const character = await characterService.getBeyondCharacterLive(beyondId);

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
 *
 * Save or synchronize character
 * from D&D Beyond into DB.
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
 *
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
 *
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
