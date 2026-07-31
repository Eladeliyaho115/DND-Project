import React from "react";
import type { Character } from "../../../types/character"; // 👈 היבוא שחסר

interface CharacterRowProps {
  character: Character;
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

export const CharacterRow: React.FC<CharacterRowProps> = ({
  character,
  isUploading,
  onFileUpload,
  onRemove,
}) => (
  <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
    <div className="flex items-center gap-3">
      {character.avatarUrl ? (
        <img
          src={character.avatarUrl}
          alt={character.name}
          className="w-8 h-8 rounded-lg object-cover border border-amber-500/40"
        />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
          🛡️
        </div>
      )}
      <div>
        <p className="text-xs font-bold text-slate-200">
          {character.name || "דמות ללא שם"}
        </p>
        <p className="text-[10px] text-slate-400">
          {character.class || "לא הוגדר"} • Lvl {character.level || 1} (
          {character.player || "ללא שחקן"})
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <label
        className={`cursor-pointer text-xs p-1.5 rounded-lg border transition ${
          isUploading
            ? "bg-amber-900/60 border-amber-500/50 text-amber-300 cursor-wait"
            : "bg-slate-800/40 hover:bg-slate-700 border-slate-600/50 text-slate-300"
        }`}
        title="העלה דף דמות (PDF)"
      >
        {isUploading ? "⏳" : "📄"}
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={isUploading}
          onChange={onFileUpload}
        />
      </label>

      <button
        onClick={onRemove}
        className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 p-1.5 rounded-lg border border-rose-500/20 transition"
        title="הסר דמות"
      >
        🗑️
      </button>
    </div>
  </div>
);