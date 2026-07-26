import { useState, useEffect } from "react";
import type { Campaign } from "./types/campaign";
import { CampaignHub } from "./features/campaign-hub/CampaignHub";
import { LiveOverlay } from "./features/live-overlay/LiveOverlay";
import { FullscreenButton } from "./components/FullscreenButton";
import { api } from "./api/axiosClient";

export const App = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // פונקציית טעינת הקמפיינים מה-Backend
  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Campaign[]>('/campaigns');
      setCampaigns(response.data);
    } catch (err: unknown) {
      console.error("Failed to fetch campaigns:", err);
      setError("לא ניתן להתחבר לשרת. ודא שהשרת פעיל ונסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const activeCampaign = campaigns.find((c) => c.id === selectedId);

  const handleUpdateBg = (campaignId: string, newBgUrl: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, bgUrl: newBgUrl } : c))
    );
  };

  // 1. מסך טעינה
  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-amber-400 font-bold select-none">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        <span className="tracking-wider text-sm">טוען מערכות...</span>
      </div>
    );
  }

  // 2. מסך שגיאה בחיבור לשרת
  if (error) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center select-none">
        <div className="bg-slate-900 border border-rose-500/30 p-6 rounded-2xl max-w-md shadow-2xl">
          <p className="text-rose-400 font-semibold mb-4">{error}</p>
          <button
            onClick={fetchCampaigns}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg"
          >
            🔄 נסה שוב
          </button>
        </div>
      </div>
    );
  }

  // 3. תצוגה ראשית (Hub או Live Overlay)
  return (
    <>
      {activeCampaign ? (
        <LiveOverlay
          campaign={activeCampaign}
          onBack={() => setSelectedId(null)}
          onUpdateBg={handleUpdateBg}
        />
      ) : (
        <CampaignHub
          campaigns={campaigns}
          onSelectCampaign={(id) => setSelectedId(id)}
        />
      )}

      <FullscreenButton />
    </>
  );
};

export default App;