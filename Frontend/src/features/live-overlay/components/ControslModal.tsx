import React, { useState } from 'react';
import type { Character } from '../../../types/character';
import { AddCharacterModal } from './AddCharacterModal';

interface DmControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  onAddCharacter: (newChar: Character) => void;
  onRemoveCharacter: (id: string) => void;
  onUpdateBg: (newBgUrl: string) => void;
}

export const DmControlsModal: React.FC<DmControlsModalProps> = ({
  isOpen,
  onClose,
  characters,
  onAddCharacter,
  onRemoveCharacter,
  onUpdateBg,
}) => {
  const [bgInput, setBgInput] = useState('');
  const [isAddCharOpen, setIsAddCharOpen] = useState(false);

  if (!isOpen) return null;

  const handleBgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bgInput.trim()) {
      onUpdateBg(bgInput.trim());
      setBgInput('');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-5">
            <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2">
              ⚙️ DM Controls
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 text-lg p-1"
            >
              ✕
            </button>
          </div>

          {/* חלק 1: ניהול דמויות */}
          <section className="mb-6">
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

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={char.avatarUrl}
                      alt={char.name}
                      className="w-8 h-8 rounded-lg object-cover border border-amber-500/40"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-200">{char.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {char.class} • Lvl {char.level} ({char.player})
                      </p>
                    </div>
                  </div>

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
              ))}
            </div>
          </section>

          <hr className="border-slate-800 my-4" />

          {/* חלק 2: שינוי רקע */}
          <section>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">
              🖼️ שינוי תמונת רקע (URL)
            </h4>
            <form onSubmit={handleBgSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="הדבק קישור לתמונה..."
                value={bgInput}
                onChange={(e) => setBgInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
        </div>
      </div>

      {/* מודאל הוספת דמות מ-D&D Beyond */}
      <AddCharacterModal
        isOpen={isAddCharOpen}
        onClose={() => setIsAddCharOpen(false)}
        onAddCharacter={(newChar) => {
          onAddCharacter(newChar);
          setIsAddCharOpen(false);
        }}
      />
    </>
  );
};