import { Hono } from "hono";
import { z } from "zod";
import { PartyService } from "../services/PartyService.ts";

const partyRoutes = new Hono();
const partyService = new PartyService();

const CreatePartySchema = z.object({
  leaderName: z.string()
});

const JoinPartySchema = z.object({
  adventurerName: z.string()
});

partyRoutes.post("/create", async (c) => {
  const body = await c.req.json();
  const result = CreatePartySchema.safeParse(body);
  if (!result.success) return c.json({ error: "Invalid request", details: result.error }, 400);

  const party = partyService.createParty(result.data.leaderName);
  return c.json(party);
});

partyRoutes.post("/:partyId/join", async (c) => {
  const partyId = c.req.param("partyId");
  const body = await c.req.json();
  const result = JoinPartySchema.safeParse(body);
  if (!result.success) return c.json({ error: "Invalid request", details: result.error }, 400);

  try {
    const { party, adventurerId } = partyService.joinParty(partyId, result.data.adventurerName);
    return c.json({ party, adventurerId });
  } catch (e) {
    const error = e as Error;
    return c.json({ error: error.message }, 404);
  }
});

partyRoutes.post("/:partyId/leave", async (c) => {
    // Current implementation requires adventurerId in body or header?
    // Let's assume body for now or simple "leave" if identified.
    // We'll require adventurerId in body.
    const partyId = c.req.param("partyId");
    const body = await c.req.json();
    const adventurerId = body.adventurerId;
    
    if (!adventurerId) return c.json({ error: "Missing adventurerId" }, 400);

    try {
        const party = partyService.leaveParty(partyId, adventurerId);
        return c.json(party);
    } catch (e) {
        const error = e as Error;
        return c.json({ error: error.message }, 404);
    }
});

partyRoutes.get("/:partyId", (c) => {
    const partyId = c.req.param("partyId");
    const party = partyService.getParty(partyId);
    if (!party) return c.json({ error: "Party not found" }, 404);
    return c.json(party);
});

export default partyRoutes;
