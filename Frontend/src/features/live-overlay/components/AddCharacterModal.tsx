import React, { useState } from "react";
import { fetchDndBeyondCharacter } from "../../../services/dndBeyondService";
import type { Character } from "../../../types/character";

interface AddCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCharacter: (newChar: Character) => void;
}

export const AddCharacterModal: React.FC<AddCharacterModalProps> = ({
  isOpen,
  onClose,
  onAddCharacter,
}) => {
  const [inputUrlOrId, setInputUrlOrId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // חילוץ ID במידה והוזן URL מלא
  const extractCharacterId = (text: string): string => {
    const cleanText = text.trim();
    const match = cleanText.match(/characters\/(\d+)/);
    return match ? match[1] : cleanText;
  };

  const handleFetchAndAdd = async () => {
    const charId = extractCharacterId(inputUrlOrId);
    if (!charId) {
      setError("נא להזין ID או קישור תקין מ-D&D Beyond");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedChar = await fetchDndBeyondCharacter(charId);

      const newChar: Character = {
        ...fetchedChar,
        dndCharacterId: charId,
      };

      onAddCharacter(newChar);
      setInputUrlOrId("");
      onClose();
    } catch (err: any) {
      setError(
        "לא ניתן למשוך את הדמות. וודא שה-ID תקין והדמות מוגדרת כ-Public.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-slate-100">
        <h3 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
          ➕ הוספת דמות מ-D&D Beyond
        </h3>

        <label className="block text-xs text-slate-300 mb-2">
          הדבק ID או קישור מלא לדמות (למשל 168759027):
        </label>

        <input
          type="text"
          placeholder="https://www.dndbeyond.com/characters/..."
          value={inputUrlOrId}
          onChange={(e) => setInputUrlOrId(e.target.value)}
          disabled={loading}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition mb-3"
        />

        {error && (
          <p className="text-xs text-rose-400 mb-3 font-semibold bg-rose-950/40 p-2 rounded-lg border border-rose-500/20">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            ביטול
          </button>
          <button
            onClick={handleFetchAndAdd}
            disabled={loading || !inputUrlOrId.trim()}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span> טוען מ-Beyond...
              </>
            ) : (
              "הוסף דמות"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
