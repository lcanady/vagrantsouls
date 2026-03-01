import { Hono } from "hono";
import { z } from "zod";
import { checkDead } from "../middleware/game_logic.ts";
import { loadAdventurer } from "../middleware/adventurer.ts";
import { combatLobby, encounterService, webSocketService, partyService } from "../services/instances.ts";

const combatRoutes = new Hono();

const StartCombatSchema = z.object({
    partyId:           z.string(),
    roll:              z.number().int().min(1).max(100),
    table:             z.enum(["E", "EA"]).optional().default("E"),
    encounterModifier: z.number().int().optional().default(0),
});

const AttackSchema = z.object({
    partyId:      z.string(),
    adventurerId: z.string(),
    weaponSlot:   z.enum(["rHand", "lHand"]),
    targetId:     z.string().optional(),
});

const PassItemSchema = z.object({
    partyId:      z.string(),
    adventurerId: z.string(),
    targetId:     z.string(),
    slot:         z.string(),  // inventory slot key on the giver's adventurer
});

// POST /api/v1/combat/start
combatRoutes.post("/start", async (c) => {
    const body = await c.req.json();
    const result = StartCombatSchema.safeParse(body);
    if (!result.success) return c.json({ error: "Invalid request", details: result.error }, 400);

    const { partyId, roll, table, encounterModifier } = result.data;
    const party = partyService.getParty(partyId);
    if (!party) return c.json({ error: "Party not found" }, 404);

    if (combatLobby.getMonster(partyId)) {
        return c.json({ error: "Combat already in progress" }, 400);
    }

    const monster = encounterService.generateMonster(
        roll,
        party.members.length,
        table,
        encounterModifier,
    );
    combatLobby.startCombat(partyId, monster);

    webSocketService.broadcast(partyId, { type: "COMBAT_START", monster });

    return c.json({ message: "Combat started", monster });
});

// POST /api/v1/combat/attack
combatRoutes.post("/attack", loadAdventurer, checkDead, async (c) => {
    const body = await c.req.json();
    const result = AttackSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: "Invalid request", details: result.error.format() }, 400);
    }

    const { partyId, adventurerId, weaponSlot } = result.data;

    try {
        const status = combatLobby.submitAction(partyId, adventurerId, {
            type: "ATTACK",
            payload: { weaponSlot },
        });

        if (status.ready) {
            const resolution = combatLobby.resolveTurn(partyId);
            webSocketService.broadcast(partyId, { type: "TURN_RESOLUTION", resolution });
            return c.json({ message: "Turn resolved", resolution });
        }

        return c.json({
            message: "Action submitted, waiting for party",
            pendingCount: status.pendingCount,
            totalCount:   status.totalCount,
        });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/combat/flee
// Submit FLEE action for the current combat round.
combatRoutes.post("/flee", loadAdventurer, checkDead, async (c) => {
    const body = await c.req.json();
    const { partyId, adventurerId } = z.object({
        partyId: z.string(),
        adventurerId: z.string(),
    }).parse(body);

    try {
        const status = combatLobby.submitAction(partyId, adventurerId, {
            type: "FLEE",
            payload: {},
        });

        if (status.ready) {
            const resolution = combatLobby.resolveTurn(partyId);
            webSocketService.broadcast(partyId, { type: "TURN_RESOLUTION", resolution });
            return c.json({ message: "Turn resolved", resolution });
        }

        return c.json({
            message: "Flee action submitted, waiting for party",
            pendingCount: status.pendingCount,
            totalCount:   status.totalCount,
        });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/combat/defend
// Submit WAIT (defend) action — adventurer holds position this round.
combatRoutes.post("/defend", loadAdventurer, checkDead, async (c) => {
    const body = await c.req.json();
    const { partyId, adventurerId } = z.object({
        partyId: z.string(),
        adventurerId: z.string(),
    }).parse(body);

    try {
        const status = combatLobby.submitAction(partyId, adventurerId, {
            type: "WAIT",
            payload: {},
        });

        if (status.ready) {
            const resolution = combatLobby.resolveTurn(partyId);
            webSocketService.broadcast(partyId, { type: "TURN_RESOLUTION", resolution });
            return c.json({ message: "Turn resolved", resolution });
        }

        return c.json({
            message: "Defend action submitted, waiting for party",
            pendingCount: status.pendingCount,
            totalCount:   status.totalCount,
        });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

// POST /api/v1/combat/pass-item
// Pass an item from one adventurer's slot to another's backpack.
combatRoutes.post("/pass-item", loadAdventurer, checkDead, async (c) => {
    const body = await c.req.json();
    const result = PassItemSchema.safeParse(body);
    if (!result.success) {
        return c.json({ error: "Invalid request", details: result.error.format() }, 400);
    }

    const { partyId, adventurerId, targetId, slot } = result.data;

    try {
        const status = combatLobby.submitAction(partyId, adventurerId, {
            type: "PASS_ITEM",
            payload: { targetId, slot },
        });

        if (status.ready) {
            const resolution = combatLobby.resolveTurn(partyId);
            webSocketService.broadcast(partyId, { type: "TURN_RESOLUTION", resolution });
            return c.json({ message: "Turn resolved", resolution });
        }

        return c.json({
            message: "Pass-item action submitted, waiting for party",
            pendingCount: status.pendingCount,
            totalCount:   status.totalCount,
        });
    } catch (e) {
        return c.json({ error: (e as Error).message }, 400);
    }
});

export default combatRoutes;
