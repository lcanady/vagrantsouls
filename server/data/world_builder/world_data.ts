// Valoria — the world of Vagrant Souls
// A JRPG-style overworld with 6 named continents.
// Each continent corresponds to a WB hex sheet (continentId === sheetId).

export type LandmarkType = "town" | "city" | "dungeon" | "shrine";

export interface WorldLandmark {
  name: string;
  type: LandmarkType;
  description: string;
}

export interface WorldContinent {
  /** Matches HexSheet.continentId and the exploration order (1–6) */
  id: number;
  name: string;
  theme: string;
  /** Dominant terrain types players encounter here */
  dominantTerrains: string[];
  /** SVG fill colour for the world map polygon */
  colour: string;
  /** SVG stroke colour (border) */
  strokeColour: string;
  /** Polygon points string for the 800×600 SVG world map */
  svgPoints: string;
  /** Where to render the continent name label */
  labelX: number;
  labelY: number;
  /** Named towns that appear as lore anchors */
  towns: WorldLandmark[];
  /** Dungeons pre-placed in this continent */
  dungeons: WorldLandmark[];
  /** The continent's sacred / signature site */
  sacredSite: WorldLandmark;
  /** Approximate pixel position of the sacred site on the world map */
  sacredSiteX: number;
  sacredSiteY: number;
}

// SVG canvas: 800 × 600px, ocean background #1a3a5c
// Continents are hand-crafted polygons that fill the canvas roughly like a JRPG world map.
//
// Layout (rough quadrant placement):
//   Caldoria    → centre-left   (starting land)
//   Pyrethum    → south-east    (desert empire)
//   Verdenmoor  → north-west    (forest realm)
//   Thalassus   → south-west    (sea / islands)
//   Frosthold   → north-east    (frozen wastes)
//   Althenara   → far east      (goddess realm)

export const WORLD_NAME = "Valoria";
export const WORLD_YEAR = 1072;

export const WORLD_CONTINENTS: WorldContinent[] = [
  {
    id: 1,
    name: "Caldoria",
    theme: "Starter land — verdant valleys and rolling hills",
    dominantTerrains: ["Grasslands", "Hills"],
    colour: "#4a7c3f",
    strokeColour: "#2d5626",
    svgPoints: "180,180 310,160 350,200 340,310 270,340 190,310 160,260",
    labelX: 240,
    labelY: 250,
    towns: [
      {
        name: "Millhaven",
        type: "city",
        description:
          "The bustling capital of Caldoria, seat of the Dungeon Compact. A natural starting point for all adventurers.",
      },
      {
        name: "Fernbrook",
        type: "town",
        description:
          "A market town renowned for its weekly bazaar and cheap adventuring supplies.",
      },
    ],
    dungeons: [
      {
        name: "Duskwood Keep",
        type: "dungeon",
        description:
          "A crumbling fortress overtaken by the forest. The undead garrison within has plagued the region for decades.",
      },
    ],
    sacredSite: {
      name: "The Wayshrine of Althena",
      type: "shrine",
      description:
        "An ancient shrine where the Goddess Althena's first blessing was bestowed upon mortal kind. New adventurers receive guidance here.",
    },
    sacredSiteX: 275,
    sacredSiteY: 195,
  },
  {
    id: 2,
    name: "Pyrethum",
    theme: "Volcanic desert empire ruled by fire sorcerers",
    dominantTerrains: ["Deserts", "Mountains"],
    colour: "#b84a1a",
    strokeColour: "#7a2e09",
    svgPoints: "460,290 590,260 640,320 620,420 540,450 460,400 440,350",
    labelX: 545,
    labelY: 360,
    towns: [
      {
        name: "Ashenveil",
        type: "city",
        description:
          "Built atop an extinct volcano, Ashenveil is the proud capital of Pyrethum. Its markets trade in rare ores and fire magic.",
      },
      {
        name: "Cinderpass",
        type: "town",
        description: "A garrison town at the mouth of the volcanic pass. A harsh welcome to all who journey inland.",
      },
    ],
    dungeons: [
      {
        name: "Cinder Vault",
        type: "dungeon",
        description:
          "Buried beneath cooling lava flows, this vault guards the sealed armour of an ancient fire giant warlord.",
      },
    ],
    sacredSite: {
      name: "The Forge of Skalkar",
      type: "shrine",
      description:
        "The legendary anvil where the Bands of Skalkar and Bralkar were forged. Those who find both rings and return here unlock the Band of Unity.",
    },
    sacredSiteX: 550,
    sacredSiteY: 295,
  },
  {
    id: 3,
    name: "Verdenmoor",
    theme: "Ancient forest realm where druids and elves dwell",
    dominantTerrains: ["Forests", "Jungles"],
    colour: "#2a6b28",
    strokeColour: "#154d14",
    svgPoints: "60,60 190,50 230,120 210,200 140,220 70,180 40,120",
    labelX: 130,
    labelY: 135,
    towns: [
      {
        name: "Sylvareach",
        type: "city",
        description:
          "An elven city grown from living wood. Tier after tier of bridges and platforms spiral around an ancient thousand-year-tree.",
      },
      {
        name: "Barkhollow",
        type: "town",
        description:
          "A druid enclave, wary of outsiders. Druids and Warlocks may train here at reduced cost.",
      },
    ],
    dungeons: [
      {
        name: "Thornholt Maze",
        type: "dungeon",
        description:
          "A living labyrinth of thorned vines animated by a corrupted wood spirit. Explorers rarely return without a guide.",
      },
    ],
    sacredSite: {
      name: "The Moonwood Glade",
      type: "shrine",
      description:
        "A clearing where the moons align perfectly every equinox. Witchery performed here costs no suspicion points.",
    },
    sacredSiteX: 150,
    sacredSiteY: 80,
  },
  {
    id: 4,
    name: "Thalassus",
    theme: "Archipelago of pirates, sea-traders, and drowned ruins",
    dominantTerrains: ["Seas", "Marshlands"],
    colour: "#2a5f8f",
    strokeColour: "#14395a",
    svgPoints: "60,320 170,300 200,360 190,450 130,480 60,460 40,400",
    labelX: 115,
    labelY: 395,
    towns: [
      {
        name: "Port Shiver",
        type: "city",
        description:
          "The largest free port on the Thalassian archipelago. Every faction has an agent here. Most of them are stabbing each other.",
      },
      {
        name: "Saltmere",
        type: "town",
        description:
          "A fishing town protected by a sea wall half-eaten by rust. The people here are tough and ask few questions.",
      },
    ],
    dungeons: [
      {
        name: "The Drowned Palace",
        type: "dungeon",
        description:
          "The sunken throne room of an ancient sea-king, accessible only at low tide. Treasure maps point here — and so do hungry sea monsters.",
      },
    ],
    sacredSite: {
      name: "Corsair's Throne",
      type: "shrine",
      description:
        "A rock formation shaped like a throne that the pirate-queen of legend claimed as her seat of power. Legends say its finder inherits her favour — and her enemies.",
    },
    sacredSiteX: 120,
    sacredSiteY: 320,
  },
  {
    id: 5,
    name: "Frosthold",
    theme: "Frozen northern wastes — home of frost giants and ice dragons",
    dominantTerrains: ["Tundras", "Mountains"],
    colour: "#8ab4cc",
    strokeColour: "#4a7da0",
    svgPoints: "450,40 600,30 680,80 660,160 570,190 460,160 430,100",
    labelX: 555,
    labelY: 110,
    towns: [
      {
        name: "Icemir",
        type: "city",
        description:
          "The only heated city in Frosthold, powered by thermal vents. It serves as a waypoint for expeditions further north.",
      },
      {
        name: "Coldchain",
        type: "town",
        description:
          "A prison-town that has outlasted its purpose. Now it sells ale, furs, and sled dogs.",
      },
    ],
    dungeons: [
      {
        name: "The Glacial Tomb",
        type: "dungeon",
        description:
          "The burial ground of frost giant kings, sealed beneath a glacier. Their grave goods are priceless — and well-guarded by the cold dead.",
      },
    ],
    sacredSite: {
      name: "Shrine of the Frost Drake",
      type: "shrine",
      description:
        "Where the last frost dragon landed and chose to sleep for ten thousand years. Its scales still frost the shrine walls with each breath.",
    },
    sacredSiteX: 600,
    sacredSiteY: 50,
  },
  {
    id: 6,
    name: "Althenara",
    theme: "The Goddess realm — shimmering lands of legend and endgame power",
    dominantTerrains: ["Grasslands", "Forests", "Mountains", "Hills"],
    colour: "#c4a44a",
    strokeColour: "#8a6e24",
    svgPoints: "680,180 780,160 800,240 780,340 700,360 660,280 650,220",
    labelX: 720,
    labelY: 260,
    towns: [
      {
        name: "Veilgate",
        type: "city",
        description:
          "The gateway city to Althenara. Its gates are said to only open for those who have completed quests on all other continents.",
      },
      {
        name: "Radiant Hold",
        type: "city",
        description:
          "The seat of the Goddess's mortal stewards. All Empire Building investments here yield double returns.",
      },
    ],
    dungeons: [
      {
        name: "The Ascension Tower",
        type: "dungeon",
        description:
          "A hundred-floor spire that tests every skill an adventurer has learned. Its summit holds the rarest treasure in Valoria.",
      },
    ],
    sacredSite: {
      name: "Althena's Sanctuary",
      type: "shrine",
      description:
        "The Goddess's true resting place. Those who reach the Sanctuary may ask one boon: a permanent +10 to any stat, resurrection of a fallen companion, or the legendary Dragon Mount.",
    },
    sacredSiteX: 730,
    sacredSiteY: 175,
  },
];

/** Look up a continent by its sheet/continent ID */
export function getContinentById(id: number): WorldContinent | undefined {
  return WORLD_CONTINENTS.find((c) => c.id === id);
}

/** The starting continent for new adventurers */
export const STARTING_CONTINENT = WORLD_CONTINENTS[0]; // Caldoria
