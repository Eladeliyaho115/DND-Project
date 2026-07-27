import { useState, useRef, useEffect } from "react";
import {
  sendMessageToGemini,
  type ChatMessage,
} from "../services/geminiService";
import { generateAISummary } from "../services/summaryService";

const INITIAL_MESSAGE: ChatMessage = {
  sender: "gemini",
  text: "שלום! אני עוזר ה-D&D שלך. שאל אותי חוקים, בקש תיאורי סביבה, או מחולל רעיונות ל-NPCs בלייב!",
};

const AUTO_SUMMARY_THRESHOLD = 40;

export const useGeminiChat = (campaignId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // בדיקת טריגר לסיכום אוטומטי בעזרת ה-Service
  const checkAutoSummaryTrigger = async (allMessages: ChatMessage[]) => {
    if (!campaignId) return;

    const realMessagesCount = allMessages.filter(
      (m) => m.text !== INITIAL_MESSAGE.text
    ).length;

    if (
      realMessagesCount > 0 &&
      realMessagesCount % AUTO_SUMMARY_THRESHOLD === 0
    ) {
      try {
        console.log("🤖 מפעיל סיכום אוטומטי ברקע...");
        await generateAISummary(campaignId, allMessages, "AUTO");
      } catch (err) {
        console.error("Failed to run auto summary:", err);
      }
    }
  };

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
      const historyToSend = updatedMessages
        .slice(0, -1)
        .filter((m) => m.text !== INITIAL_MESSAGE.text);

      const reply = await sendMessageToGemini(
        userMsg,
        historyToSend,
        campaignId
      );

      const finalMessages = [
        ...updatedMessages,
        { sender: "gemini" as const, text: reply },
      ];
      setMessages(finalMessages);

      checkAutoSummaryTrigger(finalMessages);
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

  // סיכום יזום דרך ה-Service
  const triggerManualAISummary = async () => {
    if (!campaignId) {
      alert("לא ניתן להפיק סיכום ללא campaignId מוגדר.");
      return;
    }

    setLoading(true);
    try {
      const historyToSend = messages.filter(
        (m) => m.text !== INITIAL_MESSAGE.text
      );

      const data = await generateAISummary(campaignId, historyToSend, "ON_DEMAND");

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

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return {
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    triggerManualAISummary,
    clearChat,
    messagesEndRef,
  };
};