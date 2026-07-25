import React from 'react';
import type { Campaign } from '../../types/campaign';
import { CampaignCard } from './components/CampaignCard';

interface CampaignHubProps {
  campaigns: Campaign[];
  onSelectCampaign: (id: string) => void;
}

export const CampaignHub: React.FC<CampaignHubProps> = ({ campaigns, onSelectCampaign }) => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-start p-8 relative overflow-hidden">
      {/* תאורת רקע */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-600/10 blur-[140px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="text-center my-12 z-10">
        <div className="inline-block p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 shadow-lg shadow-amber-500/5">
          <span className="text-amber-400 font-bold tracking-widest text-xs uppercase px-2">
            Dungeons & Dragons • Campaign Hub
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 uppercase drop-shadow-md">
          DUNGEONS & DRAGONS
        </h1>
        <p className="text-slate-400 mt-3 text-sm md:text-base max-w-md mx-auto">
          Select a campaign to enter the live overlay or review past adventures.
        </p>
      </header>

      {/* Campaign Cards Grid */}
      <main className="w-full max-w-5xl z-10 grid md:grid-cols-2 gap-8 mt-4">
        {campaigns.map((camp) => (
          <CampaignCard key={camp.id} campaign={camp} onSelect={onSelectCampaign} />
        ))}
      </main>
    </div>
  );
};