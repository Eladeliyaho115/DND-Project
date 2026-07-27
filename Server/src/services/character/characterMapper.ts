// backend/src/services/character/characterMapper.ts

export const formatDbCharacterToFrontend = (char: any) => {
  const statsJson = char.stats || {};

  return {
    id: char.id,

    beyondId: char.beyondId,

    campaignId: char.campaignId,

    name: char.name,

    player: char.player,

    class: char.className,

    race: char.race,

    level: char.level,

    proficiencyBonus: char.proficiencyBonus,

    initiative: char.initiative,

    avatarUrl: char.avatarUrl || "",

    hp: {
      current: char.currentHp ?? 10,

      max: char.maxHp ?? 10,

      temp: char.tempHp ?? 0,
    },

    ac: char.armorClass ?? 10,

    speed: char.speed ?? 30,

    stats: statsJson.stats || {},

    passiveSkills: statsJson.passiveSkills || {},

    inventory: char.equipment || [],

    spells: char.spells || [],

    features: char.features || [],
  };
};
