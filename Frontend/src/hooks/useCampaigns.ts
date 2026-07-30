import { useState, useEffect, useCallback } from "react";
import type { Campaign } from "../types/campaign";
import {
  fetchAllCampaigns,
  createCampaign,
  updateCampaignStatus,
  deleteCampaignFromDb,
  updateCampaignData,
} from "../services/campaignService";

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // טעינת הקמפיינים משרת
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      console.error("Failed to load campaigns:", err);
      setError("נכשלה טעינת הקמפיינים מהשרת");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // יצירת קמפיין חדש
  const handleCreate = async (
    title: string,
    description?: string,
    bgUrl?: string,
  ) => {
    try {
      const newCampaign = await createCampaign(title, description, bgUrl);
      setCampaigns((prev) => [...prev, newCampaign]);
    } catch (err) {
      console.error("Failed to create campaign:", err);
      throw err;
    }
  };

  // שינוי סטטוס קמפיין (active / completed)
  const handleToggleStatus = async (
    id: string,
    currentStatus?: Campaign["status"],
  ) => {
    const nextStatus = currentStatus === "active" ? "completed" : "active";
    try {
      // עדכון אופטימי ב-State
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)),
      );
      await updateCampaignStatus(id, nextStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
      // במקרה של שגיאה - נרענן מחדש מהשרת
      loadCampaigns();
    }
  };

  // מחיקת קמפיין
  const handleDelete = async (id: string) => {
    try {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      await deleteCampaignFromDb(id);
    } catch (err) {
      console.error("Failed to delete campaign:", err);
      loadCampaigns();
    }
  };

  // עדכון פרטי קמפיין (כולל masterSummary, bgUrl, mapUrl וכו')
  const handleUpdate = async (
    id: string,
    updates: {
      title?: string;
      description?: string;
      bgUrl?: string;
      mapUrl?: string;
      status?: string;
      masterSummary?: string;
    }
  ) => {
    try {
      // 1. ניקוי שדות undefined כדי שלא ידרסו ערכים קיימים
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      // 2. עדכון אופטימי ב-State
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              ...cleanUpdates,
            } as Campaign;
          }
          return c;
        })
      );

      // 3. קריאה ל-Backend
      await updateCampaignData(id, updates);
    } catch (err) {
      console.error("Failed to update campaign:", err);
      loadCampaigns(); // שחזור במקרה של שגיאה
    }
  };

  return {
    campaigns,
    loading,
    error,
    refreshCampaigns: loadCampaigns,
    addCampaign: handleCreate,
    updateCampaign: handleUpdate,
    toggleStatus: handleToggleStatus,
    deleteCampaign: handleDelete,
  };
};