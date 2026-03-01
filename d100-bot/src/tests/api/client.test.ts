import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { apiRequest } from '../../api/client.ts';
import { mockFetch } from '../helpers/fixtures.ts';

const OK_JSON = { result: 'ok', id: '123' };

function makeOkResponse(body: unknown = OK_JSON, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.test('apiRequest — GET request sends correct method', async () => {
  let capturedInit: RequestInit | undefined;
  const restore = mockFetch((_url, init) => {
    capturedInit = init;
    return makeOkResponse();
  });
  try {
    await apiRequest('GET', '/api/v1/test');
    assertEquals(capturedInit?.method, 'GET');
  } finally {
    restore();
  }
});

Deno.test('apiRequest — POST request includes JSON body', async () => {
  let capturedInit: RequestInit | undefined;
  const restore = mockFetch((_url, init) => {
    capturedInit = init;
    return makeOkResponse();
  });
  try {
    await apiRequest('POST', '/api/v1/test', { name: 'Thorn', level: 1 });
    const parsed = JSON.parse(capturedInit?.body as string);
    assertEquals(parsed.name, 'Thorn');
    assertEquals(parsed.level, 1);
  } finally {
    restore();
  }
});

Deno.test('apiRequest — Authorization header added when token provided', async () => {
  let capturedHeaders: Headers | undefined;
  const restore = mockFetch((_url, init) => {
    capturedHeaders = new Headers(init?.headers);
    return makeOkResponse();
  });
  try {
    await apiRequest('GET', '/api/v1/test', undefined, { token: 'my-jwt-token' });
    assertEquals(capturedHeaders?.get('Authorization'), 'Bearer my-jwt-token');
  } finally {
    restore();
  }
});

Deno.test('apiRequest — X-Adventurer-Id header added when adventurerId provided', async () => {
  let capturedHeaders: Headers | undefined;
  const restore = mockFetch((_url, init) => {
    capturedHeaders = new Headers(init?.headers);
    return makeOkResponse();
  });
  try {
    await apiRequest('GET', '/api/v1/test', undefined, { adventurerId: 'adv-456' });
    assertEquals(capturedHeaders?.get('X-Adventurer-Id'), 'adv-456');
  } finally {
    restore();
  }
});

Deno.test('apiRequest — both auth headers included together', async () => {
  let capturedHeaders: Headers | undefined;
  const restore = mockFetch((_url, init) => {
    capturedHeaders = new Headers(init?.headers);
    return makeOkResponse();
  });
  try {
    await apiRequest('POST', '/api/v1/test', {}, {
      token: 'tok-abc',
      adventurerId: 'adv-789',
    });
    assertEquals(capturedHeaders?.get('Authorization'), 'Bearer tok-abc');
    assertEquals(capturedHeaders?.get('X-Adventurer-Id'), 'adv-789');
  } finally {
    restore();
  }
});

Deno.test('apiRequest — no Authorization header when token is absent', async () => {
  let capturedHeaders: Headers | undefined;
  const restore = mockFetch((_url, init) => {
    capturedHeaders = new Headers(init?.headers);
    return makeOkResponse();
  });
  try {
    await apiRequest('GET', '/api/v1/test');
    assertEquals(capturedHeaders?.get('Authorization'), null);
  } finally {
    restore();
  }
});

Deno.test('apiRequest — Content-Type is always application/json', async () => {
  let capturedHeaders: Headers | undefined;
  const restore = mockFetch((_url, init) => {
    capturedHeaders = new Headers(init?.headers);
    return makeOkResponse();
  });
  try {
    await apiRequest('POST', '/api/v1/test', {});
    assertEquals(capturedHeaders?.get('Content-Type'), 'application/json');
  } finally {
    restore();
  }
});

Deno.test('apiRequest — returns parsed JSON on 200 response', async () => {
  const restore = mockFetch(() => makeOkResponse({ token: 'jwt-result', user: { id: '1' } }));
  try {
    const result = await apiRequest<{ token: string }>('POST', '/api/v1/auth/login', {});
    assertEquals(result.token, 'jwt-result');
  } finally {
    restore();
  }
});

Deno.test('apiRequest — throws Error on 400 response', async () => {
  const restore = mockFetch(() =>
    new Response('Bad request: missing username', { status: 400 })
  );
  try {
    await assertRejects(
      () => apiRequest('POST', '/api/v1/auth/register', {}),
      Error,
      '400',
    );
  } finally {
    restore();
  }
});

Deno.test('apiRequest — throws Error on 500 response', async () => {
  const restore = mockFetch(() => new Response('Internal Server Error', { status: 500 }));
  try {
    await assertRejects(
      () => apiRequest('GET', '/api/v1/adventurer/'),
      Error,
      '500',
    );
  } finally {
    restore();
  }
});

Deno.test('apiRequest — URL contains the path passed as argument', async () => {
  let capturedUrl = '';
  const restore = mockFetch((url) => {
    capturedUrl = url;
    return makeOkResponse();
  });
  try {
    await apiRequest('GET', '/api/v1/chargen/options');
    assertStringIncludes(capturedUrl, '/api/v1/chargen/options');
  } finally {
    restore();
  }
});
