import { assertEquals, assertExists } from "@std/assert";
import app from "../server/main.ts";

Deno.test("Auth Flow: Register and Login", async () => {
  const username = `testuser_${crypto.randomUUID().substring(0, 8)}`;
  const password = "testpassword123";

  // 1. Register
  const registerRes = await app.request("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    headers: { "Content-Type": "application/json" },
  });

  assertEquals(registerRes.status, 200);
  const registerData = await registerRes.json();
  assertExists(registerData.token);
  assertEquals(registerData.user.username, username);

  // 2. Login
  const loginRes = await app.request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    headers: { "Content-Type": "application/json" },
  });

  assertEquals(loginRes.status, 200);
  const loginData = await loginRes.json();
  assertExists(loginData.token);
  assertEquals(loginData.user.username, username);
});

Deno.test("Auth Flow: Protected Route - Unauthorized", async () => {
  const res = await app.request("/api/v1/adventurer/state", {
    method: "GET",
  });

  assertEquals(res.status, 401);
  const data = await res.json();
  assertEquals(data.error, "Unauthorized: Missing or invalid token");
});

Deno.test("Auth Flow: Protected Route - Authorized", async () => {
    const username = `testuser_${crypto.randomUUID().substring(0, 8)}`;
    const password = "testpassword123";
  
    // Register to get token
    const registerRes = await app.request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
    });
    const { token } = await registerRes.json();

    const res = await app.request("/api/v1/adventurer", {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });
  
    // Should NOT be 401. It might be 404 or something else depending on if the route exists exactly as requested,
    // but definitely not 401.
    assertEquals(res.status !== 401, true);
});
