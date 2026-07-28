import React, { useState, useEffect } from "react";
import type { Campaign } from "../../types/campaign";
import type { Character } from "../../types/character";
import { CharacterCard } from "./components/CharacterCard";
import { ControlsModal } from "./components/ControslModal";
import { GeminiChatDrawer } from "./components/GeminiChatDrawer";
import { DiceRoller } from "./components/DiceRoller";
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
  const [characters, setCharacters] = useState<Character[]>(
    campaign.characters
  );
  const [currentBg, setCurrentBg] = useState<string>(campaign.bgUrl);
  const [currentMap, setCurrentMap] = useState<string | undefined>(
    campaign.mapUrl
  );

  // State לטריגר של גלגול/ניקוי הקוביות
  const [selectedNotation, setSelectedNotation] = useState<string | null>(
    null
  );

  useEffect(() => {
    setCharacters(campaign.characters);
    setCurrentBg(campaign.bgUrl);
    setCurrentMap(campaign.mapUrl);
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

  const handleUpdateMapUrl = (newMapUrl: string) => {
    setCurrentMap(newMapUrl);
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

  const handleClearDice = () => {
    setSelectedNotation("CLEAR");
    setTimeout(() => setSelectedNotation(null), 50);
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

      {/* 3D Dice Layer */}
      <DiceRoller
        triggerRoll={selectedNotation}
        onRollEnd={() => setSelectedNotation(null)}
      />

      {/* Layout Wrapper */}
      <div className={styles.layoutWrapper}>
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
              onClick={() => setIsAdminOpen(true)}
              className={styles.btnControls}
            >
              ⚙ DM Controls
            </button>
          </div>
        </header>

        {/* Main Grid: Left Chat, Center Space, Right Controls & Characters */}
        <div className={styles.mainGrid}>
          {/* Left Panel: Always Open Gemini Chat */}
          <aside className={styles.leftPanel}>
            <div className={styles.chatContainer}>
              <GeminiChatDrawer
                isOpen={true}
                onClose={() => {}}
                campaignId={campaign.id}
              />
            </div>
          </aside>

          {/* Center Play Area: World Map */}
          <main className={styles.centerPanel}>
            {currentMap && (
              <div className={styles.mapContainer}>
                <img
                  src={currentMap}
                  alt="World Map"
                  className={styles.worldMap}
                />
              </div>
            )}
          </main>

          {/* Right Panel: Dice Controls & Character Cards */}
          <aside className={styles.rightPanel}>
            {/* Quick Roll Floating Bar inside right column */}
            <div className={styles.quickRollBar}>
              <span className={styles.rollLabel}>🎲 Roll Dice</span>
              <div className={styles.diceButtonsGroup}>
                {["1d20", "1d12", "1d10", "1d8", "1d6", "1d4"].map(
                  (notation) => (
                    <button
                      key={notation}
                      onClick={() => setSelectedNotation(notation)}
                      className={styles.btnRoll}
                    >
                      {notation}
                    </button>
                  )
                )}
                <button
                  onClick={handleClearDice}
                  className={styles.btnClear}
                  title="Clear dice from screen"
                >
                  🧹 Clear
                </button>
              </div>
            </div>

            {/* Characters List Section */}
            <div className={styles.characterSection}>
              <h3 className={styles.sectionTitle}>Party Characters</h3>
              <div className={styles.characterList}>
                {characters.map((char) => (
                  <CharacterCard
                    key={char.id || char.beyondId}
                    character={char}
                    onOpenDetails={handleOpenDndBeyond}
                  />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* DM Controls Modal */}
      <ControlsModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        campaignId={campaign.id}
        characters={characters}
        onAddCharacter={handleAddCharacter}
        onRemoveCharacter={handleRemoveCharacter}
        onUpdateBg={(newBg) => handleUpdateBg(campaign.id, newBg)}
        onUpdateMapUrl={handleUpdateMapUrl}
      />
    </div>
  );
};