import { GoogleGenAI } from "@google/genai";
import { getCharacterSheetPDFsByCampaign } from "../character/characterSheetPDFService.js";
import { getSummariesByCampaign } from "./summaryService.js"; // 👈 ייבוא לשליפת הסיכומים
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ChatMessage {
  sender: "user" | "gemini";
  text: string;
}

interface ChatOptions {
  prompt: string;
  history: ChatMessage[];
  campaignId?: string;
}

export const sendMessageToGemini = async ({
  prompt,
  history,
  campaignId,
}: ChatOptions): Promise<string> => {
  console.log("-----------------------------------------");
  console.log("📥 קיבלתי בקשת צ'אט חדשה!");
  console.log("🆔 campaignId שהתקבל מהפרונט:", campaignId);

  const systemInstruction = `
You are an expert, highly creative, and engaging Dungeon Master (DM) running a D&D 5e campaign using the updated 2024 Core Rules.

YOUR RESPONSIBILITIES & BEHAVIOR:
1. RULE EXPERT (2024 5e): You follow and apply D&D 5e 2024 rules mechanics accurately.
2. BEGINNER GUIDANCE:
   - If a player takes an action requiring mechanics (combat, skill checks, spells), guide them step-by-step.
3. STORYTELLING & IMMERSION:
   - Provide rich descriptions.
   - Always end with a prompt: "What do you do?"
4. CHARACTER SHEET AWARENESS:
   - Carefully analyze all attached PDF character sheets. Use exact stats, HP, AC, traits, and spells from them.
5. CAMPAIGN HISTORY & SUMMARIES AWARENESS:
   - You have access to attached campaign summaries and session logs. Always refer to past events, choices, NPCs, and lore from these summaries to maintain seamless continuity.
6. LANGUAGE:
   - Respond in the primary language the player addresses you in (Hebrew or English).
`;

  const contents: any[] = [];

  // 1. סינון והוספת היסטוריית השיחה (20 הודעות אחרונות)
  const validHistory = history.filter(
    (msg) =>
      msg.text !==
      "שלום! אני עוזר ה-D&D שלך. שאל אותי חוקים, בקש תיאורי סביבה, או מחולל רעיונות ל-NPCs בלייב!",
  );
  const recentHistory = validHistory.slice(-20);

  recentHistory.forEach((msg) => {
    contents.push({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    });
  });

  // 2. הכנת חלק המשתמש הנוכחי
  const currentUserParts: any[] = [];

  // נצרף דפי דמות וסיכומים רק בתחילת שיחה כדי לחסוך ב-Tokens
  const isEarlySession = recentHistory.length <= 2;

  if (campaignId && isEarlySession) {
    // ----------------------------------------------------------------------
    //  א. צירוף דפי דמות (PDF)
    // ----------------------------------------------------------------------
    const characterSheets = await getCharacterSheetPDFsByCampaign(campaignId);

    if (characterSheets.length > 0) {
      console.log(`📑 מצרף ${characterSheets.length} דפי דמות PDF לקונטקסט של Gemini.`);
      characterSheets.forEach((sheet) => {
        currentUserParts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: Buffer.from(sheet.pdfData).toString("base64"),
          },
        });
        currentUserParts.push({
          text: `[System Context: Above is the attached character sheet PDF for "${sheet.name}"]`,
        });
      });
    }

    // ----------------------------------------------------------------------
    //  ב. צירוף סיכומי קמפיין (טקסט ו-PDF מתוך DB/דיסק)
    // ----------------------------------------------------------------------
    const campaignSummaries = await getSummariesByCampaign(campaignId);

    if (campaignSummaries.length > 0) {
      console.log(`📜 מצרף ${campaignSummaries.length} סיכומי קמפיין לקונטקסט של Gemini.`);

      for (const summary of campaignSummaries) {
        // אם יש תוכן טקסטואלי לסיכום
        if (summary.content) {
          currentUserParts.push({
            text: `[System Context: Campaign Summary Log (${summary.createdAt.toLocaleDateString()}): ${summary.content}]`,
          });
        }

        // אם יש קובץ PDF מצורף לסיכום (Base64 או נתיב לדיסק local/uploads)
        if (summary.pdfUrl) {
          try {
            let pdfBuffer: Buffer | null = null;

            if (summary.pdfUrl.startsWith("data:application/pdf;base64,")) {
              // PDF השמור ב-Base64 ב-DB
              const base64Data = summary.pdfUrl.replace(/^data:application\/pdf;base64,/, "");
              pdfBuffer = Buffer.from(base64Data, "base64");
            } else if (summary.pdfUrl.startsWith("/uploads/")) {
              // PDF השמור בתיקיית ה-uploads בשרת
              const filePath = path.join(process.cwd(), summary.pdfUrl);
              if (fs.existsSync(filePath)) {
                pdfBuffer = fs.readFileSync(filePath);
              }
            }

            if (pdfBuffer) {
              currentUserParts.push({
                inlineData: {
                  mimeType: "application/pdf",
                  data: pdfBuffer.toString("base64"),
                },
              });
              currentUserParts.push({
                text: `[System Context: Above is an attached campaign summary PDF from ${summary.createdAt.toLocaleDateString()}]`,
              });
            }
          } catch (fileErr) {
            console.error("Failed to process summary PDF for Gemini:", fileErr);
          }
        }
      }
    }
  }

  // הוספת הפרומפט הנוכחי של המשתמש
  currentUserParts.push({ text: prompt });

  contents.push({
    role: "user",
    parts: currentUserParts,
  });

  // 3. שליחה למודל gemini-3.5-flash-lite
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text || "לא התקבלה תשובה מ-Gemini.";
};