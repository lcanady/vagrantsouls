import { apiRequest } from './client.ts';

// ─── Companion types ───────────────────────────────────────────────────

export interface BeastData {
  name: string;
  level: number;
  bonus: number;
  gpValue: number;
  abilities: string[];
  hp: number;
  currentHp: number;
  trainingPips: number;
  isCooperative: boolean;
  isDragonHatchling: boolean;
  dragonHearts: number;
}

export interface ArcanistData {
  order: string;
  rank: string;
  arcanistSpells: string[];
  arcaneLawBroken: number;
  stafeEnergy: number;
  donations: number;
  ingredientsBagActive: boolean;
  ingredients: Record<string, number>;
}

export interface ArtisanData {
  art: number;
  salvageSkill: number;
  craftingSkill: number;
  materials: Record<string, number>;
  schematics: { name: string; [key: string]: unknown }[];
  contacts: number;
  guildStoragePaid: boolean;
}

// ─── Core adventurer shape used by the bot ───────────────────────────────────

export interface AdventurerData {
  id: string;
  name: string;
  path: string;
  race: string;
  level: number;
  hp: number;
  maxHp: number;
  str: number;
  dex: number;
  int: number;
  fate: number;
  life: number;
  gold: number;
  // Resources
  oil?: number;
  food?: number;
  picks?: number;
  // Equipment (kept loose for forward compat)
  skills: string[];
  inventory: unknown[];
  rHand: unknown | null;
  lHand: unknown | null;
  // Companion data
  beast: unknown | null;        // cast to BeastData where needed
  arcanist: unknown | null;     // cast to ArcanistData where needed
  artisan: unknown | null;      // cast to ArtisanData where needed
  combatExperience?: Record<string, number>;
  // Witchery
  witcheryFormulas?: Record<string, unknown>;
  witcheryEffects?: string[];
  witcheryMishaps?: string[];
  [key: string]: unknown;
}

export async function getAdventurer(
  token: string,
  adventurerId: string,
): Promise<AdventurerData> {
  return apiRequest<AdventurerData>('GET', '/api/v1/adventurer/', undefined, {
    token,
    adventurerId,
  });
}
