import React from "react";
import type { Character } from "../../../types/character";
import { useDndCharacter } from "../../../hooks/useDndCharacter";
import styles from "@styles/CharacterCard.module.css";

interface CharacterCardProps {
  character: Character;
  onOpenDetails?: (character: Character) => void;
}

// ----------------------------------------------------------------------
// פונקציות עזר (Helpers) - מחוץ לקומפוננטה למניעת יצירה מחדש בכל Render
// ----------------------------------------------------------------------

// חישוב Modifier מתוך ערך Attribute
const getMod = (val?: number): string => {
  if (val === undefined || val === null) return "+0";
  const mod = Math.floor((val - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

// חישוב Modifier מספרי (עבור פסיביים)
const getNumericMod = (val?: number): number => {
  if (val === undefined || val === null) return 0;
  return Math.floor((val - 10) / 2);
};

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character: initialCharacter,
  onOpenDetails,
}) => {
  // 1. חילוץ בטוח של ה-ID
  const characterId =
    initialCharacter?.beyondId ||
    (initialCharacter as { beyondId?: string }).beyondId ||
    "";

  // 2. סנכרון בלייב מול D&D Beyond
  const {
    character: liveCharacter,
    loading,
    error,
  } = useDndCharacter(characterId, 5000);

  // 3. קביעת האובייקט להצגה (Live תמיד קודם ל-Initial)
  const displayChar =
    characterId && liveCharacter ? liveCharacter : initialCharacter;

  // 4. חילוץ נתונים וחישובים מרוכזים
  const stats = displayChar?.stats || {};
  const level = displayChar?.level || 1;
  const currentHp = displayChar?.hp?.current ?? 0;
  const maxHp = displayChar?.hp?.max ?? 1;
  const tempHp = displayChar?.hp?.temp ?? 0;

  const hpPercentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  const getHpColorClass = () => {
    if (hpPercentage > 50) return styles?.hpHigh || "bg-emerald-500";
    if (hpPercentage > 20) return styles?.hpMedium || "bg-amber-500";
    return styles?.hpLow || "bg-rose-600 animate-pulse";
  };

  // 5. חישוב Proficiency & Passive Skills
  const proficiencyBonus =
    displayChar?.proficiencyBonus ?? Math.ceil(1 + level / 4);
  const wisMod = getNumericMod(stats.wis);
  const intMod = getNumericMod(stats.int);

  const passivePerception =
    displayChar?.passiveSkills?.perception ?? 10 + wisMod;
  const passiveInvestigation =
    displayChar?.passiveSkills?.investigation ?? 10 + intMod;
  const passiveInsight = displayChar?.passiveSkills?.insight ?? 10 + wisMod;

  const statList = [
    { label: "STR", val: stats.str },
    { label: "DEX", val: stats.dex },
    { label: "CON", val: stats.con },
    { label: "INT", val: stats.int },
    { label: "WIS", val: stats.wis },
    { label: "CHA", val: stats.cha },
  ];

  return (
    <div className="w-80 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 flex flex-col">
      {/* Header / תמונה + פרטים בסיסיים */}
      <div className="relative h-28 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-500/30 bg-slate-800 flex items-center justify-center shrink-0">
            {displayChar?.avatarUrl ? (
              <img
                src={displayChar.avatarUrl}
                alt={displayChar.name || "Character"}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-10 h-10 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>

          {/* Level Badge */}
          <span className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow">
            Lvl {level}
          </span>

          {/* Proficiency Bonus Badge */}
          <span
            title="Proficiency Bonus"
            className="absolute -top-1 -left-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-slate-900 shadow"
          >
            +{proficiencyBonus}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-lg font-bold text-white truncate">
              {displayChar?.name || "דמות ללא שם"}
            </h3>

            {/* אינדיקטור לייב מ-D&D Beyond */}
            {characterId && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                  loading
                    ? "text-amber-400 border-amber-500/30 animate-pulse"
                    : error
                      ? "text-rose-400 border-rose-500/30"
                      : "text-emerald-400 border-emerald-500/30"
                }`}
                title={error || (loading ? "Syncing..." : "Live D&D Beyond")}
              >
                {loading ? "SYNC" : error ? "OFF" : "LIVE"}
              </span>
            )}
          </div>
          <p className="text-sm text-indigo-400 font-medium truncate">
            {displayChar?.class || "לא הוגדר מקצוע"}
          </p>
          <div className={styles.subtitle}>
            {displayChar.race && <span>{displayChar.race} </span>}
          </div>
          <p className="text-xs text-slate-400 truncate">
            Player: {displayChar?.player || "לא הוגדר"}
          </p>
        </div>
      </div>

      {/* מד חיים (HP Bar) */}
      <div className="px-4 pt-3 pb-2 bg-slate-900/80 border-t border-slate-800">
        <div className="flex justify-between items-center text-xs font-semibold mb-1">
          <span className="flex items-center gap-1 text-rose-400">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            HP
          </span>
          <span>
            <strong className="text-white">{currentHp}</strong>
            <span className="text-slate-500"> / {maxHp}</span>
            {tempHp > 0 && (
              <span className="text-sky-400 text-[10px] ml-1">({tempHp}+)</span>
            )}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getHpColorClass()}`}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
      </div>

      {/* מדדים קריטיים (AC, Initiative, Speed) */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-slate-950/40 border-y border-slate-800/60 text-center">
        <div className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
            <svg
              className="w-3 h-3 text-sky-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            AC
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            {displayChar?.ac ?? 10}
          </div>
        </div>

        <div className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
            <svg
              className="w-3 h-3 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            יוזמה
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            {displayChar?.initiative !== undefined
              ? displayChar.initiative >= 0
                ? `+${displayChar.initiative}`
                : displayChar.initiative
              : getMod(stats.dex)}
          </div>
        </div>

        <div className="p-1.5 bg-slate-900/60 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase tracking-wider font-semibold">
            מהירות
          </div>
          <div className="text-lg font-bold text-white mt-0.5">
            {displayChar?.speed || 30}ft
          </div>
        </div>
      </div>

      {/* תכונות בסיסיות (Stats Modifiers) */}
      <div className="grid grid-cols-6 gap-1 px-4 py-2 text-center bg-slate-900">
        {statList.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-950/60 rounded py-1 border border-slate-800/40"
          >
            <div className="text-[9px] text-slate-400 font-bold">
              {stat.label}
            </div>
            <div className="text-xs font-bold text-slate-200">
              {getMod(stat.val)}
            </div>
          </div>
        ))}
      </div>

      {/* Passive Skills Bar */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-xs">
        <div className="flex items-center gap-1" title="Passive Perception">
          <span className="text-slate-400 text-[11px]">👁️ Perc:</span>
          <span className="font-bold text-amber-400">{passivePerception}</span>
        </div>
        <div className="w-px h-3 bg-slate-800" />
        <div className="flex items-center gap-1" title="Passive Investigation">
          <span className="text-slate-400 text-[11px]">🔍 Inv:</span>
          <span className="font-bold text-slate-200">
            {passiveInvestigation}
          </span>
        </div>
        <div className="w-px h-3 bg-slate-800" />
        <div className="flex items-center gap-1" title="Passive Insight">
          <span className="text-slate-400 text-[11px]">🧠 Ins:</span>
          <span className="font-bold text-slate-200">{passiveInsight}</span>
        </div>
      </div>

      {/* כפתור לפתיחת חלון הפרטים */}
      <button
        onClick={() => onOpenDetails && onOpenDetails(displayChar)}
        className="mt-auto w-full py-2 px-4 bg-slate-800/50 hover:bg-indigo-600 hover:text-white text-xs text-indigo-300 font-semibold flex items-center justify-center gap-1.5 border-t border-slate-800 transition-colors"
      >
        <span>פתח פרטים</span>
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </button>
    </div>
  );
};
