import blessed from "blessed";
// import contrib from "blessed-contrib"; // Removing problematic dependency
import { GameState } from "./models/gamestate.ts";
import { Adventurer } from "./models/adventurer.ts";

// --- Configuration ---
const API_URL = "http://localhost:4200";

// Norton Commander Blue style
const SCREEN_STYLE = {
  bg: "blue",
  fg: "white",
};

// --- Initialization ---

const screen = blessed.screen({
  smartCSR: true,
  title: "Vagrant Souls Client",
  style: SCREEN_STYLE,
  fullUnicode: true,
});

// Create a grid layout (Manual replacement for contrib.grid)
// Rows: 12, Cols: 12
// We'll use percentages for responsiveness.
const menuHeight = 1;
const gridRows = 12;
const gridCols = 12;

function getGridPos(row: number, col: number, rowSpan: number, colSpan: number) {
  return {
    top: `${(row / gridRows) * 100}%`,
    left: `${(col / gridCols) * 100}%`,
    width: `${(colSpan / gridCols) * 100}%`,
    height: `${(rowSpan / gridRows) * 100}%`,
  };
}

// Adjust top to account for menu bar
function getGridPosWithMenu(row: number, col: number, rowSpan: number, colSpan: number) {
  const pos = getGridPos(row, col, rowSpan, colSpan);
  return {
    ...pos,
    top: `calc(${(row / gridRows) * 100}% + ${menuHeight})`,
    height: `calc(${(rowSpan / gridRows) * 100}% - ${menuHeight})`,
  };
}

// --- Widgets ---

// 1. Map/Room View (Top Left: 8x8)
const mapBox = blessed.box({
  ...getGridPosWithMenu(0, 0, 8, 8),
  parent: screen,
  label: " Map / Room ",
  tags: true,
  style: {
    bg: "blue",
    fg: "white",
    border: { fg: "white", bg: "blue" },
  },
  border: { type: "line" }, // standard line border
  content: "{center}Map Unavailable{/center}",
  shadow: true,
});

// 2. Stats View (Top Right: 8x4)
const statsBox = blessed.box({
  ...getGridPosWithMenu(0, 8, 8, 4),
  parent: screen,
  label: " Stats ",
  tags: true,
  style: {
    bg: "blue",
    fg: "white",
    border: { fg: "white", bg: "blue" },
  },
  border: { type: "line" },
  content: "Loading stats...",
  shadow: true,
});

// 3. Log (Bottom: 3x12) - Adjusted to 8,0, 3,12
const logBox = blessed.log({
  ...getGridPosWithMenu(8, 0, 3, 12),
  parent: screen,
  label: " Log ",
  tags: true,
  style: {
    bg: "blue",
    fg: "white",
    border: { fg: "white", bg: "blue" },
  },
  border: { type: "line" },
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    style: {
      bg: "cyan",
    },
  },
  shadow: true,
});

// 4. Input (Bottom Bottom: 1x12) - Adjusted to 11,0, 1,12
const inputBar = blessed.textbox({
  ...getGridPosWithMenu(11, 0, 1, 12),
  parent: screen,
  label: " Command ",
  style: {
    bg: "blue",
    fg: "white",
    border: { fg: "white", bg: "blue" },
    focus: {
      bg: "cyan",
      fg: "black",
    }
  },
  border: { type: "line" },
  inputOnFocus: true,
  keys: true,
  shadow: true,
});

// 5. Inventory Modal (Hidden by default)
const inventoryList = blessed.list({
  parent: screen,
  label: " Inventory ",
  top: "center",
  left: "center",
  width: "50%",
  height: "50%",
  items: ["No items"],
  keys: true,
  vi: true,
  mouse: true,
  border: "double",
  style: {
    bg: "blue",
    fg: "white",
    border: { fg: "white" },
    selected: {
      bg: "cyan",
      fg: "black",
    },
  },
  hidden: true,
  shadow: true,
});

// --- Menu Bar (Amiga Style) ---
const _menu = blessed.listbar({
  parent: screen,
  top: 0,
  left: 0,
  right: 0,
  height: 1,
  mouse: true,
  keys: true,
  autoCommandKeys: true, // F1..F12
  style: {
    bg: "white",
    fg: "black",
    item: {
      bg: "white",
      fg: "black",
      hover: {
        bg: "cyan",
        fg: "black",
      },
    },
    selected: {
      bg: "cyan",
      fg: "black",
    },
  },
  commands: {
    "File": {
      keys: ["F1"],
      callback: () => {
         // Placeholder
      }
    },
    "Action": {
      keys: ["F2"],
      callback: () => {
         // Placeholder
      }
    },
    "Help": {
      keys: ["F3"],
      callback: () => {
         logBox.log("{center}Use Arrow Keys to Move. 'i' for Inventory.{/center}");
      }
    },
    "Exit": {
        keys: ["F10", "escape"],
        callback: () => Deno.exit(0)
    }
  }
});

// Fix layout overlapping: grid logic usually manages its children.
// The menu is absolute top 0. The grid starts at 0,0.
// We might want to push the grid down or just let the menu float on top (might obscure map top border).
// blessed-contrib doesn't support 'top' offset efficiently. 
// We'll leave it as is; the menu is 1 height, it might cover the top border of Map/Stats. 
// That's actually kinda "Amiga Workbench" style (menu bar at very top).

// --- Game Logic ---

let _currentGameState: GameState | null = null;

async function fetchGameState() {
  try {
    const res = await fetch(`${API_URL}/state`);
    if (res.ok) {
        const data = await res.json();
        renderState(data);
    } else {
        logBox.log(`{red-fg}Error fetching state: ${res.status}{/}`);
    }
  } catch (e) {
    if (e instanceof Error) {
        logBox.log(`{red-fg}Connection failed: ${e.message}{/}`);
    }
  }
}

function renderState(gameState: GameState) {
    _currentGameState = gameState;
    
    // Update Stats
    const adv = gameState.adventurer as Adventurer; // casting based on shared model
    if (adv) {
        const hpBar = simpleBar(adv.hp, adv.maxHp, 10);
        
        const statsContent = 
`{bold}Name:{/bold} ${adv.name}
{bold}HP:{/bold}  ${adv.hp}/${adv.maxHp} [${hpBar}]
{bold}Fate:{/bold} ${adv.fate}  {bold}Life:{/bold} ${adv.life}

{bold}ATTR:{/bold}
STR: ${adv.str}
DEX: ${adv.dex}
INT: ${adv.int}

{bold}Equipped:{/bold}
Main: ${adv.mainHand?.name || "-"}
Off:  ${adv.offHand?.name || "-"}
Body: ${adv.torso?.name || "-"}
Head: ${adv.head?.name || "-"}
`;
        statsBox.setContent(statsContent);

        // Update Inventory List
        const items = adv.backpack.map(i => i.name).length > 0 ? adv.backpack.map(i => i.name) : ["(Empty)"];
        inventoryList.setItems(items);
    }

    // Update Map/Room
    // Narrative usually comes from move action, but we can display persistent room info if available
    // For now, static placeholder or data from state
    if (gameState.currentArea) {
      // If we had a map render, we'd put it here
      // mapBox.setContent(...)
    }

    screen.render();
}

function simpleBar(current: number, max: number, width: number): string {
    const percent = Math.min(Math.max(current / max, 0), 1);
    const fill = Math.floor(percent * width);
    const empty = width - fill;
    return "{green-bg}" + " ".repeat(fill) + "{/green-bg}" + "{white-bg}" + " ".repeat(empty) + "{/white-bg}";
}

async function moveAction() {
    try {
        logBox.log("{cyan-fg}> Moving...{/}");
        screen.render();
        
        const res = await fetch(`${API_URL}/api/v1/dungeon/move`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            
            // Log narrative
            if (data.narrative) {
                logBox.log(data.narrative);
            }
            if (data.upkeepReport && data.upkeepReport.messages.length > 0) {
                 // Already included in narrative by backend? 
                 // Backend code: narrative = report.messages.join(" ") + ...
                 // So we don't need to duplicate it, but good to know
            }

            // Update local state (fetch fresh state to get full adventurer updates)
            await fetchGameState();
            
            // Update Map display with room info
            if (data.room) {
                 mapBox.setContent(`{center}{bold}Room ${data.room.id || "?"}{/bold}\n\n${data.room.name || "Unknown Room"}\n\n${data.room.description || ""}{/center}`);
            }

        } else {
            logBox.log(`{red-fg}Move failed: ${res.status}{/}`);
        }
    } catch (e) {
        logBox.log(`{red-fg}Error: ${e}{/}`);
    }
}

// --- Event Handling ---

// Keyboard mapping
screen.key(['up', 'down', 'left', 'right'], () => {
    moveAction();
});

screen.key(['i'], () => {
    if (inventoryList.hidden) {
        inventoryList.show();
        inventoryList.focus();
    } else {
        inventoryList.hide();
        inputBar.focus();
    }
    screen.render();
});

inventoryList.key(['escape', 'i'], () => {
    inventoryList.hide();
    inputBar.focus();
    screen.render();
});

screen.key(['q', 'C-c'], () => {
  return Deno.exit(0);
});

// Input bar handling
inputBar.on('submit', (text: string) => {
    if (text) {
        logBox.log(`> ${text}`);
        // Handle custom commands if needed
        if (text === 'quit') Deno.exit(0);
        if (text === 'inventory') {
             inventoryList.show();
             inventoryList.focus();
        }
        
        inputBar.clearValue();
        inputBar.focus(); 
        screen.render();
    }
});

// --- Start ---
inputBar.focus();
screen.render();

// Initial Fetch
fetchGameState();
