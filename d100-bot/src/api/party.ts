import { apiRequest } from './client.ts';

interface CreatePartyResponse {
  id: string;
  leaderId: string;
}

export async function createParty(token: string): Promise<CreatePartyResponse> {
  return apiRequest<CreatePartyResponse>(
    'POST',
    '/api/v1/party/create',
    undefined,
    { token },
  );
}
