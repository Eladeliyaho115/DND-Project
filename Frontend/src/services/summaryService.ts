import { api } from '../api/axiosClient';
import type { ChatMessage } from './geminiService';
import type { 
  SummaryResponse, 
  GetCampaignSummariesResponse 
} from '../types/summary';

// 1. יצירת סיכום ידני (אם נשלח קובץ, נשלח כ-FormData עם השדה 'file')
export const createManualSummary = async (campaignId: string, content?: string, file?: File) => {
  if (file) {
    const formData = new FormData();
    formData.append('campaignId', campaignId);
    if (content) formData.append('content', content);
    formData.append('file', file); // 👈 השם 'file' חייב להיות תואם ל-upload.single("file") בשרת!

    const response = await api.post<SummaryResponse>('/summaries/manual', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  const response = await api.post<SummaryResponse>('/summaries/manual', {
    campaignId,
    content,
  });
  return response.data;
};

// 2. יצירת סיכום AI (יזום ON_DEMAND או אוטומטי AUTO)
export const generateAISummary = async (
  campaignId: string,
  history: ChatMessage[],
  createdVia: 'ON_DEMAND' | 'AUTO' = 'ON_DEMAND'
) => {
  const response = await api.post<SummaryResponse>('/summaries/generate', {
    campaignId,
    history,
    createdVia,
  });
  return response.data;
};

// 3. שליפת כל הסיכומים של קמפיין
export const getCampaignSummaries = async (campaignId: string) => {
  const response = await api.get<GetCampaignSummariesResponse>(
    `/summaries/${campaignId}`
  );
  return response.data;
};

// 4. מחיקת סיכום לפי ID
export const deleteSummary = async (summaryId: string) => {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/summaries/${summaryId}`
  );
  return response.data;
};