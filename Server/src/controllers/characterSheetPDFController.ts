import { Request, Response } from 'express';
import { upsertCharacterSheetPDF } from '../services/character/characterSheetPDFService.js';
import { sendMessageToGemini } from '../services/aiService.js';

export const handleUploadCharacterSheet = async (req: Request, res: Response) => {
  try {
    const { campaignId, characterName } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'לא צורף קובץ PDF.' });
    }

    if (!campaignId || !characterName) {
      return res.status(400).json({ error: 'חובה לספק campaignId ו-characterName.' });
    }

    const savedSheet = await upsertCharacterSheetPDF(campaignId, characterName, file.buffer);

    return res.status(200).json({
      message: 'דף הדמות עודכן ונשמר בהצלחה!',
      characterSheetId: savedSheet.id,
    });
  } catch (error) {
    console.error('Error in handleUploadCharacterSheet controller:', error);
    return res.status(500).json({ error: 'שגיאה בשמירת דף הדמות בשרת.' });
  }
};

export const handleAIChat = async (req: Request, res: Response) => {
  try {
    const { prompt, history, campaignId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'חסר פרומפט לשליחה.' });
    }

    const reply = await sendMessageToGemini({
      prompt,
      history: history || [],
      campaignId,
    });

    return res.status(200).json({ text: reply });
  } catch (error) {
    console.error('Error in handleAIChat:', error);
    return res.status(500).json({ error: 'שגיאה בעיבוד התשובה מ-Gemini.' });
  }
};