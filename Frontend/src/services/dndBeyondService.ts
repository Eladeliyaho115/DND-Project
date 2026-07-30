import { api } from '../api/axiosClient';
import type { Character } from '../types/character';
import type { Campaign } from '../types/campaign';

// קריאה בלייב מ-D&D Beyond (לכל הנתונים העדכניים של הדמות)
export const fetchLiveDndBeyondCharacter = async (beyondId: string): Promise<Character> => {
  const response = await api.get<Character>(`/characters/beyond/${beyondId}/live`);
  return response.data;
};

// שליפת הנתונים המקומיים מה-DB (בשביל ה-HP המעודכן)
export const fetchCharacterFromDb = async (beyondId: string): Promise<Character | null> => {
  try {
    const response = await api.get<Character>(`/characters/beyond/${beyondId}`);
    return response.data;
  } catch (err) {
    // אם הדמות עוד לא קיימת ב-DB, נחזיר null
    return null;
  }
};

// שמירה / הוספה ל-DB - מקבל גם campaignId כדי לשייך דמות למערכה
export const saveOrSyncDndBeyondCharacter = async (
  beyondId: string, 
  campaignId?: string
): Promise<Character> => {
  const response = await api.post<{ character: Character }>(`/characters/beyond/${beyondId}/save`, { campaignId });
  return response.data.character;
};

// מחיקת דמות מ-DB לפי ה-ID שלה
export const deleteCharacterFromDb = async (characterId: string): Promise<void> => {
  await api.delete(`/characters/${characterId}`);
};

// טעינת מערכה כולל כל הדמויות השמורות ב-DB
export const fetchCampaignWithCharacters = async (campaignId: string): Promise<Campaign> => {
  const response = await api.get<Campaign>(`/campaigns/${campaignId}`);
  return response.data;
};