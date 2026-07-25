import type { Character } from "./character";

export interface Campaign {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'upcoming';
  bgUrl: string;
  characters: Character[];
}