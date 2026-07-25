import type { Character } from '../types/character';

export const fetchDndBeyondCharacter = async (characterId: string): Promise<Character> => {
  const url = `/dnd-api/character/v5/character/${characterId}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const result = await response.json();

  if (!result || !result.data) {
    throw new Error('D&D Beyond API returned invalid format');
  }

  const data = result.data;

  // ---------------------------------------------------------------------------
  // 1. Stats & Basic Modifiers
  // ---------------------------------------------------------------------------
  const getStatValue = (statId: number): number => {
    // 1=STR, 2=DEX, 3=CON, 4=INT, 5=WIS, 6=CHA
    const base = data.stats?.find((s: any) => s.id === statId)?.value || 10;
    const bonus = data.bonusStats?.find((s: any) => s.id === statId)?.value || 0;
    const override = data.overrideStats?.find((s: any) => s.id === statId)?.value;
    return override || (base + bonus);
  };

  const stats = {
    str: getStatValue(1),
    dex: getStatValue(2),
    con: getStatValue(3),
    int: getStatValue(4),
    wis: getStatValue(5),
    cha: getStatValue(6),
  };

  const totalLevel = data.classes?.reduce((acc: number, c: any) => acc + (c.level || 0), 0) || 1;
  const proficiencyBonus = data.proficiencyBonus || Math.ceil(1 + totalLevel / 4);

  const dexModifier = Math.floor((stats.dex - 10) / 2);
  const conModifier = Math.floor((stats.con - 10) / 2);
  const intModifier = Math.floor((stats.int - 10) / 2);
  const wisModifier = Math.floor((stats.wis - 10) / 2);

  // ---------------------------------------------------------------------------
  // 2. Health Points (HP) & Armor Class (AC)
  // ---------------------------------------------------------------------------
  const baseHp = data.baseHitPoints || 10;
  const bonusHp = data.bonusHitPoints || 0;
  const conHpBonus = conModifier * totalLevel;

  const maxHp = data.overrideHitPoints || (baseHp + bonusHp + conHpBonus);
  const removedHitPoints = data.removedHitPoints || 0;
  const tempHp = data.temporaryHitPoints || 0;
  const currentHp = Math.max(0, maxHp - removedHitPoints);

  let calculatedAc = 10 + dexModifier;
  const equippedArmor = data.inventory?.find((item: any) => 
    item.definition?.filterType === 'Armor' && item.equipped
  );

  if (equippedArmor) {
    const armorClass = equippedArmor.definition.armorClass || 10;
    const armorType = equippedArmor.definition.armorTypeId; // 1: Light, 2: Medium, 3: Heavy
    if (armorType === 1) calculatedAc = armorClass + dexModifier;
    else if (armorType === 2) calculatedAc = armorClass + Math.min(2, dexModifier);
    else if (armorType === 3) calculatedAc = armorClass;
  }

  // ---------------------------------------------------------------------------
  // 3. Passive Skills Calculation
  // ---------------------------------------------------------------------------
  const getSkillNameById = (id: number): string => {
    switch (id) {
      case 12: return 'perception';
      case 9: return 'investigation';
      case 8: return 'insight';
      default: return '';
    }
  };

  // איסוף כל ה-modifiers מכל המקורות בדף הדמות
  const allModifiers = [
    ...(data.modifiers?.class || []),
    ...(data.modifiers?.race || []),
    ...(data.modifiers?.background || []),
    ...(data.modifiers?.feat || []),
    ...(data.modifiers?.item || []),
    ...(data.modifiers?.character || []),
  ];

  const getPassiveSkill = (skillId: number, defaultStatMod: number): number => {
    // א. בדיקת Override ידני ב-Sheet (typeId 26 = Custom Skill Score)
    const customOverride = data.characterValues?.find(
      (v: any) => v.typeId === 26 && v.valueId === skillId
    );
    if (customOverride?.value !== undefined) return customOverride.value;

    const skillName = getSkillNameById(skillId).toLowerCase();
    let skillBonus = defaultStatMod;

    // ב. בדיקת Expertise / Proficiency
    const hasExpertise = allModifiers.some(
      (m: any) => m.type === 'expertise' && m.subType?.toLowerCase() === skillName
    );

    const hasProficiency = allModifiers.some(
      (m: any) => (m.type === 'proficiency' || m.type === 'half-proficiency') && m.subType?.toLowerCase() === skillName
    );

    // ג. בדיקת בונוסים פסיביים ישירים (כמו Feat של Observant)
    const passiveBonus = allModifiers
      .filter((m: any) => m.type === 'passive-bonus' && m.subType?.toLowerCase() === skillName)
      .reduce((acc: number, m: any) => acc + (m.value || 0), 0);

    if (hasExpertise) {
      skillBonus += proficiencyBonus * 2;
    } else if (hasProficiency) {
      skillBonus += proficiencyBonus;
    }

    skillBonus += passiveBonus;

    return 10 + skillBonus;
  };

  // ---------------------------------------------------------------------------
  // 4. Inventory, Spells & Features Extraction
  // ---------------------------------------------------------------------------
  const primaryClass = data.classes?.map((c: any) => `${c.definition?.name} ${c.level}`).join(' / ') || 'Adventurer';

  const inventory = (data.inventory || []).map((item: any) => ({
    name: item.definition?.name || 'חפץ ללא שם',
    quantity: item.quantity || 1,
  }));

  const classSpells = data.classSpells?.flatMap((cs: any) => cs.spells || []) || [];
  const raceSpells = data.spells?.race || [];
  const featSpells = data.spells?.feat || [];
  const spells = [...classSpells, ...raceSpells, ...featSpells].map((s: any) => ({
    name: s.definition?.name || 'לחש ללא שם',
    level: s.definition?.level ?? 0,
    description: s.definition?.snippet || s.definition?.description || '',
  }));

  const classFeatures = data.classes?.flatMap((c: any) => c.classFeatures || []).map((cf: any) => cf.definition) || [];
  const feats = data.feats?.map((f: any) => f.definition) || [];
  const raceTraits = data.race?.racialTraits?.map((t: any) => t.definition) || [];

  const features = [...classFeatures, ...feats, ...raceTraits]
    .filter((f: any) => f && f.name)
    .map((f: any) => ({
      name: f.name,
      description: f.snippet || f.description || '',
    }));

  // ---------------------------------------------------------------------------
  // 5. Final Object Return
  // ---------------------------------------------------------------------------
  return {
    id: String(data.id),
    dndCharacterId: String(data.id),
    name: data.name || 'Hero',
    player: data.username || 'Player',
    class: primaryClass,
    level: totalLevel,
    proficiencyBonus,
    passiveSkills: {
      perception: getPassiveSkill(12, wisModifier),
      investigation: getPassiveSkill(9, intModifier),
      insight: getPassiveSkill(8, wisModifier),
    },
    hp: {
      current: currentHp,
      max: maxHp,
      temp: tempHp,
    },
    ac: data.overrideArmorClass || calculatedAc,
    speed: data.race?.weightSpeeds?.normal?.walk || 30,
    initiative: dexModifier,
    avatarUrl: data.decorations?.avatarUrl || '',
    stats,
    inventory,
    spells,
    features,
  };
};