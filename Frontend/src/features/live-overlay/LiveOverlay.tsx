import React, { useState } from 'react';
import type { Campaign } from '../../types/campaign';
import type { Character } from '../../types/character';
import { CharacterCard } from './components/CharacterCard';
import { DmControlsModal } from './components/ControslModal';
import { GeminiChatDrawer } from './components/GeminiChatDrawer';
import { deleteCharacterFromDb, updateCampaignBackground } from '../../services/dndBeyondService';

interface LiveOverlayProps {
  campaign: Campaign;
  onBack: () => void;
  onUpdateBg: (campaignId: string, newBgUrl: string) => void;
}

export const LiveOverlay: React.FC<LiveOverlayProps> = ({ campaign, onBack, onUpdateBg }) => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [characters, setCharacters] = useState<Character[]>(campaign.characters);
  const [currentBg, setCurrentBg] = useState<string>(campaign.bgUrl);

  const handleAddCharacter = (newChar: Character) => {
    setCharacters((prev) => [...prev, newChar]);
  };

  const handleRemoveCharacter = async (idToRemove: string) => {
    try {
      await deleteCharacterFromDb(idToRemove);
      setCharacters((prev) => prev.filter((c) => c.id !== idToRemove));
    } catch (error) {
      console.error("Failed to delete character:", error);
      alert("שגיאה במחיקת הדמות מהשרת");
    }
  };

  const handleUpdateBg = async (campaignId: string, newBgUrl: string) => {
    try {
      await updateCampaignBackground(campaignId, newBgUrl);
      setCurrentBg(newBgUrl);
      onUpdateBg(campaignId, newBgUrl);
    } catch (error) {
      console.error("Failed to update background:", error);
      alert("שגיאה בעדכון התמונה בשרת");
    }
  };

  const handleOpenDndBeyond = (character: Character) => {
    const charBeyondId = character.dndCharacterId || character.beyondId;
    if (!charBeyondId) {
      alert('לדמות זו אין מזהה D&D Beyond מוגדר.');
      return;
    }

    const width = 700;
    const height = 500;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const windowFeatures = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
      'status=no',
      'menubar=no',
      'toolbar=no',
      'location=no',
    ].join(',');

    const url = `https://www.dndbeyond.com/characters/${charBeyondId}`;
    const windowName = `dnd_char_${charBeyondId}`;

    const newWindow = window.open(url, windowName, windowFeatures);
    if (newWindow) {
      newWindow.focus();
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Dynamic Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
        style={{ backgroundImage: `url(${currentBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/80" />
      </div>

      {/* Main UI */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-amber-500/30 pb-4 bg-slate-900/60 backdrop-blur-md px-6 rounded-xl border border-amber-500/20 shadow-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-xs text-slate-400 hover:text-amber-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              ← Back to Hub
            </button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-amber-400 uppercase drop-shadow">
              {campaign.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsChatOpen((prev) => !prev)}
              className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 shadow-lg"
            >
              <span>✨</span>
              <span>Gemini AI</span>
            </button>

            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-xs bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition font-medium"
            >
              ⚙ DM Controls
            </button>
          </div>
        </header>

        {/* Center Space */}
        <main className="flex-1" />

        {/* Character Cards Footer */}
        <footer className="flex items-center justify-center gap-6 max-w-6xl mx-auto w-full overflow-x-auto pb-2">
          {characters.map((char) => (
            <CharacterCard 
              key={char.id} 
              character={char} 
              onOpenDetails={handleOpenDndBeyond}
            />
          ))}
        </footer>
      </div>

      {/* Gemini AI Chat Drawer */}
      <GeminiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* DM Controls Modal */}
      <DmControlsModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        campaignId={campaign.id}
        characters={characters}
        onAddCharacter={handleAddCharacter}
        onRemoveCharacter={handleRemoveCharacter}
        onUpdateBg={(newBg) => handleUpdateBg(campaign.id, newBg)}
      />
    </div>
  );
};