// src/components/LiveOverlay/components/MobileTabBar.tsx
import React from "react";
import styles from "@styles/LiveOverlay.module.css";

interface MobileTabBarProps {
  activeTab: "map" | "party" | "chat";
  onSelectTab: (tab: "map" | "party" | "chat") => void;
  language: "en" | "he";
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onSelectTab, language }) => (
  <div className={styles.mobileTabBar}>
    <button
      onClick={() => onSelectTab("map")}
      className={`${styles.mobileTabBtn} ${activeTab === "map" ? styles.mobileTabActive : ""}`}
    >
      🗺️ {language === "he" ? "מפה" : "Map"}
    </button>
    <button
      onClick={() => onSelectTab("chat")}
      className={`${styles.mobileTabBtn} ${activeTab === "chat" ? styles.mobileTabActive : ""}`}
    >
      ✨ AI DM
    </button>
    <button
      onClick={() => onSelectTab("party")}
      className={`${styles.mobileTabBtn} ${activeTab === "party" ? styles.mobileTabActive : ""}`}
    >
      ⚔️ {language === "he" ? "דמויות וקוביות" : "Party & Dice"}
    </button>
  </div>
);