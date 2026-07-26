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
  beyondId?: string;
  dndCharacterId?: string;
  campaignId?: string; // 👈 1. הוספת השדה הקריטי לשיוך המערכה!
  name: string;
  player: string;
  class: string;
  race?: string;
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
  proficiencyBonus: number;
  passiveSkills: {
    perception?: number;
    investigation?: number;
    insight?: number;
  };
  stats: {
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
  };
  inventory?: InventoryItem[];
  spells?: Spell[];
  features?: Feature[];
}