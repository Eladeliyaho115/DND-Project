import { prisma } from "../../config/db.js";

// 1. יצירת שיחה חדשה
export const createChatSession = async (campaignId: string, title?: string) => {
  return await prisma.chatSession.create({
    data: {
      campaignId,
      title: title || "שיחה חדשה",
    },
  });
};

// 2. שליפת כל השיחות של קמפיין (עבור הסרגל הצדי)
export const getSessionsByCampaign = async (campaignId: string) => {
  return await prisma.chatSession.findMany({
    where: { campaignId },
    orderBy: { updatedAt: "desc" },
  });
};

// 3. שליפת היסטוריית הודעות של שיחה ספציפית
export const getMessagesBySession = async (sessionId: string) => {
  return await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
};

// 4. שמירת הודעה בשיחה
export const saveMessage = async (sessionId: string, sender: 'user' | 'gemini', text: string) => {
  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      sender,
      text,
    },
  });

  // עדכון תאריך ה-updatedAt של השיחה
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  return message;
};

// 5. עדכון כותרת של שיחה
export const updateSessionTitle = async (sessionId: string, title: string) => {
  return await prisma.chatSession.update({
    where: { id: sessionId },
    data: { title },
  });
};

// 6. מחיקת שיחה
export const deleteChatSession = async (sessionId: string) => {
  return await prisma.chatSession.delete({
    where: { id: sessionId },
  });
};

// 7. ספירת הודעות בשיחה לצורך סיכום אוטומטי
export const getMessageCountBySession = async (sessionId: string) => {
  return await prisma.chatMessage.count({
    where: { sessionId },
  });
};