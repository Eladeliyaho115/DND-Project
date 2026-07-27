import React, { useEffect, useState } from 'react';
import { 
  getCampaignSummaries, 
  deleteSummary, 
  createManualSummary 
} from '../../../services/summaryService';
import type { Summary } from '../../../types/summary';

interface Props {
  campaignId: string;
}

export const CampaignSummaries: React.FC<Props> = ({ campaignId }) => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States עבור הוספת סיכום ידני
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  useEffect(() => {
    if (campaignId) {
      fetchSummaries();
    }
  }, [campaignId]);

  // מחיקת סיכום
  const handleDelete = async (summaryId: string) => {
    if (!window.confirm('האם למחוק את הסיכום הזה?')) return;
    try {
      await deleteSummary(summaryId);
      setSummaries((prev) => prev.filter((s) => s.id !== summaryId));
    } catch (err) {
      console.error('Error deleting summary:', err);
      alert('שגיאה במחיקת הסיכום');
    }
  };

  // העלאת סיכום ידני / קובץ PDF
  const handleAddManualSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim() && !selectedFile) {
      alert('נא להזין תוכן או לבחור קובץ PDF');
      return;
    }

    try {
      setIsSubmitting(true);
      await createManualSummary(campaignId, manualText.trim(), selectedFile || undefined);
      setManualText('');
      setSelectedFile(null);
      setShowAddForm(false);
      await fetchSummaries(); // רענון הרשימה
    } catch (err) {
      console.error('Error adding manual summary:', err);
      alert('שגיאה בהוספת הסיכום');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && summaries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400 text-sm">
        <span className="animate-pulse">📜 טוען יומני קמפיין...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 dir-rtl text-right">
      {/* Header + כפתור פתיחת טופס הוספה */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
          📜 יומני קמפיין וסיכומים
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl transition flex items-center gap-1"
          >
            <span>{showAddForm ? '✕ סגור' : '+ הוסף סיכום ידני'}</span>
          </button>
          <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
            סה"כ: {summaries.length}
          </span>
        </div>
      </div>

      {/* טופס הוספת סיכום ידני / העלאת PDF */}
      {showAddForm && (
        <form onSubmit={handleAddManualSummary} className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-3">
          <h4 className="text-xs font-bold text-amber-300">✍️ הוספת סיכום ידני / קובץ PDF</h4>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="כתוב כאן תקציר ידני של המפגש..."
            className="w-full h-20 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
          />
          <div className="flex items-center justify-between">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-amber-300 hover:file:bg-slate-700"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'שומר...' : 'שמור סיכום'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      {summaries.length === 0 && !showAddForm ? (
        <div className="text-center p-6 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400 text-sm">
          <p className="font-medium text-slate-300 mb-1">אין עדיין סיכומים לקמפיין זה</p>
          <p className="text-xs text-slate-500">לחץ על "הוסף סיכום ידני" למעלה או "סכם שיחה" בצ'אט ה-AI!</p>
        </div>
      ) : (
        <div className="grid gap-4 max-h-[50vh] overflow-y-auto pr-1">
          {summaries.map((summary) => (
            <div
              key={summary.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition relative group"
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

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {new Date(summary.createdAt).toLocaleDateString('he-IL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {/* כפתור מחיקת סיכום */}
                  <button
                    onClick={() => handleDelete(summary.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 p-1 rounded-lg border border-rose-500/20 transition"
                    title="מחק סיכום"
                  >
                    🗑️
                  </button>
                </div>
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
      )}
    </div>
  );
};