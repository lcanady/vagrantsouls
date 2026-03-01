import { assertEquals, assertExists } from "@std/assert";
import {
    CAMPAIGN_QUESTS,
    getCampaignQuest,
    getNextCampaignQuest,
} from "../server/data/campaign_quests.ts";
import {
    SIDE_QUESTS,
    lookupSideQuest,
    getSideQuest,
} from "../server/data/side_quests.ts";

// ── Campaign Quests ───────────────────────────────────────────────────────────

Deno.test("Campaign quests - exactly 20 quests defined", () => {
    assertEquals(CAMPAIGN_QUESTS.length, 20);
});

Deno.test("Campaign quests - orders are 1-20 with no gaps", () => {
    const orders = CAMPAIGN_QUESTS.map(q => q.order).sort((a, b) => a - b);
    for (let i = 0; i < 20; i++) {
        assertEquals(orders[i], i + 1);
    }
});

Deno.test("Campaign quests - IDs are CQ1 through CQ20", () => {
    for (let i = 1; i <= 20; i++) {
        const id = `CQ${i}`;
        const q = getCampaignQuest(id);
        assertExists(q, `Expected ${id} to exist`);
        assertEquals(q!.id, id);
    }
});

Deno.test("getCampaignQuest - returns undefined for unknown id", () => {
    assertEquals(getCampaignQuest("CQ99"), undefined);
    assertEquals(getCampaignQuest(""), undefined);
});

Deno.test("getCampaignQuest - is case-insensitive via route (id already uppercased)", () => {
    // The route calls .toUpperCase() before getCampaignQuest — test the helper directly
    assertExists(getCampaignQuest("CQ1"));
});

Deno.test("getCampaignQuest - CQ1 has correct title and encounter modifier", () => {
    const q = getCampaignQuest("CQ1")!;
    assertEquals(q.title, "Getting to Dirtwood");
    assertEquals(q.encounterModifier, -20);
});

Deno.test("getCampaignQuest - CQ20 is the final quest", () => {
    const q = getCampaignQuest("CQ20")!;
    assertEquals(q.order, 20);
    assertExists(q.objective);
});

Deno.test("getNextCampaignQuest - returns next quest in sequence", () => {
    const next = getNextCampaignQuest(1);
    assertExists(next);
    assertEquals(next!.order, 2);
    assertEquals(next!.id, "CQ2");
});

Deno.test("getNextCampaignQuest - returns undefined after last quest", () => {
    const next = getNextCampaignQuest(20);
    assertEquals(next, undefined);
});

Deno.test("getNextCampaignQuest - works for middle of campaign", () => {
    const next = getNextCampaignQuest(10);
    assertExists(next);
    assertEquals(next!.order, 11);
});

Deno.test("Campaign quests - all quests have non-empty required fields", () => {
    for (const q of CAMPAIGN_QUESTS) {
        assertExists(q.id,            `CQ${q.order}: missing id`);
        assertExists(q.title,          `CQ${q.order}: missing title`);
        assertExists(q.objective,      `CQ${q.order}: missing objective`);
        assertExists(q.successReward,  `CQ${q.order}: missing successReward`);
        assertExists(q.failurePenalty, `CQ${q.order}: missing failurePenalty`);
    }
});

// ── Side Quests ───────────────────────────────────────────────────────────────

Deno.test("Side quests - exactly 25 quests defined", () => {
    assertEquals(SIDE_QUESTS.length, 25);
});

Deno.test("Side quests - letters span A through Y (25 letters)", () => {
    const letters = SIDE_QUESTS.map(q => q.letter).sort();
    assertEquals(letters[0], "A");
    assertEquals(letters[24], "Y");
    // No duplicates
    assertEquals(new Set(letters).size, 25);
});

Deno.test("Side quests - d100 rolls cover 1-100 with no gaps", () => {
    // Build coverage array
    const covered = new Array(100).fill(false);
    for (const q of SIDE_QUESTS) {
        for (let r = q.minRoll; r <= q.maxRoll; r++) {
            covered[r - 1] = true;
        }
    }
    for (let i = 0; i < 100; i++) {
        assertEquals(covered[i], true, `Roll ${i + 1} is not covered`);
    }
});

Deno.test("lookupSideQuest - returns quest A for rolls 1-4", () => {
    for (const roll of [1, 2, 3, 4]) {
        const q = lookupSideQuest(roll);
        assertExists(q, `Expected quest for roll ${roll}`);
        assertEquals(q!.letter, "A");
    }
});

Deno.test("lookupSideQuest - returns quest Y for rolls 97-100", () => {
    for (const roll of [97, 98, 99, 100]) {
        const q = lookupSideQuest(roll);
        assertExists(q, `Expected quest for roll ${roll}`);
        assertEquals(q!.letter, "Y");
    }
});

Deno.test("lookupSideQuest - roll 5 returns quest B", () => {
    const q = lookupSideQuest(5);
    assertExists(q);
    assertEquals(q!.letter, "B");
});

Deno.test("lookupSideQuest - roll 41 returns quest K (Horn of the Dead)", () => {
    const q = lookupSideQuest(41);
    assertExists(q);
    assertEquals(q!.letter, "K");
    assertEquals(q!.title, "The Horn of the Dead");
});

Deno.test("getSideQuest - returns quest by id", () => {
    const q = getSideQuest("QAA");
    assertExists(q);
    assertEquals(q!.letter, "A");
    assertEquals(q!.title, "The Well of Despair");
});

Deno.test("getSideQuest - returns undefined for unknown id", () => {
    assertEquals(getSideQuest("QAZ"), undefined);
    assertEquals(getSideQuest(""), undefined);
});

Deno.test("Side quests - all quests have non-empty required fields", () => {
    for (const q of SIDE_QUESTS) {
        assertExists(q.id,            `${q.id}: missing id`);
        assertExists(q.title,          `${q.id}: missing title`);
        assertExists(q.objective,      `${q.id}: missing objective`);
        assertExists(q.successReward,  `${q.id}: missing successReward`);
        assertExists(q.failurePenalty, `${q.id}: missing failurePenalty`);
    }
});

Deno.test("Side quests - encounter modifiers are non-negative", () => {
    for (const q of SIDE_QUESTS) {
        assertEquals(q.encounterModifier >= 0, true,
            `${q.id}: encounterModifier should be ≥ 0`);
    }
});

Deno.test("Side quests - quest W (Old Brin) has highest reward", () => {
    const w = getSideQuest("QAW")!;
    assertExists(w);
    assertEquals(w.successReward.includes("3800gp"), true);
});

Deno.test("Side quests - quest Y (Saving the King) has highest encounter modifier", () => {
    const y = getSideQuest("QAY")!;
    assertEquals(y.encounterModifier, 20);
});
