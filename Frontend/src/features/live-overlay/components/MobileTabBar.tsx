// src/components/LiveOverlay/components/MobileTabBar.tsx
import React from "react";
import styles from "@styles/LiveOverlay.module.css";

interface MobileTabBarProps {
  activeTab: "map" | "party" | "chat";
  onSelectTab: (tab: "map" | "party" | "chat") => void;
  language: "en" | "he";
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onSelectTab }) => (
  <div className={styles.mobileTabBar}>
    <button
      onClick={() => onSelectTab("map")}
      className={`${styles.mobileTabBtn} ${activeTab === "map" ? styles.mobileTabActive : ""}`}
      title="מפה"
    >
      <span className={styles.tabIcon}>🗺️</span>
      <span className={styles.tabText}>מפה</span>
    </button>
    <button
      onClick={() => onSelectTab("chat")}
      className={`${styles.mobileTabBtn} ${activeTab === "chat" ? styles.mobileTabActive : ""}`}
      title="AI DM"
    >
      <span className={styles.tabIcon}>🐉</span>
      <span className={styles.tabText}>AI DM</span>
    </button>
    <button
      onClick={() => onSelectTab("party")}
      className={`${styles.mobileTabBtn} ${activeTab === "party" ? styles.mobileTabActive : ""}`}
      title="דמויות וקוביות"
    >
      <span className={styles.tabIcon}>⚔️</span>
      <span className={styles.tabText}>דמויות וקוביות</span>
    </button>
  </div>
);