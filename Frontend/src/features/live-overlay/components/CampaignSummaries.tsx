import React, { useEffect, useState } from 'react';
import { getCampaignSummaries } from '../../../services/summaryService';
import type { Summary } from '../../../types/summary'; // 👈 ייבוא נקי מתקיית types

interface Props {
  campaignId: string;
}

export const CampaignSummaries: React.FC<Props> = ({ campaignId }) => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCampaignSummaries(campaignId);
        if (data.success) {
          setSummaries(data.summaries);
        }
      } catch (err) {
        console.error('Error fetching summaries:', err);
        setError('נכשלה טעינת הסיכומים. נסה שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchSummaries();
    }
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400 text-sm">
        <span className="animate-pulse">📜 טוען יומני קמפיין...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
        {error}
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="text-center p-6 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
        <p className="font-medium text-slate-300 mb-1">אין עדיין סיכומים לקמפיין זה</p>
        <p className="text-xs text-slate-500">לחץ על "סכם שיחה" בצ'אט כדי לייצר את הסיכום הראשון!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 dir-rtl text-right">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
          📜 יומני קמפיין וסיכומים
        </h3>
        <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
          סה"כ: {summaries.length}
        </span>
      </div>

      <div className="grid gap-4">
        {summaries.map((summary) => (
          <div
            key={summary.id}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition"
          >
            <div className="flex justify-between items-center mb-3">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  summary.createdVia === 'AUTO'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : summary.createdVia === 'ON_DEMAND'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {summary.createdVia === 'AUTO'
                  ? '🤖 אוטומטי'
                  : summary.createdVia === 'ON_DEMAND'
                  ? '✨ מוזמן מ-AI'
                  : '✍️ ידני'}
              </span>

              <span className="text-xs text-slate-500">
                {new Date(summary.createdAt).toLocaleDateString('he-IL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {summary.content}
            </p>

            {summary.pdfUrl && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-end">
                <a
                  href={summary.pdfUrl}
                  download={`Summary-${new Date(summary.createdAt).toISOString().slice(0, 10)}.pdf`}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition bg-amber-500/5 hover:bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20"
                >
                  📄 הורד כקובץ PDF
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};