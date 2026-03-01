import { apiRequest } from './client.ts';

export interface RoomData {
  roll: number;
  color: string;
  exits: number;
  features?: Record<string, unknown>;
  searched: boolean;
}

export interface TimeTrack {
  day: number;
  phase: string;
}

export interface UpkeepReport {
  messages: string[];
}

export interface MoveResponse {
  roll: number;
  room: RoomData;
  narrative: string;
  timeTrack?: TimeTrack;
  upkeepReport?: UpkeepReport;
}

export interface SearchResponse {
  roll: number;
  find: { name: string; value?: number };
  narrative: string;
  upkeepReport?: UpkeepReport;
}

export async function dungeonMove(
  token: string,
  adventurerId: string,
): Promise<MoveResponse> {
  return apiRequest<MoveResponse>('POST', '/api/v1/dungeon/move', undefined, {
    token,
    adventurerId,
  });
}

export async function dungeonSearch(
  token: string,
  adventurerId: string,
): Promise<SearchResponse> {
  return apiRequest<SearchResponse>('POST', '/api/v1/dungeon/search', undefined, {
    token,
    adventurerId,
  });
}
