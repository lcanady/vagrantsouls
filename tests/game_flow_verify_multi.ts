import { assertEquals, assertExists } from "@std/assert";

const BASE_URL = "http://localhost:4200/api/v1";
let token: string;
let adventurerId: string;

Deno.test("Character-Specific Game Actions Flow", async (t: Deno.TestContext) => {
  
  await t.step("Login/Register", async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: `game_user_${Date.now()}`, password: "password123" }),
    });
    const data = await res.json();
    assertEquals(res.status, 200);
    token = data.token;
  });

  await t.step("Create Character", async () => {
    const res = await fetch(`${BASE_URL}/chargen/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name: "SelectableHero", str: 50, dex: 40, int: 30 }),
    });
    const data = await res.json();
    assertEquals(res.status, 200);
    adventurerId = data.id;
  });

  await t.step("Finalize Character", async () => {
      // Fast-forward to finalize
      const res = await fetch(`${BASE_URL}/chargen/finalize`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id: adventurerId }),
      });
      await res.body?.cancel();
  });

  await t.step("Move in Dungeon (requires X-Adventurer-Id)", async () => {
    const res = await fetch(`${BASE_URL}/dungeon/move`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "X-Adventurer-Id": adventurerId
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    assertEquals(res.status, 200);
    assertExists(data.room);
    assertExists(data.narrative);
  });

  await t.step("Verify State is Saved", async () => {
    const res = await fetch(`${BASE_URL}/adventurer`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "X-Adventurer-Id": adventurerId
      },
    });
    const data = await res.json();
    assertEquals(res.status, 200);
    assertEquals(data.name, "SelectableHero");
  });

  await t.step("Accessing with wrong ID or no ID should fail", async () => {
    const noIdRes = await fetch(`${BASE_URL}/dungeon/move`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    });
    await noIdRes.body?.cancel();
    assertEquals(noIdRes.status, 400);

    const wrongIdRes = await fetch(`${BASE_URL}/dungeon/move`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "X-Adventurer-Id": crypto.randomUUID()
      },
    });
    await wrongIdRes.body?.cancel();
    assertEquals(wrongIdRes.status, 404);
  });
});
