import React, { useState, useEffect } from "react";
import type { Campaign } from "../../../types/campaign";

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onUpdateCampaign: (
    id: string,
    updates: { title?: string; description?: string; bgUrl?: string },
  ) => Promise<void>;
  onToggleStatus: (id: string, currentStatus?: string) => void;
  onDeleteCampaign: (id: string) => void;
}

export const EditCampaignModal: React.FC<EditCampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onUpdateCampaign,
  onToggleStatus,
  onDeleteCampaign,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bgUrl, setBgUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // סנכרון השדות בטופס רק כשנפתח מודאל או כשמחלפים קמפיין
  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title || "");
      setDescription(campaign.description || "");
      setBgUrl(campaign.bgUrl || "");
    }
  }, [campaign?.id]); // 👈 שינוי מ-[campaign] ל-[campaign?.id]

  // סנכרון בלייב של השדות בכל שינוי ב-campaign (כולל סטטוס)
  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title || "");
      setDescription(campaign.description || "");
      setBgUrl(campaign.bgUrl || "");
    }
  }, [campaign]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !campaign) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    await onUpdateCampaign(campaign.id, {
      title: title.trim(),
      description: description.trim(),
      bgUrl: bgUrl.trim(),
    });
    setLoading(false);
    onClose();
  };

  const isActive = campaign.status === "active";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-5">
          <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            ⚙️ עריכת קמפיין
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-lg p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* טופס עריכה */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              שם הקמפיין
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              תיאור
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              🖼️ קישור לתמונת רקע (URL)
            </label>
            <input
              type="url"
              value={bgUrl}
              onChange={(e) => setBgUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg disabled:opacity-50"
            >
              {loading ? "שומר..." : "שמור שינויים"}
            </button>
          </div>
        </form>

        <hr className="border-slate-800 my-6" />

        {/* פעולות נוספות */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-300">
            ⚡ פעולות נוספות
          </h4>

          {/* החלפת סטטוס בלייב */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-200">סטטוס הקמפיין</p>
              <p className="text-[10px] text-slate-400">
                לחץ להחלפה מיידית בין Active ל-Completed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleStatus(campaign.id, campaign.status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30"
              }`}
            >
              {isActive ? "● Active" : "Completed"}
            </button>
          </div>

          {/* מחיקה */}
          <div className="flex items-center justify-between bg-rose-950/20 p-3 rounded-xl border border-rose-500/20">
            <div>
              <p className="text-xs font-bold text-rose-300">מחיקת הקמפיין</p>
              <p className="text-[10px] text-rose-400/70">
                פעולה זו תמחק את הקמפיין לצמיתות.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `האם אתה בטוח שברצונך למחוק את "${campaign.title}"?`,
                  )
                ) {
                  onDeleteCampaign(campaign.id);
                  onClose();
                }
              }}
              className="px-3 py-1.5 bg-rose-900/40 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition"
            >
              🗑️ מחק קמפיין
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
