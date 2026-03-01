import { assertEquals, assertExists } from "@std/assert";

const BASE_URL = "http://localhost:4200/api/v1";
let token: string;
let adventurerId: string;

Deno.test("Multi-Character Support Flow", async (t: Deno.TestContext) => {
  
  await t.step("Login/Register to get token", async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: `user_${Date.now()}`, password: "password123" }),
    });
    const data = await res.json();
    assertEquals(res.status, 200);
    token = data.token;
  });

  await t.step("Create Adventurer (Step 1)", async () => {
    const res = await fetch(`${BASE_URL}/chargen/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name: "MultiHero", str: 50, dex: 40, int: 30 }),
    });
    const data = await res.json();
    assertEquals(res.status, 200);
    assertExists(data.id);
    adventurerId = data.id;
  });

  await t.step("Apply Path (Step 2)", async () => {
    const res = await fetch(`${BASE_URL}/chargen/path`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id: adventurerId, path: "Warrior" }),
    });
    const data = await res.json();
    assertEquals(res.status, 200);
    assertEquals(data.adventurer.path, "Warrior");
  });

  await t.step("Apply Race (Step 3)", async () => {
    const res = await fetch(`${BASE_URL}/chargen/race`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id: adventurerId, race: "Elf" }),
    });
    const data = await res.json();
    assertEquals(res.status, 200);
    assertEquals(data.adventurer.race, "Elf");
  });

  await t.step("Apply Skills (Step 4)", async () => {
    const res = await fetch(`${BASE_URL}/chargen/skills`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id: adventurerId, skills: ["Dodge", "Aware"] }),
    });
    await res.body?.cancel();
    assertEquals(res.status, 200);
  });

  await t.step("Finalize (Step 5)", async () => {
    const res = await fetch(`${BASE_URL}/chargen/finalize`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id: adventurerId }),
    });
    const _data = await res.json();
    assertEquals(res.status, 200);
    assertExists(_data.adventurer.backpack);
  });

  await t.step("List User Characters", async () => {
    const res = await fetch(`${BASE_URL}/chargen/list`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`
      },
    });
    const data = await res.json();
    assertEquals(res.status, 200);
    assertEquals(Array.isArray(data), true);
    assertEquals(data.length >= 1, true);
    console.log("User characters:", data.map((a: { name: string }) => a.name));
  });
});
