import { Hono, Context, Next } from "hono";
import { gameState, resetGameState } from "./state.ts";
import adventurerRoutes from "./routes/adventurer.ts";
import dungeonRoutes from "./routes/dungeon.ts";
import combatRoutes from "./routes/combat.ts";
import partyRoutes from "./routes/party.ts";
import { checkDead } from "./middleware/game_logic.ts";
import { webSocketService } from "./services/instances.ts";
import authRoutes from "./routes/auth.ts";
import chargenRoutes from "./routes/chargen.ts";
import downtimeRoutes from "./routes/downtime.ts";
import questRoutes from "./routes/quests.ts";
import extraRulesRoutes from "./routes/extrarules.ts";
import guildsRoutes from "./routes/guilds.ts";
import worldBuilderRoutes from "./routes/world_builder.ts";
import { Repository } from "./repository.ts";
import { authMiddleware } from "./middleware/auth.ts";

const app = new Hono<{ Variables: { repository: Repository, user?: { id: string, username: string } } }>();

// Initialize Repository
const kv = await Deno.openKv();
const repository = new Repository(kv);

// Inject Repository into Context
app.use("*", async (c: Context, next: Next) => {
  c.set("repository", repository);
  await next();
});

// --- Routes ---

app.get("/", (c: Context) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VagrantSoul — D100 Dungeon API</title>
  <style>
    body { margin: 0; background: #1a1a2e; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: monospace; color: #f0c040; }
    img { max-width: 480px; width: 90%; border-radius: 8px; }
    p { margin: 1.5rem 0 0; font-size: 0.85rem; opacity: 0.6; letter-spacing: 0.1em; }
  </style>
</head>
<body>
  <img src="/logo.png" alt="VagrantSoul">
  <p>D100 DUNGEON API · v1</p>
</body>
</html>`);
});

app.get("/logo.png", async (_c: Context) => {
  const data = await Deno.readFile("./vagrant.png");
  return new Response(data, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
});

// Get current game state
app.get("/state", (c: Context) => {
  return c.json(gameState);
});

// Mount sub-apps
app.route("/api/v1/auth", authRoutes);

// Protected Routes
app.use("/api/v1/adventurer/*", authMiddleware);
app.use("/api/v1/chargen/*", authMiddleware);
app.use("/api/v1/dungeon/*", authMiddleware);
app.use("/api/v1/combat/*", authMiddleware);
app.use("/api/v1/party/*", authMiddleware);
app.use("/api/v1/downtime/*", authMiddleware);
app.use("/api/v1/quests/*", authMiddleware);
app.use("/api/v1/extra/*", authMiddleware);
app.use("/api/v1/guilds/adventurer/*", authMiddleware);
app.use("/api/v1/worldbuilder/*", authMiddleware);

app.route("/api/v1/adventurer", adventurerRoutes);
app.route("/api/v1/chargen", chargenRoutes);
app.route("/api/v1/dungeon", dungeonRoutes);
app.route("/api/v1/combat", combatRoutes);
app.route("/api/v1/party", partyRoutes);
app.route("/api/v1/downtime", downtimeRoutes);
app.route("/api/v1/quests", questRoutes);
app.route("/api/v1/extra", extraRulesRoutes);
app.route("/api/v1/guilds", guildsRoutes);
app.route("/api/v1/worldbuilder", worldBuilderRoutes);

// WebSocket Route
app.get("/ws/party/:partyId", (c: Context) => {
    const partyId = c.req.param("partyId");
    if (!partyId) return c.text("Missing partyId", 400);

    const { socket, response } = Deno.upgradeWebSocket(c.req.raw);
    
    socket.onopen = () => {
        webSocketService.addConnection(partyId, socket);
    };

    return response;
});

// Reset Game (Updated to use shared state reset)
app.post("/reset", (c: Context) => {
    checkDead(c, async () => {}); 
    const newState = resetGameState();
    return c.json(newState);
});

if (import.meta.main) {
  Deno.serve({ port: 4200 }, app.fetch);
}

export default app;
