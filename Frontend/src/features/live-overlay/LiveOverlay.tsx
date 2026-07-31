import React from "react";
import type { Campaign } from "../../types/campaign";
import { CharacterCard } from "./components/CharacterCard";
import { ControlsModal } from "./components/ControslModal";
import { GeminiChatDrawer } from "./components/GeminiChatDrawer";
import { DiceRoller } from "./components/DiceRoller";
import { MobileTabBar } from "./components/MobileTabBar";
import { useLiveOverlayLogic } from "./../../hooks/useLiveOverlayLogic";

import styles from "@styles/LiveOverlay.module.css";

interface LiveOverlayProps {
  campaign: Campaign;
  onBack: () => void;
  onUpdateBg: (campaignId: string, newBgUrl: string) => void;
}

export const LiveOverlay: React.FC<LiveOverlayProps> = ({ campaign, onBack, onUpdateBg }) => {
  const { state, actions } = useLiveOverlayLogic(campaign, onUpdateBg);

  return (
    <div className={styles.container}>
      {/* Background */}
      <div className={styles.bgImage} style={{ backgroundImage: `url(${state.currentBg})` }}>
        <div className={styles.bgGradient} />
      </div>

      <DiceRoller
        triggerRoll={state.selectedNotation}
        onRollEnd={() => actions.setSelectedNotation(null)}
      />

      <div className={styles.layoutWrapper}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={onBack} className={styles.btnBack} title="Back to Hub">
              <span>←</span> <span className={styles.btnText}>Back to Hub</span>
            </button>
            <h1 className={styles.title}>{campaign.title}</h1>
          </div>
          <div className={styles.headerRight}>
            <button onClick={actions.toggleLanguage} className={styles.btnControls} title={state.language === "en" ? "עברית" : "English"}>
              <span>🌐</span> <span className={styles.btnText}>{state.language === "en" ? "עברית" : "English"}</span>
            </button>
            {!state.isChatOpen && (
              <button onClick={() => actions.setIsChatOpen(true)} className={styles.btnControls} title={state.language === "he" ? "פתח עוזר AI" : "Open AI Assistant"}>
                <span>✨</span> <span className={styles.btnText}>{state.language === "he" ? "פתח עוזר AI" : "Open AI Assistant"}</span>
              </button>
            )}
            <button onClick={() => actions.setIsAdminOpen(true)} className={styles.btnControls} title={state.language === "he" ? "בקרת שליט מבוך" : "DM Controls"}>
              <span>⚙</span> <span className={styles.btnText}>{state.language === "he" ? "בקרת שליט מבוך" : "DM Controls"}</span>
            </button>
          </div>
        </header>

        {/* Main Grid */}
        <div className={`${styles.mainGrid} ${state.language === "he" ? styles.rtlLayout : styles.ltrLayout}`}>
          {/* AI Chat */}
          <aside className={`${styles.chatPanel} ${state.activeMobileTab === "chat" ? styles.mobileTabVisible : ""}`}>
            {state.isChatOpen && (
              <div className="w-full h-full flex flex-col">
                <GeminiChatDrawer
                  isOpen={state.isChatOpen}
                  onClose={() => actions.setIsChatOpen(false)}
                  campaignId={campaign.id}
                  onHpChange={actions.handleHpChange}
                />
              </div>
            )}
          </aside>

          {/* Map Panel */}
          <main className={`${styles.centerPanel} ${state.activeMobileTab === "map" ? styles.mobileTabVisible : ""}`}>
            {state.currentMap && (
              <div className={styles.mapContainer}>
                <img src={state.currentMap} alt="World Map" className={styles.worldMap} />
              </div>
            )}
          </main>

          {/* Party & Dice Panel */}
          <aside className={`${styles.partyPanel} ${state.activeMobileTab === "party" ? styles.mobileTabVisible : ""}`}>
            <div className={styles.quickRollBar}>
              <span className={styles.rollLabel}>🎲 {state.language === "he" ? "גלגול קוביות" : "Roll Dice"}</span>
              <div className={styles.diceButtonsGroup}>
                {["1d20", "1d12", "1d10", "1d8", "1d6", "1d4"].map((notation) => (
                  <button key={notation} onClick={() => actions.setSelectedNotation(notation)} className={styles.btnRoll}>
                    {notation}
                  </button>
                ))}
                <button onClick={actions.handleClearDice} className={styles.btnClear}>
                  🧹 {state.language === "he" ? "נקה" : "Clear"}
                </button>
              </div>
            </div>

            <div className={styles.characterSection}>
              <h3 className={styles.sectionTitle}>{state.language === "he" ? "דמויות בחבורה" : "Party Characters"}</h3>
              <div className={styles.characterList}>
                {state.characters.map((char) => (
                  <CharacterCard key={char.id || char.beyondId} character={char} onOpenDetails={actions.handleOpenDndBeyond} />
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom Mobile Tab Bar */}
        <MobileTabBar
          activeTab={state.activeMobileTab}
          onSelectTab={actions.setActiveMobileTab}
          language={state.language}
        />
      </div>

      <ControlsModal
        isOpen={state.isAdminOpen}
        onClose={() => actions.setIsAdminOpen(false)}
        campaignId={campaign.id}
        characters={state.characters}
        onAddCharacter={actions.handleAddCharacter}
        onRemoveCharacter={actions.handleRemoveCharacter}
        onUpdateBg={(newBg) => actions.handleUpdateCampaign(campaign.id, { bgUrl: newBg })}
        onUpdateMapUrl={(newMap) => actions.handleUpdateCampaign(campaign.id, { mapUrl: newMap })}
      />
    </div>
  );
};