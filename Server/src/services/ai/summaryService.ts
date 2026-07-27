import PDFDocument from 'pdfkit';
import { prisma } from "../../config/db.js";
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// פונקציית רנדור מעוצבת מטקסט Markdown ל-PDF
export const createPDFBuffer = (title: string, markdownText: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
      });
      const buffers: Buffer[] = [];

      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // 1. כותרת ראשית מעוצבת
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#d97706') // צבע זהב/אמבר
        .text(title, { align: 'center' });
      
      doc.moveDown(0.5);
      
      // קו מפריד מעוצב מתחת לכותרת
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#d97706')
        .lineWidth(1)
        .stroke();

      doc.moveDown(1);

      // 2. פירוק ה-Markdown לשורות וניתוח עיצוב
      const lines = markdownText.split('\n');

      lines.forEach((line) => {
        const trimmed = line.trim();

        // שורה ריקה -> רווח
        if (!trimmed) {
          doc.moveDown(0.4);
          return;
        }

        // כותרות (### או ## או #)
        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
          doc.moveDown(0.5);
          doc
            .font('Helvetica-Bold')
            .fontSize(13)
            .fillColor('#92400e') // חום/זהב כהה
            .text(headerText);
          doc.moveDown(0.2);
          return;
        }

        // רשימות בולטים (* או -)
        let formattedLine = trimmed;
        let isBullet = false;

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          isBullet = true;
          formattedLine = trimmed.replace(/^[\*\-]\s*/, '');
        }

        // ניקוי כוכביות הדגשה מתוך הטקסט
        const cleanContent = formattedLine.replace(/\*\*/g, '');

        // הגדרת פונט וצבע לטקסט הרגיל
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#1e293b'); // אפור כהה/כחול נייבי

        if (isBullet) {
          doc.text(`•  ${cleanContent}`, {
            indent: 15,
            lineGap: 3,
          });
        } else {
          doc.text(cleanContent, {
            lineGap: 3,
          });
        }
      });

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