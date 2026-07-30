import { Request, Response } from "express";
import { sendMessageToGemini } from "../../services/ai/aiService.js";
import { 
  saveMessage, 
  getMessageCountBySession, 
  createChatSession,
  getSessionsByCampaign,
  getMessagesBySession,
  deleteChatSession
} from "../../services/ai/chatService.js";
import { generateAISummary } from "../../services/ai/summaryService.js";
import { updateCharacterHp } from "../../services/character/characterService.js";

interface AIChatRequestBody {
  prompt: string;
  history?: { sender: 'user' | 'gemini'; text: string }[];
  campaignId?: string;
  sessionId?: string;
  characterId?: string;
}

// 1. טיפול בשליחת הודעה בצ'אט, עדכון ה-DB ושמירתה
export const handleAIChat = async (req: Request<{}, {}, AIChatRequestBody>, res: Response) => {
  try {
    const { prompt, history, campaignId, sessionId, characterId } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "חובה לספק prompt תקין." });
    }

    if (history && !Array.isArray(history)) {
      return res.status(400).json({ error: "history חייב להיות מערך." });
    }

    let activeSessionId = sessionId;

    // במידה ולא נשלח sessionId אך יש campaignId, ניצור שיחה חדשה אוטומטית
    if (!activeSessionId && campaignId) {
      const titleSnippet = prompt.length > 30 ? prompt.slice(0, 30) + "..." : prompt;
      const newSession = await createChatSession(campaignId, titleSnippet);
      activeSessionId = newSession.id;
    }

    // שמירת הודעת המשתמש ב-DB (במידה ויש סשן פעיל)
    if (activeSessionId) {
      await saveMessage(activeSessionId, 'user', prompt);
    }

    // שליחת הבקשה למודל Gemini לקבלת תשובה מובנית
    const aiResponsePayload = await sendMessageToGemini({
      prompt,
      history: history || [],
      campaignId,
    });

    const replyText = aiResponsePayload.narrative;
    const stateUpdates = aiResponsePayload.stateUpdates;

    // 🔄 עיבוד עדכוני Game State (כמו HP) במידה והיו
    if (stateUpdates?.hpChanges && stateUpdates.hpChanges.length > 0) {
      for (const hpUpdate of stateUpdates.hpChanges) {
        const targetIdOrName = hpUpdate.characterId || hpUpdate.characterName || characterId;
        if (targetIdOrName && hpUpdate.changeAmount !== 0) {
          await updateCharacterHp(targetIdOrName, hpUpdate.changeAmount, campaignId);
        }
      }
    }

    // שמירת תשובת ה-AI ב-DB ובדיקת טריגר לסיכום אוטומטי
    if (activeSessionId) {
      await saveMessage(activeSessionId, 'gemini', replyText);

      // בדיקה: האם נצברו כפולות של 30 הודעות בשיחה הזו?
      const messageCount = await getMessageCountBySession(activeSessionId);
      if (campaignId && messageCount > 0 && messageCount % 30 === 0) {
        console.log(`🤖 מפעיל סיכום אוטומטי לאחר ${messageCount} הודעות בשיחה ${activeSessionId}...`);
        
        generateAISummary(campaignId, history || [], 'AUTO').catch((err) =>
          console.error("שגיאה ביצירת סיכום אוטומטי:", err)
        );
      }
    }

    return res.json({ 
      text: replyText,
      sessionId: activeSessionId,
      characterId,
      stateUpdates: stateUpdates || null
    });

  } catch (error) {
    console.error("Error in handleAIChat controller:", error);
    return res.status(500).json({ error: "שגיאה בעיבוד בקשת ה-AI בשרת." });
  }
};

// 2. יצירת סשן שיחה חדש
export const handleCreateSession = async (req: Request, res: Response) => {
  try {
    const { campaignId, title } = req.body as { campaignId: string; title?: string };
    if (!campaignId) {
      return res.status(400).json({ error: "campaignId is required" });
    }
    const session = await createChatSession(campaignId, title);
    return res.status(201).json(session);
  } catch (error) {
    console.error("Error in handleCreateSession:", error);
    return res.status(500).json({ error: "שגיאה ביצירת שיחה חדשה." });
  }
};

// 3. שליפת כל השיחות המשויכות לקמפיין
export const handleGetSessions = async (req: Request<{ campaignId: string }>, res: Response) => {
  try {
    const { campaignId } = req.params;
    if (!campaignId) {
      return res.status(400).json({ error: "campaignId parameter is required" });
    }
    const sessions = await getSessionsByCampaign(campaignId);
    return res.json(sessions);
  } catch (error) {
    console.error("Error in handleGetSessions:", error);
    return res.status(500).json({ error: "שגיאה בשליפת השיחות." });
  }
};

// 4. שליפת כל ההודעות של שיחה ספציפית
export const handleGetSessionMessages = async (req: Request<{ sessionId: string }>, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId parameter is required" });
    }
    const messages = await getMessagesBySession(sessionId);
    return res.json(messages);
  } catch (error) {
    console.error("Error in handleGetSessionMessages:", error);
    return res.status(500).json({ error: "שגיאה בשליפת הודעות השיחה." });
  }
};

// 5. מחיקת שיחה
export const handleDeleteSession = async (req: Request<{ sessionId: string }>, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId parameter is required" });
    }
    await deleteChatSession(sessionId);
    return res.json({ success: true, message: "השיחה נמחקה בהצלחה." });
  } catch (error) {
    console.error("Error handleDeleteSession:", error);
    return res.status(500).json({ error: "שגיאה במחיקת השיחה." });
  }
};