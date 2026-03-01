import { apiRequest } from './client.ts';
import type { BeastData, ArcanistData, ArtisanData } from './adventurer.ts';

// ─── Beast ────────────────────────────────────────────────────────────────────

export interface BeastActionResult {
  message: string;
  beast: BeastData;
}

export interface BeastSellResult {
  message: string;
  goldGained: number;
  gold: number;
}

export interface BeastDeflectResult {
  beastDamage: number;
  adventurerDamage: number;
  beast: BeastData;
}

export interface BeastAbilityResult {
  message: string;
  effect: string;
}

export async function beastBuy(
  token: string,
  adventurerId: string,
  roll: number,
): Promise<BeastActionResult> {
  return apiRequest<BeastActionResult>(
    'POST', `/api/v1/extra/${adventurerId}/beast/buy`,
    { roll },
    { token },
  );
}

export async function beastTame(
  token: string,
  adventurerId: string,
  monsterName: string,
  roll: number,
): Promise<BeastActionResult & { extraDamageDice?: string }> {
  return apiRequest<BeastActionResult & { extraDamageDice?: string }>(
    'POST', `/api/v1/extra/${adventurerId}/beast/tame`,
    { monsterName, roll },
    { token },
  );
}

export async function beastTrain(
  token: string,
  adventurerId: string,
  roll: number,
): Promise<BeastActionResult & { leveledUp?: boolean }> {
  return apiRequest<BeastActionResult & { leveledUp?: boolean }>(
    'POST', `/api/v1/extra/${adventurerId}/beast/train`,
    { roll },
    { token },
  );
}

export async function beastSell(
  token: string,
  adventurerId: string,
): Promise<BeastSellResult> {
  return apiRequest<BeastSellResult>(
    'POST', `/api/v1/extra/${adventurerId}/beast/sell`,
    {},
    { token },
  );
}

export async function beastAbility(
  token: string,
  adventurerId: string,
  ability: string,
  usesThisQuest: number,
): Promise<BeastAbilityResult> {
  return apiRequest<BeastAbilityResult>(
    'POST', `/api/v1/extra/${adventurerId}/beast/ability`,
    { ability, usesThisQuest },
    { token },
  );
}

export async function beastDeflect(
  token: string,
  adventurerId: string,
  incomingDamage: number,
): Promise<BeastDeflectResult> {
  return apiRequest<BeastDeflectResult>(
    'POST', `/api/v1/extra/${adventurerId}/beast/deflect`,
    { incomingDamage },
    { token },
  );
}

export async function beastResurrect(
  token: string,
  adventurerId: string,
): Promise<BeastActionResult> {
  return apiRequest<BeastActionResult>(
    'POST', `/api/v1/extra/${adventurerId}/beast/resurrect`,
    {},
    { token },
  );
}

// ─── Arcanist ─────────────────────────────────────────────────────────────────

export interface ArcanistResult {
  message: string;
  arcanist: ArcanistData;
}

export interface ArcanistLearnResult {
  message: string;
  arcanist: ArcanistData;
}

export interface ArcanistDonateResult {
  message: string;
  gold: number;
  arcaneLawBroken?: boolean;
}

export interface ArcanistConcealResult {
  concealed: boolean;
  sentToPrism: boolean;
  adventurer: Record<string, unknown>;
}

export interface ArcanistPrismResult {
  survived: boolean;
  message: string;
  adventurer?: Record<string, unknown>;
}

export async function arcanistBecome(
  token: string,
  adventurerId: string,
  order: string,
): Promise<ArcanistResult> {
  return apiRequest<ArcanistResult>(
    'POST', `/api/v1/extra/${adventurerId}/arcanist/become`,
    { order },
    { token },
  );
}

export async function arcanistLearn(
  token: string,
  adventurerId: string,
  spellTableRoll: number,
  cost?: number,
): Promise<ArcanistLearnResult> {
  return apiRequest<ArcanistLearnResult>(
    'POST', `/api/v1/extra/${adventurerId}/arcanist/learn`,
    cost !== undefined ? { spellTableRoll, cost } : { spellTableRoll },
    { token },
  );
}

export async function arcanistDonate(
  token: string,
  adventurerId: string,
): Promise<ArcanistDonateResult> {
  return apiRequest<ArcanistDonateResult>(
    'POST', `/api/v1/extra/${adventurerId}/arcanist/donate`,
    {},
    { token },
  );
}

export async function arcanistConceal(
  token: string,
  adventurerId: string,
  roll: number,
): Promise<ArcanistConcealResult> {
  return apiRequest<ArcanistConcealResult>(
    'POST', `/api/v1/extra/${adventurerId}/arcanist/conceal`,
    { roll },
    { token },
  );
}

export async function arcanistPrism(
  token: string,
  adventurerId: string,
  strRoll: number,
  dexRoll: number,
  intRoll: number,
): Promise<ArcanistPrismResult> {
  return apiRequest<ArcanistPrismResult>(
    'POST', `/api/v1/extra/${adventurerId}/arcanist/prism`,
    { strRoll, dexRoll, intRoll },
    { token },
  );
}

// ─── Artisan ──────────────────────────────────────────────────────────────────

export interface ArtisanResult {
  message: string;
  artisan: ArtisanData;
  gold?: number;
}

export interface ArtisanSalvageResult {
  success: boolean;
  message: string;
  doubled?: boolean;
  experienceGained?: boolean;
  materials: Record<string, number>;
}

export interface ArtisanCraftResult {
  success: boolean;
  message: string;
  craftedItem?: string;
  schematicLearned?: boolean;
  materials: Record<string, number>;
}

export interface ArtisanConvertResult {
  message: string;
  materials: Record<string, number>;
}

export interface ArtisanStorageResult {
  success: boolean;
  message: string;
  gold: number;
  artisan: ArtisanData;
}

export async function artisanUnlock(
  token: string,
  adventurerId: string,
): Promise<ArtisanResult> {
  return apiRequest<ArtisanResult>(
    'POST', `/api/v1/extra/${adventurerId}/artisan/unlock`,
    {},
    { token },
  );
}

export async function artisanSalvage(
  token: string,
  adventurerId: string,
  itemName: string,
  roll: number,
  prefix?: string,
): Promise<ArtisanSalvageResult> {
  return apiRequest<ArtisanSalvageResult>(
    'POST', `/api/v1/extra/${adventurerId}/artisan/salvage`,
    prefix ? { itemName, roll, prefix } : { itemName, roll },
    { token },
  );
}

export async function artisanCraft(
  token: string,
  adventurerId: string,
  itemName: string,
  roll: number,
): Promise<ArtisanCraftResult> {
  return apiRequest<ArtisanCraftResult>(
    'POST', `/api/v1/extra/${adventurerId}/artisan/craft`,
    { itemName, roll },
    { token },
  );
}

export async function artisanConvert(
  token: string,
  adventurerId: string,
  from: string,
  to: string,
  quantity: number,
): Promise<ArtisanConvertResult> {
  return apiRequest<ArtisanConvertResult>(
    'POST', `/api/v1/extra/${adventurerId}/artisan/convert`,
    { from, to, quantity },
    { token },
  );
}

export async function artisanStorage(
  token: string,
  adventurerId: string,
): Promise<ArtisanStorageResult> {
  return apiRequest<ArtisanStorageResult>(
    'POST', `/api/v1/extra/${adventurerId}/artisan/storage`,
    {},
    { token },
  );
}

export async function artisanTrain(
  token: string,
  adventurerId: string,
  type: 'Salvage' | 'Crafting' | 'Art',
  contactsUsed: number,
): Promise<ArtisanResult> {
  return apiRequest<ArtisanResult>(
    'POST', `/api/v1/extra/${adventurerId}/artisan/train`,
    { type, contactsUsed },
    { token },
  );
}

// ─── Combat Experience ────────────────────────────────────────────────────────

export interface CombatXpKillResult {
  pipAwarded: number;
  pips: number;
  newlyUnlocked?: string[];
  pipsTotal: number;
}

export interface CombatXpStatusResult {
  combatExperience: Array<{ monster: string; pips: number; abilities: string[] }>;
}

export async function combatXpKill(
  token: string,
  adventurerId: string,
  monsterName: string,
  packDefeated?: boolean,
): Promise<CombatXpKillResult> {
  return apiRequest<CombatXpKillResult>(
    'POST', `/api/v1/extra/${adventurerId}/combat-xp/kill`,
    packDefeated !== undefined ? { monsterName, packDefeated } : { monsterName },
    { token },
  );
}

export async function getCombatXpStatus(
  token: string,
  adventurerId: string,
): Promise<CombatXpStatusResult> {
  return apiRequest<CombatXpStatusResult>(
    'GET', `/api/v1/extra/${adventurerId}/combat-xp`,
    undefined,
    { token },
  );
}
