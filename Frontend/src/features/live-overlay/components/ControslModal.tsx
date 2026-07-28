import React, { useState, useEffect } from "react";
import type { Character } from "../../../types/character";
import { AddCharacterModal } from "./AddCharacterModal";
import { uploadCharacterSheetPDF } from "../../../services/characterSheetPDFService";
import { CampaignSummaries } from "./CampaignSummaries";

interface ControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
  characters: Character[];
  onAddCharacter: (newChar: Character) => void;
  onRemoveCharacter: (id: string) => void;
  onUpdateBg: (newBgUrl: string) => void;
  onUpdateMapUrl?: (newMapUrl: string) => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  characters,
  onAddCharacter,
  onRemoveCharacter,
  onUpdateBg,
  onUpdateMapUrl,
}) => {
  const [bgInput, setBgInput] = useState("");
  const [mapInput, setMapInput] = useState("");
  const [isAddCharOpen, setIsAddCharOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"controls" | "summaries">("controls");

  const [uploadingCharId, setUploadingCharId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isAddCharOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isAddCharOpen, onClose]);

  if (!isOpen) return null;

  const handleBgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = bgInput.trim();
    if (trimmed) {
      onUpdateBg(trimmed);
      setBgInput("");
    }
  };

  const handleMapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = mapInput.trim();
    if (trimmed && onUpdateMapUrl) {
      onUpdateMapUrl(trimmed);
      setMapInput("");
    }
  };

  const handleFileUpload = async (char: Character, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !campaignId) return;

    if (file.type !== "application/pdf") {
      setUploadMessage({ type: "error", text: "נא לבחור קובץ PDF בלבד" });
      return;
    }

    const charIdentifier = char.id || char.beyondId || null;

    try {
      setUploadingCharId(charIdentifier);
      setUploadMessage(null);

      await uploadCharacterSheetPDF({
        campaignId,
        characterName: char.name,
        file,
      });

      setUploadMessage({ type: "success", text: `דף הדמות של ${char.name} הועלה בהצלחה!` });
    } catch (error) {
      console.error("Error uploading sheet:", error);
      setUploadMessage({ type: "error", text: `שגיאה בהעלאת דף הדמות של ${char.name}` });
    } finally {
      setUploadingCharId(null);
      e.target.value = "";
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              ⚙️ DM Controls
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 text-lg p-1 transition-colors"
              aria-label="סגור חלון"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-800 pb-3 mb-4">
            <button
              onClick={() => setActiveTab("controls")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === "controls"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              ⚙️ הגדרות ודמויות
            </button>
            <button
              onClick={() => setActiveTab("summaries")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "summaries"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-slate-800/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              📜 סיכומי קמפיין
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            {activeTab === "controls" ? (
              <>
                {uploadMessage && (
                  <div
                    className={`p-2 text-xs rounded-lg text-center border ${
                      uploadMessage.type === "success"
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                        : "bg-rose-950/40 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {uploadMessage.text}
                  </div>
                )}

                {/* 1. ניהול דמויות */}
                <section>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-slate-300">
                      👥 ניהול דמויות בקמפיין ({characters.length})
                    </h4>
                    <button
                      onClick={() => setIsAddCharOpen(true)}
                      className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                    >
                      <span>+</span> הוסף דמות מ-Beyond
                    </button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {characters.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                        אין דמויות בקמפיין כרגע.
                      </p>
                    ) : (
                      characters.map((char) => {
                        const currentCharId = char.id || char.beyondId;
                        const isUploadingThis = uploadingCharId === currentCharId;

                        return (
                          <div
                            key={currentCharId}
                            className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"
                          >
                            <div className="flex items-center gap-3">
                              {char.avatarUrl ? (
                                <img
                                  src={char.avatarUrl}
                                  alt={char.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-amber-500/40"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
                                  🛡️
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-slate-200">
                                  {char.name || "דמות ללא שם"}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {char.class || "לא הוגדר"} • Lvl {char.level || 1} ({char.player || "ללא שחקן"})
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <label
                                className={`cursor-pointer text-xs p-1.5 rounded-lg border transition ${
                                  isUploadingThis
                                    ? "bg-amber-900/60 border-amber-500/50 text-amber-300 cursor-wait"
                                    : "bg-slate-800/40 hover:bg-slate-700 border-slate-600/50 text-slate-300"
                                }`}
                                title="העלה דף דמות (PDF)"
                              >
                                {isUploadingThis ? "⏳" : "📄"}
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  disabled={isUploadingThis}
                                  onChange={(e) => handleFileUpload(char, e)}
                                />
                              </label>

                              <button
                                onClick={() => {
                                  if (window.confirm(`להסיר את ${char.name} מהקמפיין?`)) {
                                    onRemoveCharacter(char.id);
                                  }
                                }}
                                className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 p-1.5 rounded-lg border border-rose-500/20 transition"
                                title="הסר דמות"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

                <hr className="border-slate-800 my-4" />

                {/* 2. שינוי תמונת מפת עולם */}
                <section>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">
                    🗺️ שינוי תמונת מפת עולם (URL)
                  </h4>
                  <form onSubmit={handleMapSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="הדבק קישור למפה..."
                      value={mapInput}
                      onChange={(e) => setMapInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                    <button
                      type="submit"
                      disabled={!mapInput.trim()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-400 font-bold text-xs rounded-xl transition"
                    >
                      עדכן מפה
                    </button>
                  </form>
                </section>

                <hr className="border-slate-800 my-4" />

                {/* 3. שינוי תמונת רקע קמפיין */}
                <section>
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">
                    🖼️ שינוי תמונת רקע קמפיין (URL)
                  </h4>
                  <form onSubmit={handleBgSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="הדבק קישור לתמונה..."
                      value={bgInput}
                      onChange={(e) => setBgInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                    <button
                      type="submit"
                      disabled={!bgInput.trim()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-amber-400 font-bold text-xs rounded-xl transition"
                    >
                      עדכן
                    </button>
                  </form>
                </section>
              </>
            ) : (
              <section className="py-2">
                {campaignId ? (
                  <CampaignSummaries campaignId={campaignId} />
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">
                    לא נבחר קמפיין פעיל לשליפת סיכומים.
                  </p>
                )}
              </section>
            )}
          </div>
        </div>
      </div>

      <AddCharacterModal
        isOpen={isAddCharOpen}
        onClose={() => setIsAddCharOpen(false)}
        campaignId={campaignId}
        onAddCharacter={(newChar) => {
          onAddCharacter(newChar);
          setIsAddCharOpen(false);
        }}
      />
    </>
  );
};