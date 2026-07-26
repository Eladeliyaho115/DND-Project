import React, { useState } from "react";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string, bgUrl: string) => Promise<void>;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bgUrl, setBgUrl] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    await onCreate(title, description, bgUrl);
    setLoading(false);
    setTitle("");
    setDescription("");
    setBgUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-100">
        <h2 className="text-2xl font-bold text-amber-400 mb-4">יצירת קמפיין חדש</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">שם הקמפיין</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: Curse of Strahd"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">תיאור קצר</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור המערכה והעולם..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">קישור לתמונת רקע (URL)</label>
            <input
              type="url"
              value={bgUrl}
              onChange={(e) => setBgUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg disabled:opacity-50"
            >
              {loading ? "יוצר..." : "צור קמפיין"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};