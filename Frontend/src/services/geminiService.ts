import { api } from './../api/axiosClient'; // וודא שהנתיב לקובץ ה-axiosClient נכון

export interface ChatMessage {
  sender: 'user' | 'gemini';
  text: string;
}

export interface ChatResponse {
  text: string;
}

/**
 * שולח הודעה והיסטוריית שיחה ל-Backend דרך axiosClient
 */
export const sendMessageToGemini = async (
  prompt: string,
  history: ChatMessage[],
  campaignId?: string
): Promise<string> => {
  try {
    // מכיוון שב-baseURL יש כבר /api, משרשרים רק /ai/chat
    const response = await api.post<ChatResponse>('/ai/chat', {
      prompt,
      history,
      campaignId,
    });

    return response.data.text;
  } catch (error) {
    console.error('Error in sendMessageToGemini service:', error);
    throw error;
  }
};