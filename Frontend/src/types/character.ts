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

export interface CharacterHp {
  current: number;
  max: number;
  temp?: number;
}

export interface CharacterStats {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
}

export interface PassiveSkills {
  perception?: number;
  investigation?: number;
  insight?: number;
}

export interface Character {
  id: string;
  beyondId?: string;
  campaignId?: string;
  name: string;
  player?: string;
  class?: string;
  race?: string;
  level: number;
  hp: CharacterHp;
  ac?: number;
  speed?: number;
  initiative?: number;
  avatarUrl?: string;
  proficiencyBonus?: number;
  passiveSkills?: PassiveSkills;
  stats?: CharacterStats;
  inventory?: InventoryItem[];
  spells?: Spell[];
  features?: Feature[];
}