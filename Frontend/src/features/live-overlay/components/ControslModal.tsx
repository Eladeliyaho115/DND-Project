import React, { useState } from "react";
import type { Character } from "../../../types/character";
import { AddCharacterModal } from "./AddCharacterModal";
import { CampaignSummaries } from "./CampaignSummaries";
import { FullscreenButton } from "./../../../components/FullscreenButton";
import { useControlsModal } from "./../../../hooks/useControlsModal";
import { UrlInputSection } from "./../../../components/UrlInputSection";
import { CharacterRow } from "./CharacterRow";

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
  const [isAddCharOpen, setIsAddCharOpen] = useState(false);

  const {
    bgInput,
    setBgInput,
    mapInput,
    setMapInput,
    activeTab,
    setActiveTab,
    uploadingCharId,
    uploadMessage,
    handleBgSubmit,
    handleMapSubmit,
    handleFileUpload,
  } = useControlsModal(
    isOpen,
    isAddCharOpen,
    onClose,
    campaignId,
    onUpdateBg,
    onUpdateMapUrl,
  );

  if (!isOpen) return null;

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
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === "controls" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}
            >
              ⚙️ הגדרות ודמויות
            </button>
            <button
              onClick={() => setActiveTab("summaries")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === "summaries" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-slate-800/50 text-slate-400 hover:text-slate-200"}`}
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
                    className={`p-2 text-xs rounded-lg text-center border ${uploadMessage.type === "success" ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30" : "bg-rose-950/40 text-rose-400 border-rose-500/30"}`}
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
                        return (
                          <CharacterRow
                            key={currentCharId}
                            character={char}
                            isUploading={uploadingCharId === currentCharId}
                            onFileUpload={(e) => handleFileUpload(char, e)}
                            onRemove={() =>
                              window.confirm(
                                `להסיר את ${char.name} מהקמפיין?`,
                              ) && onRemoveCharacter(char.id)
                            }
                          />
                        );
                      })
                    )}
                  </div>
                </section>

                <hr className="border-slate-800 my-4" />

                {/* 2. שינוי תמונת מפת עולם */}
                <UrlInputSection
                  title="🗺️ שינוי תמונת מפת עולם (URL)"
                  placeholder="הדבק קישור למפה..."
                  buttonText="עדכן מפה"
                  value={mapInput}
                  onChange={setMapInput}
                  onSubmit={handleMapSubmit}
                />

                <hr className="border-slate-800 my-4" />

                {/* 3. שינוי תמונת רקע קמפיין */}
                <UrlInputSection
                  title="🖼️ שינוי תמונת רקע קמפיין (URL)"
                  placeholder="הדבק קישור לתמונה..."
                  buttonText="עדכן"
                  value={bgInput}
                  onChange={setBgInput}
                  onSubmit={handleBgSubmit}
                />

                <hr className="border-slate-800 my-4" />

                {/* 🖥️ 4. הגדרות תצוגה ומסך מלא */}
                <section className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300">
                      📺 תצוגת מסך מלא
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      מעבר בין מצב מסך מלא לתצוגה רגילה
                    </p>
                  </div>

                  <FullscreenButton className="relative bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center" />
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
