import { useState } from "react";
import { useCampaigns } from "./hooks/useCampaigns";
import { CampaignHub } from "./features/campaign-hub/CampaignHub";
import { LiveOverlay } from "./features/live-overlay/LiveOverlay";
import { FullscreenButton } from "./components/FullscreenButton";

export const App = () => {
  const {
    campaigns,
    loading,
    updateCampaign,
    addCampaign,
    toggleStatus,
    deleteCampaign,
  } = useCampaigns();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeCampaign = campaigns.find((c) => c.id === selectedId);

  const handleToggleStatus = (id: string, currentStatus?: string) => {
    // adapt signature expected by CampaignHub to the hook's implementation
    void toggleStatus(id, currentStatus as any);
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
          onUpdateBg={() => {}}
        />
      ) : (
        <CampaignHub
          campaigns={campaigns}
          onSelectCampaign={(id) => setSelectedId(id)}
          onCreateCampaign={addCampaign}
          onUpdateCampaign={updateCampaign}
          onToggleStatus={handleToggleStatus}
          onDeleteCampaign={deleteCampaign}
        />
      )}

      <FullscreenButton />
    </>
  );
};

export default App;
