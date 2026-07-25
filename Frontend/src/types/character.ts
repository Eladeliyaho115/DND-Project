export interface InventoryItem {
  name: string;
  quantity?: number;
}

export interface Spell {
  name: string;
  level?: number;
  description?: string;
}

export interface Feature {
  name: string;
  description?: string;
}

export interface Character {
  id: string;
  dndCharacterId?: string;
  name: string;
  player: string;
  class: string;
  level: number;
  hp: {
    current: number;
    max: number;
    temp: number;
  };
  ac: number;
  speed: number;
  initiative: number;
  avatarUrl: string;
  proficiencyBonus: number; // 👈 חדש
  passiveSkills: {         // 👈 חדש
    perception: number;
    investigation: number;
    insight: number;
  };
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  inventory?: { name: string; quantity: number }[];
  spells?: { name: string; level: number; description: string }[];
  features?: { name: string; description: string }[];
}