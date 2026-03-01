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
  return c.json({ message: "Welcome to D100 Dungeon API" });
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

app.route("/api/v1/adventurer", adventurerRoutes);
app.route("/api/v1/chargen", chargenRoutes);
app.route("/api/v1/dungeon", dungeonRoutes);
app.route("/api/v1/combat", combatRoutes);
app.route("/api/v1/party", partyRoutes);
app.route("/api/v1/downtime", downtimeRoutes);
app.route("/api/v1/quests", questRoutes);
app.route("/api/v1/extra", extraRulesRoutes);
app.route("/api/v1/guilds", guildsRoutes);

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
