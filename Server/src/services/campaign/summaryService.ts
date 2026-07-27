import PDFDocument from 'pdfkit';
import { prisma } from "../../config/db.js";
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// פונקציית עזר לייצור PDF
export const createPDFBuffer = (title: string, text: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      doc.fontSize(18).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(11).text(text, { align: 'left' });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// 1. 👈 יצוא פונקציית הסיכום הידני (הייתה חסרה!)
export const createManualSummary = async (campaignId: string, content: string) => {
  return await prisma.summary.create({
    data: {
      campaignId,
      content,
      createdVia: 'MANUAL',
    },
  });
};

// 2. יצוא פונקציית סיכום ה-AI
export const generateAISummary = async (
  campaignId: string,
  history: { sender: string; text: string }[],
  createdVia: 'ON_DEMAND' | 'AUTO' = 'ON_DEMAND'
) => {
  const prompt = `
You are a D&D Campaign Historian. 
Summarize the following session chat log into a clear narrative summary. 
Include key achievements, decisions, and outcomes.

Chat Log:
${history.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
  });

  const summaryText = response.text || 'No summary text generated.';

  let pdfBase64 = '';
  try {
    const pdfBuffer = await createPDFBuffer(`Campaign Summary - ${new Date().toLocaleDateString()}`, summaryText);
    pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
  } catch (pdfErr) {
    console.error('PDFKit generation error (continuing without PDF):', pdfErr);
  }

  const savedSummary = await prisma.summary.create({
    data: {
      campaignId,
      content: summaryText,
      createdVia,
      pdfUrl: pdfBase64 || null,
    },
  });

  return savedSummary;
};

// שליפת כל הסיכומים המשויכים לקמפיין
export const getSummariesByCampaign = async (campaignId: string) => {
  return await prisma.summary.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' }, // החדש ביותר יופיע ראשון
  });
};