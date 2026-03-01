import inquirer from "inquirer";
import pc from "picocolors";
// @ts-ignore
import { delay } from "@std/async/delay";
// @ts-ignore
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const API_URL = "http://localhost:4200";
// @ts-ignore
const AUTH_DIR = join(Deno.env.get("HOME") || ".", ".d100");
const AUTH_FILE = join(AUTH_DIR, "auth.json");

// --- Types & Interfaces ---

interface User {
    id: string;
    username: string;
}

interface AuthData {
    token: string;
    user: User;
    selectedAdventurerId?: string;
    selectedPartyId?: string;
}

interface Item {
    id: string;
    name: string;
    value: number;
    fix: number;
    damage?: string;
    bonus?: number;
    usable?: boolean;
    effect?: string;
    slot?: string;
    damagePips?: number;
}

interface Adventurer {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    fate: number;
    life: number;
    str: number;
    dex: number;
    int: number;
    gold: number;
    food: number;
    oil: number;
    picks: number;
    backpack: Item[];
    skills: Record<string, number>;
    path?: string;
    race?: string;
}

interface Monster {
    name: string;
    av: number;
    def: number;
    hp: number;
}

interface GameState {
    adventurer?: Adventurer;
    timeTrack: number;
    currentRoom?: {
        id: number;
        roll: number;
        color: string;
        exits: string;
        features: string;
        searched: boolean;
    };
}

// --- Persistence Layer ---

class AuthManager {
    private data: AuthData | null = null;

    async load() {
        try {
            // @ts-ignore
            const content = await Deno.readTextFile(AUTH_FILE);
            this.data = JSON.parse(content);
        } catch (_) {
            this.data = null;
        }
    }

    async save(data: Partial<AuthData>) {
        this.data = { ...(this.data || {} as AuthData), ...data as AuthData };
        try {
            // @ts-ignore
            await Deno.mkdir(AUTH_DIR, { recursive: true });
            // @ts-ignore
            await Deno.writeTextFile(AUTH_FILE, JSON.stringify(this.data, null, 2));
        } catch (e) {
            console.error(pc.red("Failed to save auth: " + (e as Error).message));
        }
    }

    async clear() {
        this.data = null;
        try {
            // @ts-ignore
            await Deno.remove(AUTH_FILE);
        } catch (_) { /* ignore */ }
    }

    get token() { return this.data?.token; }
    get user() { return this.data?.user; }
    get selectedAdventurerId() { return this.data?.selectedAdventurerId; }
    get selectedPartyId() { return this.data?.selectedPartyId; }
    get isAuthenticated() { return !!this.data?.token; }
}

// --- API Client ---

class ApiClient {
    constructor(private auth: AuthManager) {}

    private async request(path: string, options: RequestInit = {}) {
        const headers = new Headers(options.headers || {});
        if (this.auth.token) {
            headers.set("Authorization", `Bearer ${this.auth.token}`);
        }
        if (this.auth.selectedAdventurerId) {
            headers.set("X-Adventurer-Id", this.auth.selectedAdventurerId);
        }
        if (options.body && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        ui.spinner.start("Descending into the Aether...");
        try {
            const res = await fetch(`${API_URL}${path}`, { ...options, headers });
            if (!res.ok) {
                const error = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(error.error || "Request failed");
            }
            return await res.json();
        } finally {
            ui.spinner.stop();
        }
    }

    async get(path: string) { return this.request(path); }
    async post(path: string, body?: any) { 
        return this.request(path, { 
            method: "POST", 
            body: body ? JSON.stringify(body) : undefined 
        }); 
    }
}

// --- UI Helpers ---

// --- UI Helpers ---

const ui = {
    termWidth: () => {
        try {
            // @ts-ignore
            return Deno.consoleSize().columns;
        } catch (_) {
            return 80;
        }
    },
    center: (text: string) => {
        const width = ui.termWidth();
        return text.split("\n").map(line => {
            const padding = Math.max(0, Math.floor((width - line.length) / 2));
            return " ".repeat(padding) + line;
        }).join("\n");
    },
    box: (text: string, title?: string) => {
        const lines = text.split("\n");
        const width = Math.max(...lines.map(l => l.length), title ? title.length : 0) + 4;
        const top = `┌─${title ? pc.bold(title) : "─"}${"─".repeat(width - (title ? title.length : 0) - 2)}┐`;
        const bottom = `└${"─".repeat(width)}┘`;
        console.log(ui.center(pc.blue(top)));
        lines.forEach(l => console.log(ui.center(`${pc.blue("│")} ${l}${" ".repeat(width - l.length - 2)} ${pc.blue("│")}`)));
        console.log(ui.center(pc.blue(bottom)));
    },
    header: (text: string) => console.log(ui.center(pc.bgBlack(pc.blue(pc.bold(` == ${text} == `))))),
    divider: () => console.log(ui.center(pc.gray("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))),
    stat: (label: string, value: any, colorFn = pc.white) => `${pc.gray(label)}[${colorFn(String(value))}]`,
    error: (msg: string) => console.log(pc.red(`☠ ERR: ${msg}`)),
    success: (msg: string) => console.log(pc.cyan(`✦ ${msg}`)),
    info: (msg: string) => console.log(pc.blue(`ℹ ${msg}`)),
    spinner: {
        interval: 0,
        chars: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
        start: (text: string) => {
            let i = 0;
            // @ts-ignore
            Deno.stdout.writeSync(new TextEncoder().encode("\x1b[?25l")); // Hide cursor
            // @ts-ignore
            ui.spinner.interval = setInterval(() => {
                // @ts-ignore
                Deno.stdout.writeSync(new TextEncoder().encode(`\r${pc.cyan(ui.spinner.chars[i])} ${text}`));
                i = (i + 1) % ui.spinner.chars.length;
            }, 80);
        },
        stop: () => {
            if (ui.spinner.interval) {
                clearInterval(ui.spinner.interval);
                ui.spinner.interval = 0;
                // @ts-ignore
                Deno.stdout.writeSync(new TextEncoder().encode("\r\x1b[K\x1b[?25h")); // Clear line and show cursor
            }
        }
    }
};

// --- Game Engine ---

class D100Game {
    private api: ApiClient;
    private auth: AuthManager;
    private state: GameState | null = null;
    private lastNarrative: string = "";

    constructor() {
        this.auth = new AuthManager();
        this.api = new ApiClient(this.auth);
    }

    async start() {
        await this.titleScreen();
        await this.introMonologue();

        await this.auth.load();
        
        if (!this.auth.isAuthenticated) {
            await this.authFlow();
        }

        ui.success(`IDENTITY VERIFIED: ${this.auth.user?.username}`);
        await this.ensureAdventurer();
        await this.ensureParty();
        await this.mainLoop();
    }

    async titleScreen() {
        console.clear();
        let banner = "";
        try {
            // @ts-ignore
            banner = await Deno.readTextFile("banner.txt");
        } catch (_) {
            banner = "D100 DUNGEON";
        }

        const logo = pc.red(ui.center(banner));
        const subtitle = pc.gray(ui.center("--- A Grimdark JRPG Experience ---"));
        const prompt = pc.white(pc.bold(ui.center("[ PRESS ANY KEY TO DESCEND ]")));

        console.log("\n".repeat(3));
        console.log(logo);
        console.log(subtitle);
        console.log("\n".repeat(2));
        console.log(prompt);
        console.log("\n");

        // Capture any keypress
        // @ts-ignore
        Deno.stdin.setRaw(true);
        const buffer = new Uint8Array(1);
        // @ts-ignore
        await Deno.stdin.read(buffer);
        // @ts-ignore
        Deno.stdin.setRaw(false);
    }

    async introMonologue() {
        console.clear();
        const text = "\n\"The Aether is rotting. The deeper you go, the quieter the gods become...\"\n";
        console.log(ui.center(pc.italic(text)));
        await delay(1500);
    }

    async authFlow() {
        const { mode } = await inquirer.prompt([{
            type: "list",
            name: "mode",
            message: "Welcome, stranger. Who are you?",
            choices: [
                { name: "Login to existing account", value: "login" },
                { name: "Register new account", value: "register" },
                { name: "Exit", value: "exit" }
            ]
        }]);

        if (mode === "exit") Deno.exit(0);

        const prompts = [
            { type: "input", name: "username", message: "Username:" },
            { type: "password", name: "password", message: "Password:" }
        ];

        if (mode === "register") {
            prompts.push({ type: "password", name: "confirm", message: "Confirm Password:" });
        }

        const { username, password, confirm } = await inquirer.prompt(prompts);

        if (mode === "register" && password !== confirm) {
            ui.error("Passwords do not match.");
            return this.authFlow();
        }

        try {
            const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
            const data = await this.api.post(endpoint, { username, password });
            await this.auth.save(data);
            ui.success("Authenticated successfully.");
        } catch (e) {
            ui.error((e as Error).message);
            await this.authFlow();
        }
    }

    async ensureAdventurer() {
        const adventurers = await this.api.get("/api/v1/chargen/list");
        if (adventurers.length === 0) {
            ui.info("No adventurers found. Let us forge your destiny.");
            await this.characterGeneration();
            await this.ensureAdventurer();
            return;
        }

        if (this.auth.selectedAdventurerId) {
            const stillExists = adventurers.find((a: any) => a.id === this.auth.selectedAdventurerId);
            if (stillExists) return;
        }

        ui.header("SELECT ADVENTURER");
        const { selection } = await inquirer.prompt([{
            type: "list",
            name: "selection",
            message: "Choose your hero:",
            choices: [
                ...adventurers.map((a: any) => ({ name: `${a.name} (HP: ${a.hp}/${a.maxHp})`, value: a.id })),
                { name: "+ Create New Adventurer", value: "new" }
            ]
        }]);

        if (selection === "new") {
            await this.characterGeneration();
            await this.ensureAdventurer();
        } else {
            await this.auth.save({ selectedAdventurerId: selection });
            ui.success("Hero selected.");
        }
    }

    async ensureParty() {
        if (this.auth.selectedPartyId) {
            try {
                await this.api.get(`/api/v1/party/${this.auth.selectedPartyId}`);
                return;
            } catch (_) {
                await this.auth.save({ selectedPartyId: undefined });
            }
        }

        ui.info("Establishing group cohesion (creating party)...");
        const res = await this.api.post("/api/v1/party/create", { leaderName: this.auth.user?.username });
        await this.auth.save({ selectedPartyId: res.id });
        ui.success("Party ready.");
    }

    async characterGeneration() {
        ui.header("CHARACTER GENERATION");
        const { name } = await inquirer.prompt([{ type: "input", name: "name", message: "What is your name, hero?" }]);
        const { stats } = await inquirer.prompt([{
            type: "list",
            name: "stats",
            message: "Distribute your base qualities (50, 40, 30):",
            choices: [
                { name: "STR 50, DEX 40, INT 30 (Warrior Primary)", value: [50, 40, 30] },
                { name: "DEX 50, STR 40, INT 30 (Rogue Primary)", value: [40, 50, 30] },
                { name: "INT 50, DEX 40, STR 30 (Sorcerer Primary)", value: [30, 40, 50] }
            ]
        }]);

        const [str, dex, int] = stats;
        const createRes = await this.api.post("/api/v1/chargen/create", { name, str, dex, int });
        const id = createRes.id;

        const { path } = await inquirer.prompt([{
            type: "list",
            name: "path",
            message: "Choose your Hero Path:",
            choices: ["Warrior", "Rogue", "Sorcerer"]
        }]);
        await this.api.post("/api/v1/chargen/path", { id, path });

        const { race } = await inquirer.prompt([{
            type: "list",
            name: "race",
            message: "Choose your Race:",
            choices: ["Human", "Elf", "Dwarf"]
        }]);
        await this.api.post("/api/v1/chargen/race", { id, race });

        const { skillChoices } = await inquirer.prompt([{
            type: "checkbox",
            name: "skillChoices",
            message: "Select 2 skills for a +5 bonus:",
            choices: ["Bravery", "Dodge", "Aware", "Locks", "Traps", "Spellcasting"],
            validate: (input: string[]) => input.length === 2 || "Choose exactly 2."
        }]);
        await this.api.post("/api/v1/chargen/skills", { id, skills: skillChoices });

        await this.api.post("/api/v1/chargen/finalize", { id });
        ui.success("Destiny forged.");
        await delay(1000);
    }

    async refreshState() {
        this.state = await this.api.get("/state");
    }

    renderHUD() {
        if (!this.state?.adventurer) return;
        const adv = this.state.adventurer;
        console.clear();
        
        const hpColor = (adv.hp / adv.maxHp) < 0.25 ? pc.red : (adv.hp / adv.maxHp) < 0.5 ? pc.yellow : pc.green;
        
        const stats = [
            `${ui.stat("HP", `${adv.hp}/${adv.maxHp}`, hpColor)} ${ui.stat("FATE", adv.fate, pc.cyan)} ${ui.stat("LIFE", adv.life, pc.green)}`,
            `${ui.stat("STR", adv.str)} ${ui.stat("DEX", adv.dex)} ${ui.stat("INT", adv.int)} ${ui.stat("GOLD", adv.gold, pc.yellow)}`,
            `${ui.stat("FOOD", adv.food)} ${ui.stat("OIL", adv.oil)} ${ui.stat("TIME", `${this.state.timeTrack}/20`, pc.magenta)}`
        ].join("\n");
        
        ui.box(stats, adv.name.toUpperCase());

        if (this.state.currentRoom) {
            ui.header("LOCATION");
            console.log(pc.italic(`${pc.bold(this.state.currentRoom.color.toUpperCase())} ROOM | EXITS: ${this.state.currentRoom.exits} | FEATURES: ${this.state.currentRoom.features || "NONE"}`));
        }
        ui.divider();
        if (this.lastNarrative) {
            console.log(pc.white(this.lastNarrative));
            ui.divider();
        }
    }

    async mainLoop() {
        while (true) {
            await this.refreshState();
            this.renderHUD();

            const { action } = await inquirer.prompt([{
                type: "list",
                name: "action",
                message: "Actions:",
                choices: [
                    { name: "Move Forward", value: "move" },
                    { name: "Search Room", value: "search" },
                    { name: "Inventory", value: "inventory" },
                    { name: "City / Downtime", value: "downtime" },
                    new inquirer.Separator(),
                    { name: "Logout", value: "logout" },
                    { name: "Quit", value: "exit" }
                ]
            }]);

            if (action === "exit") Deno.exit(0);
            if (action === "logout") { await this.auth.clear(); return this.start(); }

            try {
                if (action === "move") {
                    const res = await this.api.post("/api/v1/dungeon/move");
                    this.lastNarrative = res.narrative;
                    if (res.roll && res.roll > 90) await this.combatLoop(res.roll);
                } else if (action === "search") {
                    const res = await this.api.post("/api/v1/dungeon/search");
                    this.lastNarrative = res.narrative;
                    if (res.roll && res.roll > 90) await this.combatLoop(res.roll);
                } else if (action === "inventory") {
                    await this.inventoryMenu();
                } else if (action === "downtime") {
                    await this.downtimeMenu();
                }
            } catch (e) {
                const msg = (e as Error).message;
                if (msg.includes("dead") || msg.includes("Game over")) {
                    await this.deathSequence();
                } else {
                    ui.error(msg);
                    await delay(2000);
                }
            }
        }
    }

    async deathSequence() {
        console.clear();
        console.log(pc.red(pc.bold(`
                ________________      
               /                \\     
              /                  \\    
             /                    \\   
             |   REST IN FILTH    |   
             |                    |   
             |   ${(this.state?.adventurer?.name || "HERO").padEnd(10).toUpperCase()}   |   
             |                    |   
             |   THE DARK WON     |   
             \\____________________/   
        `)));
        
        ui.header("THE FINAL VOID");
        console.log(pc.white("Your journey ends in the mud and the dark. The dungeon swallows another soul."));
        ui.divider();
        
        // Final narrative from the AI if possible
        try {
            const res = await this.api.post("/api/v1/dungeon/move"); // Trigger a final narrative
            if (res.narrative) {
                console.log(pc.italic(`"Last Words: ${res.narrative}"`));
            }
        } catch (_) { /* ignore errors during death */ }

        await inquirer.prompt([{ type: "input", name: "any", message: "Press Enter to exit the cycle..." }]);
        // @ts-ignore
        Deno.exit(0);
    }

    async inventoryMenu() {
        while (true) {
            const adv = this.state?.adventurer;
            if (!adv) return;
            ui.header("INVENTORY");
            const { invAction } = await inquirer.prompt([{
                type: "list",
                name: "invAction",
                message: "Backpack:",
                pageSize: 15,
                choices: [
                    ...adv.backpack.map(i => ({ name: `${i.name} (Val: ${i.value}${i.slot ? `, Slot: ${i.slot}` : ""})`, value: i.id })),
                    new inquirer.Separator(),
                    { name: "Back", value: "back" }
                ]
            }]);

            if (invAction === "back") return;
            const item = adv.backpack.find(i => i.id === invAction);
            if (!item) continue;

            const { action } = await inquirer.prompt([{
                type: "list",
                name: "action",
                message: `${item.name}:`,
                choices: [
                    ...(item.slot ? [{ name: "Equip", value: "equip" }] : []),
                    ...(item.usable ? [{ name: "Use Item", value: "use" }] : []),
                    { name: "Drop", value: "drop" },
                    { name: "Back", value: "back" }
                ]
            }]);

            if (action === "back") continue;

            try {
                if (action === "equip") {
                    const { slot } = await inquirer.prompt([{
                        type: "list",
                        name: "slot",
                        message: "Equip to which slot?",
                        choices: ["Head", "Torso", "Back", "MainHand", "OffHand", "Belt", "Belt1", "Belt2"]
                    }]);
                    const res = await this.api.post("/api/v1/adventurer/equip", { itemId: item.id, slot });
                    ui.success(res.message);
                } else {
                    ui.info(`${action} not yet implemented.`);
                }
            } catch (e) { ui.error((e as Error).message); }
            await delay(1000);
            await this.refreshState();
        }
    }

    async combatLoop(roll: number) {
        ui.header("COMBAT STARTED");
        const partyId = this.auth.selectedPartyId;
        const combatStart = await this.api.post("/api/v1/combat/start", { partyId, roll });
        let monster = combatStart.monster as Monster;

        while (monster.hp > 0) {
            console.clear();
            ui.header("COMBAT");
            console.log(ui.stat("Monster", monster.name) + ui.stat("HP", monster.hp, pc.red) + ui.stat("AV", monster.av));
            ui.divider();
            
            const { action } = await inquirer.prompt([{
                type: "list",
                name: "action",
                message: "Combat Action:",
                choices: [
                    { name: "Attack (Main Hand)", value: "MainHand" },
                    { name: "Attack (Off Hand)", value: "OffHand" },
                    { name: "Flee", value: "flee" }
                ]
            }]);

            if (action === "flee") break;

            try {
                if (action === "MainHand" || action === "OffHand") {
                    const res = await this.api.post("/api/v1/combat/attack", { partyId, adventurerId: this.auth.selectedAdventurerId, weaponSlot: action });
                    const resolution = res.resolution;
                    resolution.events.forEach((e: string) => console.log(pc.yellow(e)));
                    monster.hp = resolution.monsterHp;
                    if (monster.hp <= 0) {
                        ui.success(`Slain!`);
                        const lootRes = await this.api.post("/api/v1/dungeon/search");
                        ui.info("Loot: " + lootRes.narrative);
                    }
                }
            } catch (e) { ui.error((e as Error).message); }
            await inquirer.prompt([{ type: "input", name: "any", message: "Enter to continue..." }]);
        }
    }

    async downtimeMenu() {
        while (true) {
            ui.header("CITY HUB");
            const { action } = await inquirer.prompt([{
                type: "list",
                name: "action",
                message: "City Actions:",
                choices: [
                    { name: "Heal HP", value: "heal" },
                    { name: "Repair Item", value: "repair" },
                    { name: "Buy Supplies", value: "supplies" },
                    { name: "Search Market", value: "market" },
                    { name: "Train", value: "train" },
                    new inquirer.Separator(),
                    { name: "Return to Dungeon", value: "back" }
                ]
            }]);

            if (action === "back") return;

            try {
                if (action === "heal") {
                    const { amount } = await inquirer.prompt([{ type: "number", name: "amount", message: "Heal amount?" }]);
                    const res = await this.api.post("/api/v1/downtime/heal", { amount });
                    ui.success(res.message);
                } else if (action === "repair") {
                    const items = this.state?.adventurer?.backpack.filter(i => (i.fix || 0) > 0);
                    if (!items?.length) { ui.info("No items to repair."); continue; }
                    const { itemId } = await inquirer.prompt([{ type: "list", name: "itemId", message: "Repair:", choices: items.map(i => ({ name: i.name, value: i.id })) }]);
                    const { pips } = await inquirer.prompt([{ type: "number", name: "pips", message: "Pips?" }]);
                    const res = await this.api.post("/api/v1/downtime/repair", { itemId, pips });
                    ui.success(res.message);
                } else if (action === "train") {
                    const { target } = await inquirer.prompt([{ type: "list", name: "target", message: "Train:", choices: ["STR", "DEX", "INT"] }]);
                    const { pips } = await inquirer.prompt([{ type: "number", name: "pips", message: "Pips?" }]);
                    const res = await this.api.post("/api/v1/downtime/train", { target, pips });
                    ui.success(res.message);
                } else { ui.info(`${action} not ready.`); }
            } catch (e) { ui.error((e as Error).message); }
            await delay(1000);
            await this.refreshState();
        }
    }
}

// --- Bootstrap ---
if (import.meta.main) {
    try {
        const game = new D100Game();
        await game.start();
    } catch (err) {
        console.error(pc.red("Fatal error: " + (err as Error).message));
        Deno.exit(1);
    }
}
