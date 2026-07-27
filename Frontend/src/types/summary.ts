export interface Summary {
  id: string;
  campaignId: string;
  content: string;
  createdVia: 'MANUAL' | 'ON_DEMAND' | 'AUTO';
  pdfUrl?: string | null;
  createdAt: string;
}

export interface SummaryResponse {
  success: boolean;
  summary: Summary;
}

export interface GetCampaignSummariesResponse {
  success: boolean;
  summaries: Summary[];
}