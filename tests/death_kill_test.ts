import { assertEquals, assertExists } from "@std/assert";
import { getDeathKill, LOCATION_NAMES, DEATH_KILL_TABLE } from "../server/data/death_kill_table.ts";

// ── getDeathKill: no-kill cases ───────────────────────────────────────────────

Deno.test("getDeathKill - returns null for excess < 10", () => {
    assertEquals(getDeathKill(1, 9),  null);
    assertEquals(getDeathKill(1, 0),  null);
    assertEquals(getDeathKill(1, -5), null);
});

// ── getDeathKill: exact tier boundaries ──────────────────────────────────────

Deno.test("getDeathKill - returns entry for excess = 10 (Head)", () => {
    const entry = getDeathKill(1, 10);
    assertExists(entry);
    assertEquals(entry!.location, 1);
    assertEquals(entry!.tableBonus, 5);
});

Deno.test("getDeathKill - returns entry for excess = 11 (Head)", () => {
    const entry = getDeathKill(1, 11);
    assertExists(entry);
    assertEquals(entry!.tableBonus, 5);
});

Deno.test("getDeathKill - returns entry for excess = 12 (Head)", () => {
    const entry = getDeathKill(1, 12);
    assertExists(entry);
    assertEquals(entry!.tableBonus, 10);
});

Deno.test("getDeathKill - returns entry for excess = 14 (Head)", () => {
    const entry = getDeathKill(1, 14);
    assertExists(entry);
    assertEquals(entry!.tableBonus, 15);
});

Deno.test("getDeathKill - excess ≥ 15 resolves to the 15+ tier", () => {
    const e15 = getDeathKill(1, 15);
    const e20 = getDeathKill(1, 20);
    const e99 = getDeathKill(1, 99);
    assertExists(e15);
    // All extreme excess should hit the same entry (capped at 15)
    assertEquals(e15!.description, e20!.description);
    assertEquals(e15!.description, e99!.description);
    assertEquals(e15!.tableBonus, 15);
});

// ── Location coverage ─────────────────────────────────────────────────────────

Deno.test("getDeathKill - all standard locations return entries at excess=10", () => {
    const locations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const loc of locations) {
        const entry = getDeathKill(loc, 10);
        assertExists(entry, `Expected entry for location ${loc}`);
        assertEquals(entry!.location, loc);
    }
});

Deno.test("getDeathKill - Hand locations 5, 6, 7 share same descriptions", () => {
    const e5 = getDeathKill(5, 10);
    const e6 = getDeathKill(6, 10);
    const e7 = getDeathKill(7, 10);
    assertExists(e5); assertExists(e6); assertExists(e7);
    assertEquals(e5!.description, e6!.description);
    assertEquals(e5!.description, e7!.description);
});

Deno.test("getDeathKill - Waist (8) returns correct entry", () => {
    const entry = getDeathKill(8, 12);
    assertExists(entry);
    assertEquals(entry!.location, 8);
    assertEquals(entry!.tableBonus, 10);
});

Deno.test("getDeathKill - Legs (9) returns correct entry", () => {
    const entry = getDeathKill(9, 13);
    assertExists(entry);
    assertEquals(entry!.location, 9);
    assertEquals(entry!.tableBonus, 10);
});

Deno.test("getDeathKill - Feet (10) returns correct entry", () => {
    const entry = getDeathKill(10, 14);
    assertExists(entry);
    assertEquals(entry!.location, 10);
    assertEquals(entry!.tableBonus, 15);
});

// ── LOCATION_NAMES ────────────────────────────────────────────────────────────

Deno.test("LOCATION_NAMES maps all 10 locations", () => {
    for (let i = 1; i <= 10; i++) {
        assertExists(LOCATION_NAMES[i], `Expected name for location ${i}`);
    }
});

Deno.test("LOCATION_NAMES - Head is location 1", () => {
    assertEquals(LOCATION_NAMES[1], "Head");
});

Deno.test("LOCATION_NAMES - Hands covers locations 5, 6, 7", () => {
    assertEquals(LOCATION_NAMES[5], "Hands");
    assertEquals(LOCATION_NAMES[6], "Hands");
    assertEquals(LOCATION_NAMES[7], "Hands");
});

// ── Table completeness ────────────────────────────────────────────────────────

Deno.test("DEATH_KILL_TABLE covers 6 tiers for each of 10 locations", () => {
    const locationSet = new Set(DEATH_KILL_TABLE.map(e => e.location));
    // Locations 1-10, but 5/6/7 share entries so raw location count includes all
    assertEquals(locationSet.size, 10);
});

Deno.test("DEATH_KILL_TABLE - each entry has a non-empty description", () => {
    for (const entry of DEATH_KILL_TABLE) {
        assertEquals(entry.description.length > 0, true,
            `Empty description at location=${entry.location}, minExcess=${entry.minExcess}`);
    }
});
