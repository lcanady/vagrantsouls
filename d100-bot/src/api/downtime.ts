import { apiRequest } from './client.ts';

// Minimal game-state snapshot returned by all downtime endpoints
export interface DowntimeState {
  hp: number;
  maxHp: number;
  gold: number;
  oil: number;
  food: number;
  [key: string]: unknown;
}

export interface DowntimeResult {
  message: string;
  state: DowntimeState;
}

export interface WitcheryResult {
  result: Record<string, unknown>;
  state: DowntimeState;
}

export async function downtimeHeal(
  token: string,
  adventurerId: string,
  amount: number,
): Promise<DowntimeResult> {
  return apiRequest<DowntimeResult>(
    'POST', '/api/v1/downtime/heal',
    { amount },
    { token, adventurerId },
  );
}

export async function downtimeRepair(
  token: string,
  adventurerId: string,
  itemId: string,
  pips: number,
): Promise<DowntimeResult> {
  return apiRequest<DowntimeResult>(
    'POST', '/api/v1/downtime/repair',
    { itemId, pips },
    { token, adventurerId },
  );
}

export async function downtimeSell(
  token: string,
  adventurerId: string,
  itemId: string,
): Promise<DowntimeResult> {
  return apiRequest<DowntimeResult>(
    'POST', '/api/v1/downtime/sell',
    { itemId },
    { token, adventurerId },
  );
}

export async function downtimeBuyNeeded(
  token: string,
  adventurerId: string,
  itemName: string,
): Promise<DowntimeResult> {
  return apiRequest<DowntimeResult>(
    'POST', '/api/v1/downtime/buy-needed',
    { itemName },
    { token, adventurerId },
  );
}

export async function downtimeSearchMarket(
  token: string,
  adventurerId: string,
  table: 'A' | 'W',
  roll: number,
): Promise<DowntimeResult> {
  return apiRequest<DowntimeResult>(
    'POST', '/api/v1/downtime/search-market',
    { table, roll },
    { token, adventurerId },
  );
}

export async function downtimeTrain(
  token: string,
  adventurerId: string,
  target: string,
  pips: number,
): Promise<DowntimeResult> {
  return apiRequest<DowntimeResult>(
    'POST', '/api/v1/downtime/train',
    { target, pips },
    { token, adventurerId },
  );
}

export async function downtimeMagicTuition(
  token: string,
  adventurerId: string,
  spellName: string,
  pips: number,
): Promise<DowntimeResult> {
  return apiRequest<DowntimeResult>(
    'POST', '/api/v1/downtime/magic-tuition',
    { spellName, pips },
    { token, adventurerId },
  );
}

export async function downtimeEmpire(
  token: string,
  adventurerId: string,
  investments: Record<string, number>,
): Promise<DowntimeResult> {
  return apiRequest<DowntimeResult>(
    'POST', '/api/v1/downtime/empire-building',
    investments,
    { token, adventurerId },
  );
}

export async function downtimeWitchery(
  token: string,
  adventurerId: string,
  parts: [string, string, string],
  roll: number,
  tableRoll: number,
): Promise<WitcheryResult> {
  return apiRequest<WitcheryResult>(
    'POST', '/api/v1/downtime/witchery',
    { parts, roll, tableRoll },
    { token, adventurerId },
  );
}

export async function downtimeWitcheryClear(
  token: string,
  adventurerId: string,
): Promise<DowntimeResult> {
  return apiRequest<DowntimeResult>(
    'POST', '/api/v1/downtime/witchery/clear',
    {},
    { token, adventurerId },
  );
}
