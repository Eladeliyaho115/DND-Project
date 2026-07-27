import React, { useState, useEffect } from "react";
import type { Campaign } from "../../types/campaign";
import type { Character } from "../../types/character";
import { CharacterCard } from "./components/CharacterCard";
import { ControlsModal } from "./components/ControslModal";
import { GeminiChatDrawer } from "./components/GeminiChatDrawer";
import { DiceRoller } from "./components/DiceRoller"; // 👈 ייבוא ה-DiceRoller
import {
  deleteCharacterFromDb,
  updateCampaignBackground,
} from "../../services/dndBeyondService";

import styles from "@styles/LiveOverlay.module.css";

interface LiveOverlayProps {
  campaign: Campaign;
  onBack: () => void;
  onUpdateBg: (campaignId: string, newBgUrl: string) => void;
}

export const LiveOverlay: React.FC<LiveOverlayProps> = ({
  campaign,
  onBack,
  onUpdateBg,
}) => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [characters, setCharacters] = useState<Character[]>(
    campaign.characters,
  );
  const [currentBg, setCurrentBg] = useState<string>(campaign.bgUrl);

  // הוספת State לטריגר של גלגול הקוביות
  const [selectedNotation, setSelectedNotation] = useState<string | null>(null);

  // סנכרון ה-State המקומי אם ה-Campaign משתנה מבחוץ
  useEffect(() => {
    setCharacters(campaign.characters);
    setCurrentBg(campaign.bgUrl);
  }, [campaign]);

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
    const charBeyondId = character.beyondId;
    if (!charBeyondId) {
      alert("לדמות זו אין מזהה D&D Beyond מוגדר.");
      return;
    }

    const width = 700;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const windowFeatures = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      "resizable=yes",
      "scrollbars=yes",
      "status=no",
      "menubar=no",
      "toolbar=no",
      "location=no",
    ].join(",");

    const url = `https://www.dndbeyond.com/characters/${charBeyondId}`;
    const windowName = `dnd_char_${charBeyondId}`;

    const newWindow = window.open(url, windowName, windowFeatures);
    if (newWindow) {
      newWindow.focus();
    }
  };

  return (
    <div className={styles.container}>
      {/* Dynamic Background */}
      <div
        className={styles.bgImage}
        style={{ backgroundImage: `url(${currentBg})` }}
      >
        <div className={styles.bgGradient} />
      </div>

      {/* 3D Dice Layer (רץ מעל הרקע אך מתחת למודאלים/צ'אט) */}
      <DiceRoller
        triggerRoll={selectedNotation}
        onRollEnd={() => setSelectedNotation(null)}
      />

      {/* Main UI */}
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={onBack} className={styles.btnBack}>
              ← Back to Hub
            </button>
            <h1 className={styles.title}>{campaign.title}</h1>
          </div>

          <div className={styles.headerRight}>
            <button
              onClick={() => setIsChatOpen((prev) => !prev)}
              className={styles.btnGemini}
            >
              <span>✨</span>
              <span>Gemini AI</span>
            </button>

            <button
              onClick={() => setIsAdminOpen(true)}
              className={styles.btnControls}
            >
              ⚙ DM Controls
            </button>
          </div>
        </header>

        {/* Center Space */}
        <main className={styles.mainSpace} />

        {/* Quick Roll Bar (סרגל כפתורי קוביות צף) */}
        <div className={styles.quickRollBar}>
          <span className={styles.rollLabel}>🎲 Roll Dice:</span>

          {["1d20", "1d12", "1d10", "1d8", "1d6", "1d4"].map((notation) => (
            <button
              key={notation}
              onClick={() => setSelectedNotation(notation)}
              className={styles.btnRoll}
            >
              {notation}
            </button>
          ))}
        </div>

        {/* Character Cards Footer */}
        <footer className={styles.footer}>
          {characters.map((char) => (
            <CharacterCard
              key={char.id || char.beyondId}
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
      <ControlsModal
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
