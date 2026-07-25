import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are an immersive, creative, and epic Dungeon Master (DM) for a D&D 5e campaign.
- Do NOT act as a rulebook assistant or answer rules questions out-of-character unless explicitly asked.
- Describe scenes, environments, soundscapes, and NPC reactions in rich detail.
- Prompt players for their actions and roll requests (e.g., "Roll an Perception check").
- Adapt to players' actions dynamically and maintain the narrative atmosphere.
- Respond in the language the player speaks to you (Hebrew or English).
`;

export interface ChatMessage {
  sender: "user" | "gemini";
  text: string;
}

export const sendMessageToGemini = async (
  prompt: string,
  history: ChatMessage[],
): Promise<string> => {
  try {
    // בניית היסטוריית השיחה
    const contents = history.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // הוספת ההודעה הנוכחית של המשתמש
    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    // שימוש במודל gemini-2.0-flash או gemini-1.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "לא התקבלה תשובה מ-Gemini.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
