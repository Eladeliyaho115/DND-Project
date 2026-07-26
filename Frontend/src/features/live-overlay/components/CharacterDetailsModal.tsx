import React, { useState } from "react";
import type { Character } from "../../../types/character";
import { useDndCharacter } from "../../../hooks/useDndCharacter";

interface CharacterDetailsModalProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterDetailsModal: React.FC<CharacterDetailsModalProps> = ({
  character: initialCharacter,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    "stats" | "spells" | "inventory" | "features"
  >("stats");

  // משיכת נתוני Live מ-D&D Beyond בזמן שהחלון פתוח
  const {
    character: liveCharacter,
    loading,
    error,
  } = useDndCharacter(
    isOpen ? initialCharacter.beyondId || "" : "",
    5000,
  );

  if (!isOpen) return null;

  // שימוש בנתוני Live אם קיימים, אחרת בנתונים הסטטיים
  const displayChar =
    initialCharacter.beyondId && liveCharacter
      ? liveCharacter
      : initialCharacter;

  const getMod = (val?: number) => {
    if (val === undefined) return "+0";
    const mod = Math.floor((val - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const statsList = [
    {
      label: "Strength",
      key: "str",
      short: "STR",
      val: displayChar.stats?.str,
    },
    {
      label: "Dexterity",
      key: "dex",
      short: "DEX",
      val: displayChar.stats?.dex,
    },
    {
      label: "Constitution",
      key: "con",
      short: "CON",
      val: displayChar.stats?.con,
    },
    {
      label: "Intelligence",
      key: "int",
      short: "INT",
      val: displayChar.stats?.int,
    },
    { label: "Wisdom", key: "wis", short: "WIS", val: displayChar.stats?.wis },
    {
      label: "Charisma",
      key: "cha",
      short: "CHA",
      val: displayChar.stats?.cha,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header / כותרת + תמונה וסטאטוס סנכרון */}
        <div className="relative p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-indigo-500/40 bg-slate-800 overflow-hidden shrink-0">
              {displayChar.avatarUrl ? (
                <img
                  src={displayChar.avatarUrl}
                  alt={displayChar.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                  {displayChar.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">
                  {displayChar.name}
                </h2>
                {initialCharacter.beyondId && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      loading
                        ? "text-amber-400 border-amber-500/30 animate-pulse"
                        : error
                          ? "text-rose-400 border-rose-500/30"
                          : "text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {loading ? "SYNC" : error ? "OFFLINE" : "LIVE"}
                  </span>
                )}
              </div>
              <p className="text-sm text-indigo-400 font-medium">
                {displayChar.class} • רמה {displayChar.level}
              </p>
              <p className="text-xs text-slate-400">
                שחקן: {displayChar.player}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* לשוניות ניווט (Tabs) */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          {[
            { id: "stats", label: "תכונות וסטטיסטיקה" },
            {
              id: "spells",
              label: `לחשים (${displayChar.spells?.length || 0})`,
            },
            {
              id: "inventory",
              label: `ציוד (${displayChar.inventory?.length || 0})`,
            },
            {
              id: "features",
              label: `יכולות (${displayChar.features?.length || 0})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* תוכן הטאבים */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* טאב 1: תכונות וסטטיסטיקה */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {statsList.map((stat) => (
                  <div
                    key={stat.key}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center"
                  >
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      {stat.short}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {stat.val ?? 10}
                    </span>
                    <span className="text-xs font-semibold text-indigo-400 block">
                      {getMod(stat.val)}
                    </span>
                  </div>
                ))}
              </div>

              {/* נתוני קרב נוספים */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 font-semibold block">
                    דרגת שריון (AC)
                  </span>
                  <span className="text-2xl font-extrabold text-white">
                    {displayChar.ac}
                  </span>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 font-semibold block">
                    נקודות פגיעה (HP)
                  </span>
                  <span className="text-2xl font-extrabold text-rose-400">
                    {displayChar.hp.current} / {displayChar.hp.max}
                  </span>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 font-semibold block">
                    יוזמה
                  </span>
                  <span className="text-2xl font-extrabold text-amber-400">
                    {displayChar.initiative !== undefined
                      ? displayChar.initiative >= 0
                        ? `+${displayChar.initiative}`
                        : displayChar.initiative
                      : getMod(displayChar.stats?.dex)}
                  </span>
                </div>
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 font-semibold block">
                    מהירות תנועה
                  </span>
                  <span className="text-2xl font-extrabold text-sky-400">
                    {displayChar.speed || 30} ft
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* טאב 2: לחשים */}
          {activeTab === "spells" && (
            <div className="space-y-3">
              {displayChar.spells && displayChar.spells.length > 0 ? (
                displayChar.spells.map((spell, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">
                        {spell.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {spell.description || "אין תיאור זמין"}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800/50 rounded text-[10px] font-bold shrink-0">
                      דרגה {spell.level ?? 0}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  אין לחשים רשומים לדמות זו.
                </div>
              )}
            </div>
          )}

          {/* טאב 3: ציוד */}
          {activeTab === "inventory" && (
            <div className="space-y-2">
              {displayChar.inventory && displayChar.inventory.length > 0 ? (
                displayChar.inventory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-slate-200">
                      {item.name}
                    </span>
                    <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2.5 py-1 rounded-md">
                      כמות: {item.quantity ?? 1}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  אין ציוד רשום לדמות זו.
                </div>
              )}
            </div>
          )}

          {/* טאב 4: יכולות */}
          {activeTab === "features" && (
            <div className="space-y-3">
              {displayChar.features && displayChar.features.length > 0 ? (
                displayChar.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl"
                  >
                    <h4 className="font-bold text-slate-100 text-sm">
                      {feat.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {feat.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  אין יכולות רשומות לדמות זו.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / פוטר סגירה */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

// import React, { useState } from 'react';
// import type { Character } from '../../../types/character';
// import { useDndCharacter } from '../../../hooks/useDndCharacter';

// interface CharacterDetailsModalProps {
//   character: Character;
//   isOpen: boolean;
//   onClose: () => void;
// }

// export const CharacterDetailsModal: React.FC<CharacterDetailsModalProps> = ({
//   character: initialCharacter,
//   isOpen,
//   onClose,
// }) => {
//   const [activeTab, setActiveTab] = useState<'stats' | 'spells' | 'inventory' | 'features'>('stats');

//   // משיכת נתוני Live מ-D&D Beyond בזמן שהחלון פתוח
//   const { character: liveCharacter, loading, error } = useDndCharacter(
//     isOpen ? initialCharacter.dndCharacterId || '' : '',
//     5000
//   );

//   if (!isOpen) return null;

//   // שימוש בנתוני Live אם קיימים, אחרת בנתונים הסטטיים
//   const displayChar = initialCharacter.dndCharacterId && liveCharacter
//     ? liveCharacter
//     : initialCharacter;

//   const getMod = (val?: number) => {
//     if (val === undefined) return '+0';
//     const mod = Math.floor((val - 10) / 2);
//     return mod >= 0 ? `+${mod}` : `${mod}`;
//   };

//   const statsList = [
//     { label: 'Strength', key: 'str', short: 'STR', val: displayChar.stats?.str },
//     { label: 'Dexterity', key: 'dex', short: 'DEX', val: displayChar.stats?.dex },
//     { label: 'Constitution', key: 'con', short: 'CON', val: displayChar.stats?.con },
//     { label: 'Intelligence', key: 'int', short: 'INT', val: displayChar.stats?.int },
//     { label: 'Wisdom', key: 'wis', short: 'WIS', val: displayChar.stats?.wis },
//     { label: 'Charisma', key: 'cha', short: 'CHA', val: displayChar.stats?.cha },
//   ];

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" dir="rtl">
//       <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

//         {/* Header / כותרת + תמונה וסטאטוס סנכרון */}
//         <div className="relative p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <div className="w-16 h-16 rounded-xl border-2 border-indigo-500/40 bg-slate-800 overflow-hidden shrink-0">
//               {displayChar.avatarUrl ? (
//                 <img src={displayChar.avatarUrl} alt={displayChar.name} className="w-full h-full object-cover" />
//               ) : (
//                 <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
//                   {displayChar.name.charAt(0)}
//                 </div>
//               )}
//             </div>
//             <div>
//               <div className="flex items-center gap-2">
//                 <h2 className="text-2xl font-bold text-white">{displayChar.name}</h2>
//                 {initialCharacter.dndCharacterId && (
//                   <span
//                     className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
//                       loading
//                         ? 'text-amber-400 border-amber-500/30 animate-pulse'
//                         : error
//                         ? 'text-rose-400 border-rose-500/30'
//                         : 'text-emerald-400 border-emerald-500/30'
//                     }`}
//                   >
//                     {loading ? 'SYNC' : error ? 'OFFLINE' : 'LIVE'}
//                   </span>
//                 )}
//               </div>
//               <p className="text-sm text-indigo-400 font-medium">
//                 {displayChar.class} • רמה {displayChar.level}
//               </p>
//               <p className="text-xs text-slate-400">שחקן: {displayChar.player}</p>
//             </div>
//           </div>

//           <button
//             onClick={onClose}
//             className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors"
//           >
//             ✕
//           </button>
//         </div>

//         {/* לשוניות ניווט (Tabs) */}
//         <div className="flex border-b border-slate-800 bg-slate-950/50">
//           {[
//             { id: 'stats', label: 'תכונות וסטטיסטיקה' },
//             { id: 'spells', label: `לחשים (${displayChar.spells?.length || 0})` },
//             { id: 'inventory', label: `ציוד (${displayChar.inventory?.length || 0})` },
//             { id: 'features', label: `יכולות (${displayChar.features?.length || 0})` },
//           ].map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id as any)}
//               className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
//                 activeTab === tab.id
//                   ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
//                   : 'border-transparent text-slate-400 hover:text-slate-200'
//               }`}
//             >
//               {tab.label}
//             </button>
//           ))}
//         </div>

//         {/* תוכן הטאבים */}
//         <div className="p-6 overflow-y-auto flex-1 space-y-6">

//           {/* טאב 1: תכונות וסטטיסטיקה */}
//           {activeTab === 'stats' && (
//             <div className="space-y-6">
//               {/* Stats Grid */}
//               <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
//                 {statsList.map((stat) => (
//                   <div key={stat.key} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
//                     <span className="text-[10px] font-bold text-slate-400 block uppercase">{stat.short}</span>
//                     <span className="text-lg font-bold text-white">{stat.val ?? 10}</span>
//                     <span className="text-xs font-semibold text-indigo-400 block">{getMod(stat.val)}</span>
//                   </div>
//                 ))}
//               </div>

//               {/* נתוני קרב נוספים */}
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//                 <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
//                   <span className="text-xs text-slate-400 font-semibold block">דרגות שריון (AC)</span>
//                   <span className="text-2xl font-extrabold text-white">{displayChar.ac}</span>
//                 </div>
//                 <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
//                   <span className="text-xs text-slate-400 font-semibold block">נקודות פגיעה (HP)</span>
//                   <span className="text-2xl font-extrabold text-rose-400">
//                     {displayChar.hp.current} / {displayChar.hp.max}
//                   </span>
//                 </div>
//                 <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
//                   <span className="text-xs text-slate-400 font-semibold block">יוזמה</span>
//                   <span className="text-2xl font-extrabold text-amber-400">
//                     {displayChar.initiative !== undefined
//                       ? (displayChar.initiative >= 0 ? `+${displayChar.initiative}` : displayChar.initiative)
//                       : getMod(displayChar.stats?.dex)}
//                   </span>
//                 </div>
//                 <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center">
//                   <span className="text-xs text-slate-400 font-semibold block">מהירות תנועה</span>
//                   <span className="text-2xl font-extrabold text-sky-400">{displayChar.speed || 30} ft</span>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* טאב 2: לחשים */}
//           {activeTab === 'spells' && (
//             <div className="space-y-3">
//               {displayChar.spells && displayChar.spells.length > 0 ? (
//                 displayChar.spells.map((spell, idx) => (
//                   <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start justify-between gap-4">
//                     <div>
//                       <h4 className="font-bold text-slate-100 text-sm">{spell.name}</h4>
//                       <p className="text-xs text-slate-400 mt-1">{spell.description || 'אין תיאור זמין'}</p>
//                     </div>
//                     <span className="px-2 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800/50 rounded text-[10px] font-bold shrink-0">
//                       דרגה {spell.level ?? 0}
//                     </span>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-center py-8 text-slate-500 text-sm">אין לחשים רשומים לדמות זו.</div>
//               )}
//             </div>
//           )}

//           {/* טאב 3: ציוד */}
//           {activeTab === 'inventory' && (
//             <div className="space-y-2">
//               {displayChar.inventory && displayChar.inventory.length > 0 ? (
//                 displayChar.inventory.map((item, idx) => (
//                   <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
//                     <span className="text-sm font-medium text-slate-200">{item.name}</span>
//                     <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2.5 py-1 rounded-md">
//                       כמות: {item.quantity ?? 1}
//                     </span>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-center py-8 text-slate-500 text-sm">אין ציוד רשום לדמות זו.</div>
//               )}
//             </div>
//           )}

//           {/* טאב 4: יכולות */}
//           {activeTab === 'features' && (
//             <div className="space-y-3">
//               {displayChar.features && displayChar.features.length > 0 ? (
//                 displayChar.features.map((feat, idx) => (
//                   <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
//                     <h4 className="font-bold text-slate-100 text-sm">{feat.name}</h4>
//                     <p className="text-xs text-slate-400 mt-1">{feat.description}</p>
//                   </div>
//                 ))
//               ) : (
//                 <div className="text-center py-8 text-slate-500 text-sm">אין יכולות רשומות לדמות זו.</div>
//               )}
//             </div>
//           )}

//         </div>

//         {/* Footer / פוטר סגירה */}
//         <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl transition-colors"
//           >
//             סגור
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// };
