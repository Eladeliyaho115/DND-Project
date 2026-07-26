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

  // טעינת הקמפיינים מה-Backend בטעינה הראשונית
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await api.get('/campaigns');
        setCampaigns(response.data);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const activeCampaign = campaigns.find((c) => c.id === selectedId);

  const handleUpdateBg = (campaignId: string, newBgUrl: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, bgUrl: newBgUrl } : c))
    );
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-amber-400 font-bold">
        Loading Campaigns...
      </div>
    );
  }

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