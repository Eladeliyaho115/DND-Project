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

export interface StateUpdates {
  hpChanges?: Array<{ characterName?: string; beyondId?: string; changeAmount: number }>;
  [key: string]: any;
}

export interface ChatResponse {
  text: string;
  sessionId: string;
  stateUpdates?: StateUpdates;
}

/**
 * שולח הודעה והיסטוריית שיחה ל-Backend
 */
export const sendMessageToGemini = async (
  prompt: string,
  history: ChatMessage[],
  campaignId?: string,
  sessionId?: string
): Promise<ChatResponse> => {
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

/**
 * עדכון כותרת סשן בשרת
 */
export const updateSessionTitle = async (sessionId: string, title: string): Promise<void> => {
  await api.patch(`/ai/sessions/${sessionId}/title`, { title });
};

/**
 * עדכון הודעות השיחה בשרת (למשל בעת עריכת הודעה אחרונה)
 */
export const updateSessionMessages = async (sessionId: string, messages: ChatMessage[]): Promise<void> => {
  await api.put(`/ai/sessions/${sessionId}/messages`, { messages });
};