import { api } from './../api/axiosClient'; // וודא שהנתיב ל-axiosClient נכון

export interface UploadCharacterSheetParams {
  campaignId: string;
  characterName: string;
  file: File;
}

export const uploadCharacterSheetPDF = async ({
  campaignId,
  characterName,
  file,
}: UploadCharacterSheetParams) => {
  const formData = new FormData();
  formData.append('campaignId', campaignId);
  formData.append('characterName', characterName);
  formData.append('pdf', file); // השם חייב להתאים ל-upload.single('pdf') בשרת

  const response = await api.post('/character-sheets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};