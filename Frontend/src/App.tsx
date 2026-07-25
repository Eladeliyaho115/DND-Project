import { useEffect, useState } from "react";
import type { Campaign } from "./types/campaign";
import { CampaignHub } from "./features/campaign-hub/CampaignHub";
import { LiveOverlay } from "./features/live-overlay/LiveOverlay";
import { FullscreenButton } from "./components/FullscreenButton";
import { checkHealth } from "./services/userService";

export const App = () => {
  useEffect(() => {
    checkHealth()
      .then((data) => console.log("🟢 חיבור מצוין! השרת החזיר:", data))
      .catch((err) => console.error("🔴 אין תקשורת עם השרת:", err));
  }, []);

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "roy-elias",
      title: "The Legend of Roy Elias",
      description:
        "A high-stakes rogue adventure uncovering ancient vaults and forgotten secrets.",
      status: "active",
      bgUrl:
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80",
      characters: [
        {
          id: "1",
          dndCharacterId: "168759027", // כעת מוגדר כהלכה
          name: "Roy Elias",
          player: "Elad",
          class: "Rogue",
          level: 2,
          hp: { current: 18, max: 18, temp: 0 },
          ac: 14,
          speed: 30,
          initiative: 3, // בדרך כלל ה-DEX Modifier
          avatarUrl: "https://via.placeholder.com/150/1e293b/amber?text=Roy",
          stats: {
            str: 10,
            dex: 16,
            con: 14,
            int: 12,
            wis: 10,
            cha: 14,
          },
          proficiencyBonus: 2,
          passiveSkills: {
            perception: 10,
            investigation: 11,
            insight: 10,
          },
        },
      ],
    },
    {
      id: "past-campaign-1",
      title: "Lost Mine of Phandelver",
      description: "The classic journey through the Sword Coast.",
      status: "completed",
      bgUrl:
        "https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=1920&q=80",
      characters: [],
    },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeCampaign = campaigns.find((c) => c.id === selectedId);

  const handleUpdateBg = (campaignId: string, newBgUrl: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, bgUrl: newBgUrl } : c)),
    );
  };

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
