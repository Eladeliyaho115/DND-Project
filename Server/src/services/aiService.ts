import { GoogleGenAI } from '@google/genai';
import { getCharacterSheetPDFsByCampaign } from './character/characterSheetPDFService.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ChatMessage {
  sender: 'user' | 'gemini';
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

  if (campaignId) {
    const characterSheets = await getCharacterSheetPDFsByCampaign(campaignId);
    console.log(`📑 מצאתי ${characterSheets.length} דפי דמות ב-DB עבור הקמפיין הזה.`);
    characterSheets.forEach((s) => console.log(`   <- דמות: ${s.name}, גודל PDF: ${s.pdfData.length} bytes`));
  } else {
    console.log("⚠️ אזהרה: campaignId הגיע כ-undefined או ריק!");
  }
  console.log("-----------------------------------------");




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
5. LANGUAGE:
   - Respond in the primary language the player addresses you in (Hebrew or English).
`;

  const contents: any[] = [];

  // 1. סינון והוספת היסטוריית השיחה (רק הודעות שאינן הודעת הפתיחה הדיפולטית)
  const validHistory = history.filter((msg) => msg.text !== "שלום! אני עוזר ה-D&D שלך. שאל אותי חוקים, בקש תיאורי סביבה, או מחולל רעיונות ל-NPCs בלייב!");
  const recentHistory = validHistory.slice(-10); // 10 הודעות אחרונות

  recentHistory.forEach((msg) => {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    });
  });

  // 2. הכנת חלק המשתמש הנוכחי (משלבים PDFים במידה וקיימים + הטקסט של המשתמש)
  const currentUserParts: any[] = [];

  if (campaignId) {
    const characterSheets = await getCharacterSheetPDFsByCampaign(campaignId);

    if (characterSheets.length > 0) {
      characterSheets.forEach((sheet) => {
        currentUserParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: Buffer.from(sheet.pdfData).toString('base64'),
          },
        });
        currentUserParts.push({
          text: `[System Context: Above is the attached character sheet PDF for "${sheet.name}"]`,
        });
      });
    }
  }

  // הוספת השאלה/פרומפט של המשתמש
  currentUserParts.push({ text: prompt });

  // דחיפת השאלה והקבלות להודעת המשתמש הנוכחית
  contents.push({
    role: 'user',
    parts: currentUserParts,
  });

  // 3. שליחה למודל הנתמך והעדכני gemini-3.6-flash
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text || 'לא התקבלה תשובה מ-Gemini.';
};