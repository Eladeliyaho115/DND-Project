import { useState, useRef, useEffect } from "react";
import {
  sendMessageToGemini,
  type ChatMessage,
} from "../services/geminiService";

const INITIAL_MESSAGE: ChatMessage = {
  sender: "gemini",
  text: "שלום! אני עוזר ה-D&D שלך. שאל אותי חוקים, בקש תיאורי סביבה, או מחולל רעיונות ל-NPCs בלייב!",
};

export const useGeminiChat = (campaignId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // גלילה אוטומטית בכל פעם שיש הודעה חדשה או שינוי במצב הטעינה
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend.trim();
    if (!customPrompt) setInput("");

    // עדכון ה-State עם הודעת המשתמש
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { sender: "user", text: userMsg },
    ];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // סינון הודעת הברכה הראשונית מההיסטוריה כדי לשמור על מבנה תקין מול ה-API
      const historyToSend = updatedMessages
        .slice(0, -1)
        .filter((m) => m.text !== INITIAL_MESSAGE.text);

      // קריאה ל-Service מול ה-Backend
      const reply = await sendMessageToGemini(
        userMsg,
        historyToSend,
        campaignId
      );
      setMessages((prev) => [...prev, { sender: "gemini", text: reply }]);
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

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return {
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    clearChat,
    messagesEndRef,
  };
};