import { api } from '../api/axiosClient';

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'gemini';
  text: string;
}

export interface ChatSession {
  id: string;
  title: string;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  text: string;
  sessionId: string;
}

/**
 * שולח הודעה והיסטוריית שיחה ל-Backend
 */
export const sendMessageToGemini = async (
  prompt: string,
  history: ChatMessage[],
  campaignId?: string,
  sessionId?: string
): Promise<{ text: string; sessionId: string }> => {
  try {
    const response = await api.post<ChatResponse>('/ai/chat', {
      prompt,
      history,
      campaignId,
      sessionId,
    });

    return response.data;
  } catch (error) {
    console.error('Error in sendMessageToGemini service:', error);
    throw error;
  }
};

/**
 * שליפת כל השיחות המשויכות לקמפיין
 */
export const fetchCampaignSessions = async (campaignId: string): Promise<ChatSession[]> => {
  const response = await api.get<ChatSession[]>(`/ai/sessions/campaign/${campaignId}`);
  return response.data;
};

/**
 * שליפת הודעות של שיחה ספציפית
 */
export const fetchSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const response = await api.get<ChatMessage[]>(`/ai/sessions/${sessionId}/messages`);
  return response.data;
};

/**
 * יצירת סשן שיחה חדש באופן יזום
 */
export const createNewSession = async (campaignId: string, title?: string): Promise<ChatSession> => {
  const response = await api.post<ChatSession>('/ai/sessions', {
    campaignId,
    title,
  });
  return response.data;
};

/**
 * מחיקת סשן שיחה
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  await api.delete(`/ai/sessions/${sessionId}`);
};