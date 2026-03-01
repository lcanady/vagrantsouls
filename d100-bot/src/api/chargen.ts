import { apiRequest } from './client.ts';
import type { AdventurerData } from './adventurer.ts';

interface ChargenCreateInput {
  name: string;
  str: number;
  dex: number;
  int: number;
}

interface ChargenResponse {
  id: string;
  adventurer: AdventurerData;
}

export async function chargenCreate(
  token: string,
  input: ChargenCreateInput,
): Promise<ChargenResponse> {
  return apiRequest<ChargenResponse>('POST', '/api/v1/chargen/create', input, {
    token,
  });
}

export async function chargenPath(
  token: string,
  id: string,
  path: string,
): Promise<ChargenResponse> {
  return apiRequest<ChargenResponse>(
    'POST',
    '/api/v1/chargen/path',
    { id, path },
    { token },
  );
}

export async function chargenRace(
  token: string,
  id: string,
  race: string,
): Promise<ChargenResponse> {
  return apiRequest<ChargenResponse>(
    'POST',
    '/api/v1/chargen/race',
    { id, race },
    { token },
  );
}

export async function chargenSkills(
  token: string,
  id: string,
  skills: string[],
): Promise<ChargenResponse> {
  return apiRequest<ChargenResponse>(
    'POST',
    '/api/v1/chargen/skills',
    { id, skills },
    { token },
  );
}

export async function chargenFinalize(
  token: string,
  id: string,
): Promise<ChargenResponse> {
  return apiRequest<ChargenResponse>(
    'POST',
    '/api/v1/chargen/finalize',
    { id },
    { token },
  );
}

export interface ChargenOptions {
  paths: string[];
  races: string[];
  skills: string[];
}

export async function getChargenOptions(): Promise<ChargenOptions> {
  return apiRequest<ChargenOptions>('GET', '/api/v1/chargen/options');
}
