// backend/src/services/dndBeyondService.ts
import axios from "axios";
import { parseBeyondToFrontend } from "../utils/characterParser.js";

export const fetchRawBeyondCharacter = async (beyondId: string) => {
  const response = await axios.get(
    `https://character-service.dndbeyond.com/character/v5/character/${beyondId}`
  );

  const rawData = response.data?.data;
  if (!rawData) {
    throw new Error("Character not found on D&D Beyond");
  }

  return parseBeyondToFrontend(rawData);
};