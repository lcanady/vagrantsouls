import { apiRequest } from './client.ts';

export interface CombatResolutionData {
  logs: string[];
  monster: {
    name: string;
    hpValues: number[];
    [key: string]: unknown;
  };
  partyId: string;
  roundOver: boolean;
  combatOver: boolean;
  winner?: 'party' | 'monster';
}

// API returns either a resolved turn or a pending status
export interface CombatActionResponse {
  message: string;
  resolution?: CombatResolutionData;
  pendingCount?: number;
  totalCount?: number;
}

interface CombatActionBody {
  partyId: string;
  adventurerId: string;
}

export async function combatAttack(
  token: string,
  kvAdventurerId: string,
  body: CombatActionBody & { weaponSlot: string },
): Promise<CombatActionResponse> {
  return apiRequest<CombatActionResponse>('POST', '/api/v1/combat/attack', body, {
    token,
    adventurerId: kvAdventurerId,
  });
}

export async function combatDefend(
  token: string,
  kvAdventurerId: string,
  body: CombatActionBody,
): Promise<CombatActionResponse> {
  return apiRequest<CombatActionResponse>('POST', '/api/v1/combat/defend', body, {
    token,
    adventurerId: kvAdventurerId,
  });
}

export async function combatFlee(
  token: string,
  kvAdventurerId: string,
  body: CombatActionBody,
): Promise<CombatActionResponse> {
  return apiRequest<CombatActionResponse>('POST', '/api/v1/combat/flee', body, {
    token,
    adventurerId: kvAdventurerId,
  });
}
