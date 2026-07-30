import { GoogleGenAI, Type } from "@google/genai";
import Groq from "groq-sdk";
import { prisma } from "../../config/db.js";
import { getCharacterSheetPDFsByCampaign } from "../character/characterSheetPDFService.js";
import { getSummariesByCampaign } from "../ai/summaryService.js";

// אתחול SDKs
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ChatMessage {
  sender: "user" | "gemini";
  text: string;
}

export interface GameStateUpdates {
  hpChanges?: {
    characterName?: string;
    characterId?: string;
    changeAmount: number;
  }[];
  inCombat?: boolean;
  location?: string;
  currentObjective?: string;
}

export interface AIResponsePayload {
  internal_reasoning?: string;
  narrative: string;
  stateUpdates?: GameStateUpdates;
}

export interface CurrentGameState {
  location?: string;
  currentObjective?: string;
  inCombat?: boolean;
  [key: string]: any;
}

interface ChatOptions {
  prompt: string;
  history: ChatMessage[];
  campaignId?: string;
  gameState?: CurrentGameState;
}

const SYSTEM_INSTRUCTION = `
You are an expert Dungeon Master (DM) running a D&D 5e campaign using the updated 2024 Core Rules.

INTERNAL REASONING (Before responding):
1. Analyze player action and current location/scene state.
2. Determine applicable 2024 5e rules, DCs, or skill checks needed.
3. Plan environmental consequences without robbing player agency.

CORE RULES & BEHAVIOR:
1. IMMERSIVE STORYTELLING: Describe scenes dynamically and concisely (1-3 paragraphs). Use sensory details (lighting, sound, smell) to build atmosphere. Keep momentum high.
2. PLAYER AGENCY & FAIL FORWARD: Never make decisions, solve puzzles, or roll checks for the player. If a player fails a check, introduce a narrative complication or cost—never a dry dead-end.
3. DM GUIDANCE & TRANSPARENCY: Ask for rolls step-by-step before resolving outcomes (e.g., "Roll a DC 13 Wisdom (Perception) check"). Clearly state conditions, Advantage/Disadvantage, and mechanics when relevant.
4. ENGAGEMENT: End your narrative response with a direct prompt for action (e.g., "What do you do?" / "How do you respond?") and sometimes when relevant suggest alternative approaches.
5. CONTEXT AWARENESS: Carefully use provided extracted character data, past campaign logs, and current game state.
6. FLEXIBILITY ("Yes, and..."): Encourage player creativity. If they propose an unconventional idea, set an appropriate DC and ability check rather than blocking them.
7. COMBAT PACING: Keep combat turns punchy and tactical. Resolve actions incrementally, describe impact clearly, and keep track of cover and status effects.
8. LANGUAGE: Respond in the primary language the player addresses you in (Hebrew or English).

JSON OUTPUT REQUIREMENTS:
You MUST return a JSON object with this EXACT structure:
{
  "internal_reasoning": "Your analysis of rules, DCs, and player actions goes here...",
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

/**
 * 🧠 בניית הקונטקסט המבוסס שכבות (GameState + Master Summary + 2 Recent Summaries + Character Sheets)
 */
async function buildCampaignContext(
  campaignId?: string,
  gameState?: CurrentGameState
): Promise<string> {
  let contextText = "";

  // 1. זיכרון לטווח קצר - GameState ממוקד
  if (gameState) {
    contextText += `\n=== CURRENT GAME STATE ===\n${JSON.stringify(gameState, null, 2)}\n`;
  }

  if (!campaignId) return contextText;

  // 2. זיכרון לטווח ארוך - Master Campaign Summary
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { masterSummary: true },
    });

    if (campaign?.masterSummary) {
      contextText += `\n[LONG-TERM MEMORY - MASTER CAMPAIGN SUMMARY]:\n${campaign.masterSummary}\n`;
    }
  } catch (err) {
    console.error("❌ שגיאה בשליפת Master Summary:", err);
  }

  // 3. זיכרון לטווח בינוני - 2 סיכומים אחרונים
  try {
    const campaignSummaries = await getSummariesByCampaign(campaignId);
    const last2Summaries = campaignSummaries.slice(0, 2).reverse();

    for (const summary of last2Summaries) {
      const summaryText = summary.parsedContent || summary.content;
      if (summaryText) {
        contextText += `\n[MID-TERM MEMORY - RECENT SESSION SUMMARY]:\n${summaryText}\n`;
      }
    }
  } catch (err) {
    console.error("❌ שגיאה בשליפת סיכומי קמפיין:", err);
  }

  // 4. דפי דמות
  try {
    const characterSheets = await getCharacterSheetPDFsByCampaign(campaignId);
    for (const sheet of characterSheets) {
      if (sheet.parsedContent) {
        contextText += `\n[CHARACTER SHEET FOR "${sheet.name}"]:\n${sheet.parsedContent}\n`;
      }
    }
  } catch (err) {
    console.error("❌ שגיאה בשליפת דפי דמות:", err);
  }

  return contextText;
}

// הפונקציה הראשית
export const sendMessageToGemini = async (
  options: ChatOptions
): Promise<AIResponsePayload> => {
  const provider = process.env.AI_PROVIDER || "groq";

  console.log("-----------------------------------------");
  console.log(
    `📥 קיבלתי בקשת צ'אט חדשה! [Runtime Provider: ${provider.toUpperCase()}]`
  );

  if (provider === "groq") {
    try {
      return await sendMessageToGroqFast(options);
    } catch (err) {
      console.error(
        "⚠️ שגיאה ב-Groq API! עובר ל-Gemini Direct כ-Fallback...",
        err
      );
      return await sendMessageToGeminiDirect(options);
    }
  }

  return await sendMessageToGeminiDirect(options);
};

/**
 * ⚡ שליחה מהירה ל-Groq
 */
const sendMessageToGroqFast = async ({
  prompt,
  history,
  campaignId,
  gameState,
}: ChatOptions): Promise<AIResponsePayload> => {
  const contextText = await buildCampaignContext(campaignId, gameState);

  console.log(
    `📊 אורך הקונטקסט שנשלח ל-Groq (מתוך DB + State): ${contextText.length} תווים.`
  );

  const messages: any[] = [{ role: "system", content: SYSTEM_INSTRUCTION }];

  const recentHistory = history.slice(-20);

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

  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3.6-27b",
    messages: messages,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  console.log("🤖 Active Model Used:", completion.model);

  const responseText = completion.choices[0]?.message?.content || "{}";
  return JSON.parse(responseText) as AIResponsePayload;
};

/**
 * Fallback ל-Gemini Direct
 */
const sendMessageToGeminiDirect = async ({
  prompt,
  history,
  campaignId,
  gameState,
}: ChatOptions): Promise<AIResponsePayload> => {
  const contextText = await buildCampaignContext(campaignId, gameState);

  const contents: any[] = [];
  const recentHistory = history.slice(-20);

  recentHistory.forEach((msg) => {
    contents.push({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    });
  });

  const finalUserPrompt = contextText
    ? `=== CONTEXT DATA ===\n${contextText}\n=== PLAYER ACTION / QUESTION ===\n${prompt}`
    : prompt;

  contents.push({
    role: "user",
    parts: [{ text: finalUserPrompt }],
  });

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
          internal_reasoning: { type: Type.STRING },
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