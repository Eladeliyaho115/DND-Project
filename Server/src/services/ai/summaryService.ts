import PDFDocument from 'pdfkit';
import { prisma } from "../../config/db.js";
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#d97706')
        .text(title, { align: 'center' });
      
      doc.moveDown(0.5);
      
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#d97706')
        .lineWidth(1)
        .stroke();

      doc.moveDown(1);

      const lines = markdownText.split('\n');

      lines.forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed) {
          doc.moveDown(0.4);
          return;
        }

        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
          doc.moveDown(0.5);
          doc
            .font('Helvetica-Bold')
            .fontSize(13)
            .fillColor('#92400e')
            .text(headerText);
          doc.moveDown(0.2);
          return;
        }

        let formattedLine = trimmed;
        let isBullet = false;

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          isBullet = true;
          formattedLine = trimmed.replace(/^[\*\-]\s*/, '');
        }

        const cleanContent = formattedLine.replace(/\*\*/g, '');

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#1e293b');

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

export const createManualSummary = async (campaignId: string, content?: string, pdfUrl?: string) => {
  return await prisma.summary.create({
    data: {
      campaignId,
      content: content || (pdfUrl ? "מצורף קובץ PDF של סיכום הקמפיין להלן." : "סיכום ידני"),
      parsedContent: content || null,
      createdVia: 'MANUAL',
      pdfUrl: pdfUrl || null,
    },
  });
};

/**
 * מחולל סיכומים מבוסס AI המשתמש ב-Gemini 3.5-flash-lite
 */
export const generateAISummary = async (
  campaignId: string,
  history: { sender: string; text: string }[],
  createdVia: 'ON_DEMAND' | 'AUTO' = 'ON_DEMAND'
) => {
  console.log(`📜 מפיק סיכום קמפיין מבוסס Gemini...`);

  const prompt = `
You are a D&D Campaign Historian.
Summarize the following session chat log into a structured narrative campaign log for future DM context.

CRITICAL RULE (STRICT NO HALLUCINATIONS):
Only include facts, events, and details EXPLICITLY established in the chat log. Do NOT invent motivations, unrevealed plot twists, items, or outcomes. Preserve uncertainty if players don't know something yet.

STRUCTURE YOUR SUMMARY WITH:
1. Key Plot Events & Achievements
2. Active Quests & Unresolved Story Hooks
3. Important NPCs Met & Relationship Status (e.g., friendly, hostile, suspicious)
4. Items, Loot, & Resources Acquired or Lost
5. Current Party Location & Immediate Next Objectives

Chat Log:
${history.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}

Format output cleanly in Markdown using the primary language of the chat log (Hebrew or English).
`;

  let summaryText = await generateGeminiSummaryText(prompt);

  // יצירת קובץ ה-PDF
  let pdfBase64 = '';
  try {
    const pdfBuffer = await createPDFBuffer(`Campaign Summary - ${new Date().toLocaleDateString()}`, summaryText);
    pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
  } catch (pdfErr) {
    console.error('PDFKit generation error (continuing without PDF):', pdfErr);
  }

  return await prisma.summary.create({
    data: {
      campaignId,
      content: summaryText,
      parsedContent: summaryText,
      createdVia,
      pdfUrl: pdfBase64 || null,
    },
  });
};

const generateGeminiSummaryText = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
    });

    return response.text || 'No summary text generated.';
  } catch (err) {
    console.error('❌ שגיאה ביצירת סיכום עם Gemini:', err);
    return 'Failed to generate campaign summary.';
  }
};

export const getSummariesByCampaign = async (campaignId: string) => {
  return await prisma.summary.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
  });
};

export const deleteSummaryById = async (summaryId: string) => {
  return await prisma.summary.delete({
    where: { id: summaryId },
  });
};