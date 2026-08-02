// backend/src/services/summary/summaryService.ts
import PDFDocument from 'pdfkit';
import { prisma } from "../../config/db.js";
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * 🤖 פונקציית עזר כללית לקריאה ל-Gemini
 */
async function generateTextWithGemini(
  prompt: string, 
  model = 'gemini-3.5-flash-lite'
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || '';
  } catch (err) {
    console.error(`❌ Gemini Generation Error (${model}):`, err);
    return '';
  }
}

/**
 * 🔍 מפרסר קובץ PDF של סיכום ידני בעזרת Gemini
 */
async function parseSummaryPDFWithGemini(pdfBuffer: Buffer): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBuffer.toString("base64"),
          },
        },
        {
          text: `Extract ALL text, plot notes, events, NPC names, and campaign details from this PDF document. 
DO NOT summarize or rewrite the information. Preserve exact names, numbers, values, and text details as written. Return the parsed information cleanly formatted as plain text.`,
        },
      ],
      config: {
        temperature: 0.0,
      },
    });

    return response.text || "";
  } catch (err) {
    console.error(`❌ שגיאה ב-Gemini בעת הפירוק של PDF סיכום ידני:`, err);
    return "";
  }
}

/**
 * 🔄 עדכון או יצירה מחדש של ה-Master Summary של הקמפיין (זיכרון לטווח ארוך)
 * מקבל סשן חדש בודד (להוספה מדורגת) או מערך של כל הסיכומים (לבנייה מחדש מלאה)
 */
export const updateMasterSummary = async (
  campaignId: string,
  newSessionSummaryText?: string
): Promise<string> => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { masterSummary: true },
    });

    const currentMaster = campaign?.masterSummary || "No prior long-term history.";

    let prompt = "";

    if (newSessionSummaryText) {
      // 🟢 עדכון שוטף לאחר סשן חדש
      prompt = `
You are a D&D Campaign Historian.
Update the "Master Campaign Summary" by integrating the new session's events into the existing overarching narrative.

RULES:
1. FOCUS ON: Major plot arcs, overarching villains, primary quests, key NPCs, long-term allies/enemies, and world-changing consequences.
2. DISCARD: Fleeting combat mechanics, temporary HP changes, low-level loot, or minor session-specific fluff.
3. Keep it structured, clear, and concise (maximum 3-4 paragraphs or key bulleted sections).

EXISTING MASTER SUMMARY:
${currentMaster}

NEW SESSION SUMMARY:
${newSessionSummaryText}

Updated Master Summary (in Hebrew or English matching the input context):
`;
    } else {
      // 🔄 יצירה מחדש מתוך כל היסטוריית הסיכומים ב-DB
      const summaries = await prisma.summary.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'asc' },
      });

      if (summaries.length === 0) {
        return "No prior campaign summaries found.";
      }

      const combinedText = summaries
        .map((s, i) => `=== Session ${i + 1} ===\n${s.parsedContent || s.content}`)
        .join('\n\n');

      prompt = `
You are a D&D Campaign Historian.
Create a comprehensive "Master Campaign Summary" based on all past session summaries provided below.

RULES:
1. FOCUS ON: Major plot arcs, primary villains, overarching quests, key NPCs, important alliances, and world-changing events.
2. DISCARD: Fleeting combat mechanics, temporary HP/loot changes, or minor session fluff.
3. Structure cleanly with headers or bullet points in the primary language of the text (Hebrew or English).

ALL PAST SUMMARIES:
${combinedText}
`;
    }

    const updatedMasterText = await generateTextWithGemini(prompt);
    const finalMaster = updatedMasterText || currentMaster;

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { masterSummary: finalMaster },
    });

    console.log("✅ Master Summary updated and saved successfully!");
    return finalMaster;
  } catch (err) {
    console.error("❌ Error updating Master Summary:", err);
    throw err;
  }
};

/**
 * 🚀 Alias לשמירה על תאימות עם הקונטרולר עבור Rebuild מלא
 */
export const generateInitialMasterSummary = (campaignId: string) => {
  return updateMasterSummary(campaignId);
};

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

/**
 * 📝 יצירת סיכום ידני - כולל תמיכה בפענוח PDF
 */
export const createManualSummary = async (
  campaignId: string, 
  content?: string, 
  pdfBuffer?: Buffer,
  pdfUrl?: string
) => {
  let parsedContent = content || null;

  if (pdfBuffer && !parsedContent) {
    console.log(`✨ מפעיל חילוץ טקסט מ-PDF סיכום ידני בעזרת Gemini...`);
    parsedContent = await parseSummaryPDFWithGemini(pdfBuffer);
  }

  const summary = await prisma.summary.create({
    data: {
      campaignId,
      content: content || (pdfUrl ? "מצורף קובץ PDF של סיכום הקמפיין להלן." : "סיכום ידני"),
      parsedContent: parsedContent || content || null,
      createdVia: 'MANUAL',
      pdfUrl: pdfUrl || null,
    },
  });

  const finalSummaryText = parsedContent || content;
  if (finalSummaryText) {
    await updateMasterSummary(campaignId, finalSummaryText);
  }

  return summary;
};

/**
 * 📜 מחולל סיכומים מבוסס AI המשתמש ב-Gemini
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

CRITICAL RULES (STRICT ACCURACY & NO HALLUCINATIONS):
1. FACTUAL FIDELITY: Only include facts, events, and details EXPLICITLY established in the text. Do NOT invent motivations, unrevealed plot twists, items, or outcomes.
2. TITLES & HIERARCHIES: Maintain exact titles, political standing, and faction roles as stated. Do NOT exaggerate or simplify status (e.g., do not turn "one of the leaders" into "the sole leader", or "a member" into "the commander").
3. PRESERVE UNCERTAINTY: Keep rumors, theories, or partial knowledge framed as uncertainties or rumors—do not convert them into absolute established facts.

STRUCTURE YOUR SUMMARY WITH:
1. Key Plot Events & Achievements
2. Active Quests & Unresolved Story Hooks
3. Important NPCs Met & Relationship Status (e.g., friendly, hostile, suspicious, exact role/title)
4. Items, Loot, & Resources Acquired or Lost
5. Current Party Location & Immediate Next Objectives

Chat Log:
${history.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}

Format output cleanly in Markdown using the primary language of the chat log (Hebrew or English).
`;

  const summaryText = (await generateTextWithGemini(prompt)) || 'Failed to generate campaign summary.';

  let pdfBase64 = '';
  try {
    const pdfBuffer = await createPDFBuffer(`Campaign Summary - ${new Date().toLocaleDateString()}`, summaryText);
    pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
  } catch (pdfErr) {
    console.error('PDFKit generation error (continuing without PDF):', pdfErr);
  }

  const newSummary = await prisma.summary.create({
    data: {
      campaignId,
      content: summaryText,
      parsedContent: summaryText,
      createdVia,
      pdfUrl: pdfBase64 || null,
    },
  });

  // 🎯 עדכון אוטומטי של ה-Master Summary ב-DB
  await updateMasterSummary(campaignId, summaryText);

  return newSummary;
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