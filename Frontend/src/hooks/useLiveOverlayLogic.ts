// src/components/LiveOverlay/hooks/useLiveOverlayLogic.ts
import { useState, useEffect } from "react";
import type { Campaign, Character } from "./../types/index";
import { deleteCharacterFromDb } from "../services/dndBeyondService";
import { updateCampaignData } from "../services/campaignService";

export const useLiveOverlayLogic = (
  campaign: Campaign,
  onUpdateBg?: (id: string, url: string) => void
) => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [language, setLanguage] = useState<"en" | "he">("en");
  const [activeMobileTab, setActiveMobileTab] = useState<"map" | "party" | "chat">("map");
  const [selectedNotation, setSelectedNotation] = useState<string | null>(null);

  const [characters, setCharacters] = useState<Character[]>(campaign.characters);
  const [currentBg, setCurrentBg] = useState<string>(campaign.bgUrl);
  const [currentMap, setCurrentMap] = useState<string | undefined>(campaign.mapUrl);

  useEffect(() => {
    setCharacters(campaign.characters);
    setCurrentBg(campaign.bgUrl);
    setCurrentMap(campaign.mapUrl);
  }, [campaign]);

  const handleHpChange = (changeAmount: number, targetName?: string) => {
    setCharacters((prev) =>
      prev.map((char) => {
        if (!targetName || char.name.toLowerCase().includes(targetName.toLowerCase())) {
          const newCurrent = Math.min(
            char.hp.max,
            Math.max(0, char.hp.current + changeAmount)
          );
          return { ...char, hp: { ...char.hp, current: newCurrent } };
        }
        return char;
      })
    );
  };

  const handleAddCharacter = (newChar: Character) => setCharacters((prev) => [...prev, newChar]);

  const handleRemoveCharacter = async (idToRemove: string) => {
    try {
      await deleteCharacterFromDb(idToRemove);
      setCharacters((prev) => prev.filter((c) => c.id !== idToRemove));
    } catch (error) {
      alert("שגיאה במחיקת הדמות מהשרת");
    }
  };

  const handleUpdateCampaign = async (
    campaignId: string,
    updates: { bgUrl?: string; mapUrl?: string; title?: string; description?: string }
  ) => {
    try {
      await updateCampaignData(campaignId, updates);
      if (updates.bgUrl !== undefined) {
        setCurrentBg(updates.bgUrl);
        onUpdateBg?.(campaignId, updates.bgUrl);
      }
      if (updates.mapUrl !== undefined) setCurrentMap(updates.mapUrl);
    } catch (error) {
      alert("שגיאה בעדכון פרטי הקמפיין בשרת");
    }
  };

  const handleOpenDndBeyond = (character: Character) => {
    if (!character.beyondId) return alert("לדמות זו אין מזהה D&D Beyond מוגדר.");
    const width = 700, height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      `https://www.dndbeyond.com/characters/${character.beyondId}`,
      `dnd_char_${character.beyondId}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    )?.focus();
  };

  const handleClearDice = () => {
    setSelectedNotation("CLEAR");
    setTimeout(() => setSelectedNotation(null), 50);
  };

  const toggleLanguage = () => setLanguage((prev) => (prev === "en" ? "he" : "en"));

  return {
    state: {
      isAdminOpen, isChatOpen, language, activeMobileTab,
      selectedNotation, characters, currentBg, currentMap,
    },
    actions: {
      setIsAdminOpen, setIsChatOpen, setActiveMobileTab, setSelectedNotation,
      handleHpChange, handleAddCharacter, handleRemoveCharacter,
      handleUpdateCampaign, handleOpenDndBeyond, handleClearDice, toggleLanguage,
    },
  };
};