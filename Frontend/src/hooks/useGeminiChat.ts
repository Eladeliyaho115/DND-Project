import { useState, useRef, useEffect, useCallback } from "react";
import {
  sendMessageToGemini,
  fetchCampaignSessions,
  fetchSessionMessages,
  createNewSession,
  deleteSession,
  type ChatMessage,
  type ChatSession,
} from "../services/geminiService";
import { generateAISummary } from "../services/summaryService";

const INITIAL_MESSAGE: ChatMessage = {
  sender: "gemini",
  text: "שלום! אני עוזר ה-D&D שלך. שאל אותי חוקים, בקש תיאורי סביבה, או מחולל רעיונות ל-NPCs בלייב!",
};

export const useGeminiChat = (campaignId?: string) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // גלילה אוטומטית לתחתית השיחה בכל עדכון
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // שליפת כל השיחות של הקמפיין בלחיצה/טעינה
  const loadSessions = useCallback(async () => {
    if (!campaignId) return;
    try {
      const fetchedSessions = await fetchCampaignSessions(campaignId);
      setSessions(fetchedSessions);

      // אם יש שיחות ועדיין לא נבחרה שיחה, נפתח את השיחה הראשונה/האחרונה
      if (fetchedSessions.length > 0 && !currentSessionId) {
        selectSession(fetchedSessions[0].id);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  }, [campaignId, currentSessionId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // טעינת הודעות עבור שיחה נבחרת מה-DB
  const selectSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setLoading(true);
    try {
      const fetchedMessages = await fetchSessionMessages(sessionId);
      if (fetchedMessages.length > 0) {
        setMessages(fetchedMessages);
      } else {
        setMessages([INITIAL_MESSAGE]);
      }
    } catch (err) {
      console.error("Failed to fetch session messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // יצירת שיחה חדשה
  const handleCreateNewSession = async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const newSession = await createNewSession(campaignId, "שיחה חדשה");
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([INITIAL_MESSAGE]);
    } catch (err) {
      console.error("Failed to create new session:", err);
    } finally {
      setLoading(false);
    }
  };

  // מחיקת שיחה
  const handleDeleteSession = async (
    sessionId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!window.confirm("האם למחוק את השיחה?")) return;

    try {
      await deleteSession(sessionId);
      const updatedSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(updatedSessions);

      if (currentSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          selectSession(updatedSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([INITIAL_MESSAGE]);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // שליחת הודעה בצ'אט
  const sendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    if (!customPrompt) setInput("");

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { sender: "user", text: userMsg },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // 1. סינון הודעת הפתיחה הדיפולטית
      const cleanHistory = updatedMessages
        .slice(0, -1)
        .filter((m) => m.text !== INITIAL_MESSAGE.text);

      // 2. הגבלה ל-20 ההודעות האחרונות בלבד עבור היקף טוקנים אופטימלי ומהירות
      const recentHistory = cleanHistory.slice(-20);

      const res = await sendMessageToGemini(
        userMsg,
        recentHistory,
        campaignId,
        currentSessionId || undefined,
      );

      // עדכון ה-sessionId במידה ונוצר כעת סשן חדש בלייב בשרת
      if (!currentSessionId && res.sessionId) {
        setCurrentSessionId(res.sessionId);
        loadSessions();
      }

      const finalMessages = [
        ...updatedMessages,
        { sender: "gemini" as const, text: res.text },
      ];
      setMessages(finalMessages);
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "gemini",
          text: "⚠️ אירעה שגיאה בחיבור לשרת. וודא שהשרת רץ וזמין.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // סיכום יזום ל-PDF בלחיצת כפתור
  const triggerManualAISummary = async () => {
    if (!campaignId) {
      alert("לא ניתן להפיק סיכום ללא campaignId מוגדר.");
      return;
    }

    setLoading(true);
    try {
      const historyToSend = messages.filter(
        (m) => m.text !== INITIAL_MESSAGE.text,
      );

      const data = await generateAISummary(
        campaignId,
        historyToSend,
        "ON_DEMAND",
      );

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "gemini",
            text: "📜 נוצר סיכום קמפיין חדש בהצלחה ונשמר כ-PDF במסד הנתונים!",
          },
        ]);
      }
    } catch (err) {
      console.error("Error generating manual AI summary:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "gemini",
          text: "⚠️ לא ניתן היה להפיק סיכום כעת. נסה שנית מאוחר יותר.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    sessions,
    currentSessionId,
    selectSession,
    handleCreateNewSession,
    handleDeleteSession,
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    triggerManualAISummary,
    messagesEndRef,
  };
};
