import { api } from '../api/axiosClient';
import type { ChatMessage } from './geminiService';
import type { 
  SummaryResponse, 
  GetCampaignSummariesResponse 
} from '../types/summary';

// 1. העלאת סיכום ידני
export const createManualSummary = async (campaignId: string, content: string) => {
  const response = await api.post<SummaryResponse>('/summaries/manual', {
    campaignId,
    content,
  });
  return response.data;
};

// 2 + 3. יצירת סיכום AI (גם יזום וגם אוטומטי)
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

// 4. שליפת כל הסיכומים של קמפיין לפי campaignId
export const getCampaignSummaries = async (campaignId: string) => {
  const response = await api.get<GetCampaignSummariesResponse>(
    `/summaries/${campaignId}`
  );
  return response.data;
};