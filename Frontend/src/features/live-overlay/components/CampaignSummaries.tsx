import React, { useEffect, useState } from "react";
import {
  getCampaignSummaries,
  deleteSummary,
  createManualSummary,
  getMasterSummary,
  rebuildMasterSummary,
} from "../../../services/summaryService";
import { updateCampaignData } from "../../../services/campaignService";
import type { Summary } from "../../../types/summary";

interface Props {
  campaignId: string;
}

export const CampaignSummaries: React.FC<Props> = ({ campaignId }) => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Master Summary States
  const [masterSummary, setMasterSummary] = useState<string>("");
  const [isEditingMaster, setIsEditingMaster] = useState<boolean>(false);
  const [masterInputText, setMasterInputText] = useState<string>("");
  const [isRebuildingMaster, setIsRebuildingMaster] = useState<boolean>(false);
  const [isSavingMaster, setIsSavingMaster] = useState<boolean>(false);

  // States עבור הוספת סיכום ידני
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchSummariesAndMaster = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summariesRes, masterRes] = await Promise.all([
        getCampaignSummaries(campaignId),
        getMasterSummary(campaignId),
      ]);

      if (summariesRes.success) {
        setSummaries(summariesRes.summaries);
      }
      if (masterRes) {
        const text =
          masterRes.masterSummary || "עדיין לא נוצר סיכום-על לקמפיין זה.";
        setMasterSummary(text);
        setMasterInputText(text);
      }
    } catch (err) {
      console.error("Error fetching summaries/master:", err);
      setError("נכשלה טעינת הנתונים. נסה שוב מאוחר יותר.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchSummariesAndMaster();
    }
  }, [campaignId]);

  // ✏️ שמירת עריכה ידנית של Master Summary
  const handleSaveMaster = async () => {
    try {
      setIsSavingMaster(true);
      await updateCampaignData(campaignId, { masterSummary: masterInputText });
      setMasterSummary(masterInputText);
      setIsEditingMaster(false);
    } catch (err) {
      console.error("Error saving master summary:", err);
      alert("שגיאה בשמירת סיכום העל");
    } finally {
      setIsSavingMaster(false);
    }
  };

  // 🔄 בנייה מחדש של Master Summary דרך AI
  const handleRebuildMaster = async () => {
    if (
      !window.confirm(
        "האם לבנות מחדש את סיכום העל מכל הסיכומים בסיפור? זה עשוי לקחת כמה שניות.",
      )
    )
      return;
    try {
      setIsRebuildingMaster(true);
      const res = await rebuildMasterSummary(campaignId);
      setMasterSummary(res.masterSummary);
      setMasterInputText(res.masterSummary);
    } catch (err) {
      console.error("Error rebuilding master summary:", err);
      alert("שגיאה ביצירה מחדש של סיכום העל");
    } finally {
      setIsRebuildingMaster(false);
    }
  };

  // 📥 הורדת Master Summary כקובץ טקסט
  const handleDownloadMaster = () => {
    const element = document.createElement("a");
    const file = new Blob([masterSummary], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Master-Summary-${campaignId.slice(0, 6)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // מחיקת סיכום
  const handleDelete = async (summaryId: string) => {
    if (!window.confirm("האם למחוק את הסיכום הזה?")) return;
    try {
      await deleteSummary(summaryId);
      setSummaries((prev) => prev.filter((s) => s.id !== summaryId));
    } catch (err) {
      console.error("Error deleting summary:", err);
      alert("שגיאה במחיקת הסיכום");
    }
  };

  // העלאת סיכום ידני / קובץ PDF + עדכון אוטומטי ל-Master Summary
  const handleAddManualSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim() && !selectedFile) {
      alert("נא להזין תוכן או לבחור קובץ PDF");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. שמירת הסיכום הידני החדש
      await createManualSummary(
        campaignId,
        manualText.trim(),
        selectedFile || undefined,
      );

      // 2. הפעלת Rebuild אוטומטי ל-Master Summary מכל הסיכומים
      const masterRes = await rebuildMasterSummary(campaignId);
      setMasterSummary(masterRes.masterSummary);
      setMasterInputText(masterRes.masterSummary);

      // 3. איפוס הטופס ורענון יומני המפגשים
      setManualText("");
      setSelectedFile(null);
      setShowAddForm(false);
      await fetchSummariesAndMaster();
    } catch (err) {
      console.error("Error adding manual summary:", err);
      alert("שגיאה בהוספת הסיכום או בעדכון ה-Master Summary");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && summaries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400 text-sm">
        <span className="animate-pulse">📜 טוען יומני קמפיין וסיכום-על...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 dir-rtl text-right">
      {/* 👑 1. Master Campaign Summary Block */}
      <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
            👑 Master Campaign Summary (זיכרון ארוך טווח)
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMaster}
              className="text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition"
              title="הורד קובץ"
            >
              📥 ייצא
            </button>

            <button
              onClick={handleRebuildMaster}
              disabled={isRebuildingMaster}
              className="text-[11px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
            >
              {isRebuildingMaster ? "🔄 מייצר מחדש..." : "🔄 Rebuild AI"}
            </button>

            {!isEditingMaster ? (
              <button
                onClick={() => setIsEditingMaster(true)}
                className="text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg transition"
              >
                ✏️ ערוך
              </button>
            ) : (
              <button
                onClick={handleSaveMaster}
                disabled={isSavingMaster}
                className="text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-lg transition disabled:opacity-50"
              >
                {isSavingMaster ? "שומר..." : "💾 שמור"}
              </button>
            )}
          </div>
        </div>

        {isEditingMaster ? (
          <textarea
            value={masterInputText}
            onChange={(e) => setMasterInputText(e.target.value)}
            className="w-full h-36 bg-slate-900 border border-amber-500/40 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-y"
          />
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-3 rounded-lg border border-slate-800/80 max-h-40 overflow-y-auto">
            {masterSummary}
          </p>
        )}
      </div>

      {/* 📜 2. Session Summaries Header + List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
            📜 יומני מפגשים פרטניים
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl transition flex items-center gap-1"
            >
              <span>{showAddForm ? "✕ סגור" : "+ הוסף סיכום ידני"}</span>
            </button>
            <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
              סה"כ: {summaries.length}
            </span>
          </div>
        </div>

        {/* טופס הוספת סיכום ידני / העלאת PDF */}
        {showAddForm && (
          <form
            onSubmit={handleAddManualSummary}
            className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-3"
          >
            <h4 className="text-xs font-bold text-amber-300">
              ✍️ הוספת סיכום ידני / קובץ PDF
            </h4>
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
                {isSubmitting ? "שומר..." : "שמור סיכום"}
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
            <p className="font-medium text-slate-300 mb-1">
              אין עדיין סיכומים לקמפיין זה
            </p>
            <p className="text-xs text-slate-500">
              לחץ על "הוסף סיכום ידני" למעלה או "סכם שיחה" בצ'אט ה-AI!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 max-h-[40vh] overflow-y-auto pr-1">
            {summaries.map((summary) => (
              <div
                key={summary.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition relative group"
              >
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      summary.createdVia === "AUTO"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : summary.createdVia === "ON_DEMAND"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {summary.createdVia === "AUTO"
                      ? "🤖 אוטומטי"
                      : summary.createdVia === "ON_DEMAND"
                        ? "✨ מוזמן מ-AI"
                        : "✍️ ידני"}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {new Date(summary.createdAt).toLocaleDateString("he-IL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

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
    </div>
  );
};
