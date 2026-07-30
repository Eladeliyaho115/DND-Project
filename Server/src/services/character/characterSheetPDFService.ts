// backend/src/character/characterSheetPDFService.ts

import { prisma } from "../../config/db.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * מפרסר את ה-PDF בעזרת Gemini בעת ההעלאה ומחלץ את הטקסט המלא בצורה מדויקת
 */
async function parsePDFWithGeminiOnUpload(pdfBuffer: Buffer, characterName: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBuffer.toString("base64"),
          },
        },
        {
          text: `Extract ALL readable text, attributes, numbers, features, inventory items, and spells from this D&D character sheet PDF for "${characterName}". 
DO NOT summarize or rewrite the information. Preserve exact names, numbers, values, and text details as printed on the sheet. Return the parsed information cleanly formatted as plain text.`,
        },
      ],
      config: {
        temperature: 0.0, // 🟢 0.0 מבטיח מקסימום נאמנות למקור ואפס יצירתיות/המצאות
      },
    });

    return response.text || "";
  } catch (err) {
    console.error(`❌ שגיאה ב-Gemini בעת העלאת דף דמות "${characterName}":`, err);
    return "";
  }
}

export const upsertCharacterSheetPDF = async (
  campaignId: string,
  characterName: string,
  pdfBuffer: Buffer
) => {
  const bytesData = new Uint8Array(pdfBuffer);

  console.log(`✨ מפעיל חילוץ טקסט מדויק (Raw Extraction) ב-Gemini עבור "${characterName}"...`);
  const parsedContent = await parsePDFWithGeminiOnUpload(pdfBuffer, characterName);

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