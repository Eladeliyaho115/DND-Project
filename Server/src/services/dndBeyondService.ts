import axios from "axios";

export const fetchRawBeyondCharacter = async (beyondId: string) => {
  try {
    const response = await axios.get(
      `https://character-service.dndbeyond.com/character/v5/character/${beyondId}`,
    );

    const rawData = response.data?.data;

    if (!rawData) {
      throw new Error("Character data is missing from D&D Beyond response");
    }

    return rawData;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(
        `Character with ID ${beyondId} was not found on D&D Beyond`,
      );
    }

    throw error;
  }
};
