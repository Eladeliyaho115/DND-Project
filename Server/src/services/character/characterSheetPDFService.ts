import { prisma } from "../../config/db.js";

export const upsertCharacterSheetPDF = async (
  campaignId: string,
  characterName: string,
  pdfBuffer: Buffer
) => {
  // המרת ה-Buffer ל-Uint8Array שמתאים בדיוק לטיפוס של Prisma Bytes
  const bytesData = new Uint8Array(pdfBuffer);

  return await prisma.characterSheet.upsert({
    where: {
      campaignId_name: {
        campaignId,
        name: characterName,
      },
    },
    update: {
      pdfData: bytesData,
    },
    create: {
      campaignId,
      name: characterName,
      pdfData: bytesData,
    },
  });
};

export const getCharacterSheetPDFsByCampaign = async (campaignId: string) => {
  return await prisma.characterSheet.findMany({
     where: { campaignId },
    select: {
      name: true,
      pdfData: true,
    },
  });
};
