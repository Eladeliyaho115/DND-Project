import { useState, useRef, useEffect, useCallback } from "react";
import {
  sendMessageToGemini,
  fetchCampaignSessions,
  fetchSessionMessages,
  createNewSession,
  deleteSession,
  updateSessionTitle,
  updateSessionMessages,
  type ChatMessage,
  type ChatSession,
  type StateUpdates,
} from "../services/geminiService";
import { generateAISummary } from "../services/summaryService";

const INITIAL_MESSAGE: ChatMessage = {
  sender: "gemini",
  text: "שלום! אני עוזר ה-D&D שלך. שאל אותי חוקים, בקש תיאורי סביבה, או מחולל רעיונות ל-NPCs בלייב!",
};

export const useGeminiChat = (
  campaignId?: string,
  onStateUpdate?: (stateUpdates: StateUpdates) => void,
) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadSessions = useCallback(async () => {
    if (!campaignId) return;
    try {
      const fetchedSessions = await fetchCampaignSessions(campaignId);
      setSessions(fetchedSessions);

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

  const handleUpdateSessionTitle = async (sessionId: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s)),
    );
    try {
      await updateSessionTitle(sessionId, newTitle);
    } catch (err) {
      console.error("Failed to update session title in DB:", err);
    }
  };

  const sendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    if (!customPrompt) setInput("");

    if (currentSessionId) {
      const currentSession = sessions.find((s) => s.id === currentSessionId);
      if (currentSession && (currentSession.title === "שיחה חדשה" || !currentSession.title)) {
        const generatedTitle = userMsg.length > 25 ? userMsg.substring(0, 25) + "..." : userMsg;
        handleUpdateSessionTitle(currentSessionId, generatedTitle);
      }
    }

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { sender: "user", text: userMsg },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const cleanHistory = updatedMessages
        .slice(0, -1)
        .filter((m) => m.text !== INITIAL_MESSAGE.text);

      const recentHistory = cleanHistory.slice(-20);

      const res = await sendMessageToGemini(
        userMsg,
        recentHistory,
        campaignId,
        currentSessionId || undefined,
      );

      if (res.stateUpdates && onStateUpdate) {
        onStateUpdate(res.stateUpdates);
      }

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

  // עריכת ההודעה האחרונה של המשתמש
  const editLastUserMessage = async () => {
    if (messages.length === 0 || loading) return;

    const lastUserIndex = messages.findLastIndex((m) => m.sender === "user");
    if (lastUserIndex === -1) return;

    const messageToEdit = messages[lastUserIndex];
    const updatedMessages = messages.slice(0, lastUserIndex);

    setMessages(updatedMessages);
    setInput(messageToEdit.text);

    if (currentSessionId) {
      try {
        await updateSessionMessages(currentSessionId, updatedMessages);
      } catch (err) {
        console.error("Failed to update messages in DB:", err);
      }
    }
  };

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
    handleUpdateSessionTitle,
    messages,
    setMessages,
    input,
    setInput,
    loading,
    sendMessage,
    editLastUserMessage,
    triggerManualAISummary,
    messagesEndRef,
  };
};