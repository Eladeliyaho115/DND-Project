import { api } from '../api/axiosClient';
import type { Campaign } from '../types/campaign';

// 1. קבלת כל הקמפיינים
export const fetchAllCampaigns = async (): Promise<Campaign[]> => {
  const response = await api.get<Campaign[]>('/campaigns');
  return response.data;
};

// 2. יצירת קמפיין חדש
export const createCampaign = async (
  title: string, 
  description?: string, 
  bgUrl?: string
): Promise<Campaign> => {
  const response = await api.post<Campaign>('/campaigns', { title, description, bgUrl });
  return response.data;
};

// 3. עדכון פרטי קמפיין (כולל title, description, bgUrl, mapUrl, status)
export const updateCampaignData = async (
  id: string, 
  updates: { title?: string; description?: string; bgUrl?: string; mapUrl?: string; status?: string }
): Promise<Campaign> => {
  const response = await api.put<Campaign>(`/campaigns/${id}`, updates);
  return response.data;
};

// 4. עדכון סטטוס קמפיין
export const updateCampaignStatus = async (
  id: string, 
  status: 'active' | 'completed' | 'upcoming'
): Promise<Campaign> => {
  return updateCampaignData(id, { status });
};

// 5. מחיקת קמפיין
export const deleteCampaignFromDb = async (id: string): Promise<void> => {
  await api.delete(`/campaigns/${id}`);
};