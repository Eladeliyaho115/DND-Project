import { api } from '../api/axiosClient';
import type { Campaign } from '../types/campaign';

// קבלת כל הקמפיינים
export const fetchAllCampaigns = async (): Promise<Campaign[]> => {
  const response = await api.get<Campaign[]>('/campaigns');
  return response.data;
};

// יצירת קמפיין חדש
export const createCampaign = async (
  title: string, 
  description?: string, 
  bgUrl?: string
): Promise<Campaign> => {
  const response = await api.post<Campaign>('/campaigns', { title, description, bgUrl });
  return response.data;
};

// עדכון סטטוס קמפיין (active / completed)
export const updateCampaignStatus = async (
  id: string, 
  status: 'active' | 'completed' | 'upcoming'
): Promise<Campaign> => {
  const response = await api.patch<Campaign>(`/campaigns/${id}/status`, { status });
  return response.data;
};

// מחיקת קמפיין
export const deleteCampaignFromDb = async (id: string): Promise<void> => {
  await api.delete(`/campaigns/${id}`);
};

// עדכון פרטי קמפיין (title, description, bgUrl)    
export const updateCampaignData = async (
  id: string, 
  updates: { title?: string; description?: string; bgUrl?: string; status?: string }
): Promise<Campaign> => {
  const response = await api.put<Campaign>(`/campaigns/${id}`, updates);
  return response.data;
};