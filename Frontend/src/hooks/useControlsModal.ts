// useControlsModal.ts
import { useState, useEffect } from "react";
import type { Character } from "../types/character";
import { uploadCharacterSheetPDF } from "../services/characterSheetPDFService";

export const useControlsModal = (
  isOpen: boolean,
  isAddCharOpen: boolean,
  onClose: () => void,
  campaignId?: string,
  onUpdateBg?: (url: string) => void,
  onUpdateMapUrl?: (url: string) => void
) => {
  const [bgInput, setBgInput] = useState("");
  const [mapInput, setMapInput] = useState("");
  const [activeTab, setActiveTab] = useState<"controls" | "summaries">("controls");
  const [uploadingCharId, setUploadingCharId] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // סגירה ב-Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isAddCharOpen) onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isAddCharOpen, onClose]);

  const handleBgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bgInput.trim() && onUpdateBg) {
      onUpdateBg(bgInput.trim());
      setBgInput("");
    }
  };

  const handleMapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapInput.trim() && onUpdateMapUrl) {
      onUpdateMapUrl(mapInput.trim());
      setMapInput("");
    }
  };

  const handleFileUpload = async (char: Character, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !campaignId) return;

    if (file.type !== "application/pdf") {
      setUploadMessage({ type: "error", text: "נא לבחור קובץ PDF בלבד" });
      return;
    }

    const charIdentifier = char.id || char.beyondId || null;
    try {
      setUploadingCharId(charIdentifier);
      setUploadMessage(null);
      await uploadCharacterSheetPDF({ campaignId, characterName: char.name, file });
      setUploadMessage({ type: "success", text: `דף הדמות של ${char.name} הועלה בהצלחה!` });
    } catch (error) {
      console.error("Error uploading sheet:", error);
      setUploadMessage({ type: "error", text: `שגיאה בהעלאת דף הדמות של ${char.name}` });
    } finally {
      setUploadingCharId(null);
      e.target.value = "";
    }
  };

  return {
    bgInput,
    setBgInput,
    mapInput,
    setMapInput,
    activeTab,
    setActiveTab,
    uploadingCharId,
    uploadMessage,
    handleBgSubmit,
    handleMapSubmit,
    handleFileUpload,
  };
};