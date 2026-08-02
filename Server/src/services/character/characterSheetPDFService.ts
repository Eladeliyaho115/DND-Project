// backend/src/character/characterSheetPDFService.ts

import { prisma } from "../../config/db.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * מפרסר את ה-PDF בעזרת Gemini בעת ההעלאה ומחלץ את הטקסט המלא בצורה מדויקת
 */
async function parsePDFWithGeminiOnUpload(
  pdfBuffer: Buffer,
  characterName: string,
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBuffer.toString("base64"),
          },
        },
        {
          text: `Extract and structure the D&D character sheet data for "${characterName}".

STRICT FORMATTING & OPTIMIZATION RULES:
1. INCLUDE ALL CHARACTER-SPECIFIC DATA:
   - Core Stats & Modifiers (STR, DEX, CON, INT, WIS, CHA), HP, AC, Speed, Initiative, Proficiency Bonus.
   - ALL 18 Skills with exact numerical modifiers and proficiency indicators (Proficient / Expertise).
   - ALL Saving Throws and Passive Senses (Perception, Insight, Investigation).
   - Proficiencies (Armor, Weapons, Tools, Languages).
   - Weapon Attacks & Cantrips (Hit bonus, Damage, Properties).
   - COMPLETE Character Details, Personality Traits, Ideals, Bonds, Flaws, and Backstory (DO NOT shorten or truncate these).
   - Inventory items and currency.

2. OMIT ALL GENERIC RULEBOOK FLUFF (To keep context lean for AI DM):
   - DO NOT include lengthy rule definitions or textbook descriptions for Class Features, Species Traits, or Feats (e.g., do NOT explain what Sneak Attack or Skilled does, just list the feature name).
   - DO NOT include generic standard actions (e.g., Dash, Disengage, Dodge, Help).
   - DO NOT include book citations (e.g., PHB-2024 page numbers).
   - DO NOT include individual item weights or encumbrance thresholds.

Return the result as clean, dense plain text or Markdown.`,
        },
      ],
      config: {
        temperature: 0.0, // 🟢 0.0 מבטיח מקסימום נאמנות למקור ואפס יצירתיות/המצאות
      },
    });

    return response.text || "";
  } catch (err) {
    console.error(
      `❌ שגיאה ב-Gemini בעת העלאת דף דמות "${characterName}":`,
      err,
    );
    return "";
  }
}

export const upsertCharacterSheetPDF = async (
  campaignId: string,
  characterName: string,
  pdfBuffer: Buffer,
) => {
  const bytesData = new Uint8Array(pdfBuffer);

  console.log(
    `✨ מפעיל חילוץ טקסט מדויק (Raw Extraction) ב-Gemini עבור "${characterName}"...`,
  );
  const parsedContent = await parsePDFWithGeminiOnUpload(
    pdfBuffer,
    characterName,
  );

  return await prisma.characterSheet.upsert({
    where: {
      campaignId_name: {
        campaignId,
        name: characterName,
      },
    },
    update: {
      pdfData: bytesData,
      parsedContent,
    },
    create: {
      campaignId,
      name: characterName,
      pdfData: bytesData,
      parsedContent,
    },
  });
};

export const getCharacterSheetPDFsByCampaign = async (campaignId: string) => {
  return await prisma.characterSheet.findMany({
    where: { campaignId },
    select: {
      name: true,
      pdfData: true,
      parsedContent: true,
    },
  });
};
