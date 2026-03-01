const BASE_URL = Deno.env.get('D100_API_URL') ?? 'http://localhost:4200';

export interface ApiHeaders {
  token?: string;
  adventurerId?: string;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  headers?: ApiHeaders,
): Promise<T> {
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (headers?.token) {
    reqHeaders['Authorization'] = `Bearer ${headers.token}`;
  }
  if (headers?.adventurerId) {
    reqHeaders['X-Adventurer-Id'] = headers.adventurerId;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}
