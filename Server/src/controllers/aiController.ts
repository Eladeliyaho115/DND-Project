import { Request, Response } from 'express';
import { sendMessageToGemini } from './../services/aiService.js';

export const handleAIChat = async (req: Request, res: Response) => {
  try {
    const { prompt, history, campaignId } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'חובה לספק prompt תקין.' });
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({ error: 'history חייב להיות מערך.' });
    }

    const replyText = await sendMessageToGemini({
      prompt,
      history: history || [],
      campaignId,
    });

    return res.json({ text: replyText });
  } catch (error) {
    console.error('Error in handleAIChat controller:', error);
    return res.status(500).json({ error: 'שגיאה בעיבוד בקשת ה-AI בשרת.' });
  }
};