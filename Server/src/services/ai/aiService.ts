import { GoogleGenAI, Type } from "@google/genai";
import Groq from "groq-sdk";
import { getCharacterSheetPDFsByCampaign } from "../character/characterSheetPDFService.js";
import { getSummariesByCampaign } from "./summaryService.js";

// אתחול SDKs
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ChatMessage {
  sender: "user" | "gemini";
  text: string;
}

export interface GameStateUpdates {
  hpChanges?: { characterName?: string; characterId?: string; changeAmount: number }[];
  inCombat?: boolean;
  location?: string;
  currentObjective?: string;
}

export interface AIResponsePayload {
  narrative: string;
  stateUpdates?: GameStateUpdates;
}

interface ChatOptions {
  prompt: string;
  history: ChatMessage[];
  campaignId?: string;
}

const SYSTEM_INSTRUCTION = `
You are an expert Dungeon Master (DM) running a D&D 5e campaign using the updated 2024 Core Rules.

INTERNAL REASONING (Before responding):
1. Analyze player action and current location/scene state.
2. Determine applicable 2024 5e rules, DCs, or skill checks needed.
3. Plan environmental consequences without robbing player agency.

CORE RULES & BEHAVIOR:
1. IMMERSIVE STORYTELLING: Describe scenes dynamically and concisely (1-3 paragraphs). Keep the momentum high.
2. DM GUIDANCE: Guide players step-by-step when rolls, spells, or mechanics are needed (e.g., "Roll a DC 13 Wisdom (Perception) check").
3. ENGAGEMENT: Always end your narrative response with a direct prompt for action (e.g., "What do you do?" / "How do you respond?").
4. CONTEXT AWARENESS: Carefully use provided extracted character data and past campaign logs.
5. LANGUAGE: Respond in the primary language the player addresses you in (Hebrew or English).

JSON OUTPUT REQUIREMENTS:
You MUST return a JSON object with this EXACT structure:
{
  "narrative": "Story text here...",
  "stateUpdates": {
    "hpChanges": [{"characterName": "Name", "changeAmount": -5}],
    "inCombat": true/false,
    "location": "Location Name",
    "currentObjective": "Objective text"
  }
}
If an event causes damage/healing, populate hpChanges with negative (damage) or positive (healing) numbers.
`;

// הפונקציה הראשית
export const sendMessageToGemini = async (options: ChatOptions): Promise<AIResponsePayload> => {
  const provider = process.env.AI_PROVIDER || "groq";

  console.log("-----------------------------------------");
  console.log(`📥 קיבלתי בקשת צ'אט חדשה! [Runtime Provider: ${provider.toUpperCase()}]`);

  if (provider === "groq") {
    try {
      return await sendMessageToGroqFast(options);
    } catch (err) {
      console.error("⚠️ שגיאה ב-Groq API! עובר ל-Gemini Direct כ-Fallback...", err);
      return await sendMessageToGeminiDirect(options);
    }
  }

  return await sendMessageToGeminiDirect(options);
};

/**
 * ⚡ שליחה מהירה ל-Groq: שולף את המידע שמוכן ב-DB מבלי להמתין ל-Gemini!
 */
const sendMessageToGroqFast = async ({ prompt, history, campaignId }: ChatOptions): Promise<AIResponsePayload> => {
  let contextText = "";

  if (campaignId) {
    // 1. שליפה מהירה של דפי הדמות מה-DB
    try {
      const characterSheets = await getCharacterSheetPDFsByCampaign(campaignId);
      for (const sheet of characterSheets) {
        if (sheet.parsedContent) {
          contextText += `\n[PARSED CHARACTER SHEET FOR "${sheet.name}"]:\n${sheet.parsedContent}\n`;
        }
      }
    } catch (err) {
      console.error("❌ שגיאה בשליפת דפי דמות מה-DB:", err);
    }

    // 2. שליפה מהירה של סיכומי קמפיין מה-DB
    try {
      const campaignSummaries = await getSummariesByCampaign(campaignId);
      const chronologicalSummaries = [...campaignSummaries].reverse();

      for (const summary of chronologicalSummaries) {
        if (summary.parsedContent) {
          contextText += `\n[CAMPAIGN MEMORY]: ${summary.parsedContent}\n`;
        } else if (summary.content) {
          contextText += `\n[CAMPAIGN MEMORY]: ${summary.content}\n`;
        }
      }
    } catch (err) {
      console.error("❌ שגיאה בשליפת סיכומי קמפיין מה-DB:", err);
    }
  }

  console.log(`📊 אורך הקונטקסט שנשלח ל-Groq (מתוך DB): ${contextText.length} תווים.`);

  const messages: any[] = [{ role: "system", content: SYSTEM_INSTRUCTION }];

  const validHistory = history.filter(
    (msg) => msg.text !== "שלום! אני עוזר ה-D&D שלך. שאל אותי חוקים, בקש תיאורי סביבה, או מחולל רעיונות ל-NPCs בלייב!"
  );
  const recentHistory = validHistory.slice(-20);

  recentHistory.forEach((msg) => {
    messages.push({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    });
  });

  const finalUserPrompt = contextText 
    ? `=== CONTEXT DATA ===\n${contextText}\n=== PLAYER ACTION / QUESTION ===\n${prompt}`
    : prompt;

  messages.push({ role: "user", content: finalUserPrompt });

  // הרצה סופר מהירה ב-Groq
  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3.6-27b",
    messages: messages,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });
  // 🎯 הדפסת המודל שהתקבל בפועל מ-Groq
console.log('🤖 Active Model Used:', completion.model);

  const responseText = completion.choices[0]?.message?.content || "{}";
  return JSON.parse(responseText) as AIResponsePayload;
};

/**
 * Fallback ל-Gemini Direct במידה ו-Groq נכשל
 */
const sendMessageToGeminiDirect = async ({ prompt, history, campaignId }: ChatOptions): Promise<AIResponsePayload> => {
  const contents: any[] = [];

  const validHistory = history.filter(
    (msg) => msg.text !== "שלום! אני עוזר ה-D&D שלך. שאל אותי חוקים, בקש תיאורי סביבה, או מחולל רעיונות ל-NPCs בלייב!"
  );
  const recentHistory = validHistory.slice(-20);

  recentHistory.forEach((msg) => {
    contents.push({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    });
  });

  const currentUserParts: any[] = [];

  if (campaignId) {
    try {
      const characterSheets = await getCharacterSheetPDFsByCampaign(campaignId);
      characterSheets.forEach((sheet) => {
        if (sheet.parsedContent) {
          currentUserParts.push({ text: `[CHARACTER SHEET "${sheet.name}"]: ${sheet.parsedContent}` });
        }
      });
    } catch (err) {
      console.error("Error fetching character sheets for Gemini fallback:", err);
    }
  }

  currentUserParts.push({ text: prompt });
  contents.push({ role: "user", parts: currentUserParts });

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          narrative: { type: Type.STRING },
          stateUpdates: {
            type: Type.OBJECT,
            properties: {
              hpChanges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    characterName: { type: Type.STRING },
                    characterId: { type: Type.STRING },
                    changeAmount: { type: Type.NUMBER },
                  },
                  required: ["changeAmount"],
                },
              },
              inCombat: { type: Type.BOOLEAN },
              location: { type: Type.STRING },
              currentObjective: { type: Type.STRING },
            },
          },
        },
        required: ["narrative"],
      },
    },
  });

  const responseText = response.text || "{}";
  return JSON.parse(responseText) as AIResponsePayload;
};