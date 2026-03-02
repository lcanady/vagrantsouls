/**
 * WorldMapRenderService — generates SVG images for the Vagrant Souls World Builder.
 *
 * Two renderers:
 *  - renderWorldMap(state)  → 800×600 SVG of the full Valoria world map
 *  - renderHexSheet(sheet, currentHexId, options) → SVG of a hex grid (one continent)
 *
 * Pure SVG string generation — zero external dependencies.
 */

import type { HexSheet, WorldBuilderState } from "../models/adventurer.ts";
import { WORLD_CONTINENTS, WORLD_NAME, getContinentById } from "../data/world_builder/world_data.ts";
import { TERRAIN_TABLE } from "../data/world_builder/terrain_table.ts";

// ─── Hex math (pointy-top hexagons) ──────────────────────────────────────────

const SQRT3 = Math.sqrt(3);

function parseHexId(id: string): { q: number; r: number } {
  const m = id.match(/^q:(-?\d+),r:(-?\d+)$/);
  if (!m) throw new Error(`Invalid hex ID: ${id}`);
  return { q: parseInt(m[1], 10), r: parseInt(m[2], 10) };
}

/** Pixel centre of hex (q, r) for pointy-top layout */
function hexCenter(q: number, r: number, size: number, offsetX: number, offsetY: number): [number, number] {
  const x = size * SQRT3 * (q + r / 2) + offsetX;
  const y = size * 1.5 * r + offsetY;
  return [x, y];
}

/** SVG polygon points string for a single pointy-top hex */
function hexPoints(cx: number, cy: number, size: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top: first vertex at top
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

/**
 * Returns the pixel midpoint of a hex edge for road/river rendering.
 * Pointy-top edge numbering (matches DIRECTION_VECTORS):
 *   1=N   → between vertices 5 and 0   (top centre)
 *   2=NE  → between vertices 0 and 1
 *   3=SE  → between vertices 1 and 2
 *   4=S   → between vertices 2 and 3
 *   5=SW  → between vertices 3 and 4
 *   6=NW  → between vertices 4 and 5
 */
function edgeMidpoint(cx: number, cy: number, size: number, edge: number): [number, number] {
  // vertex indices that bound each edge (0-indexed, pointy-top CCW from top-right)
  const edgeVertices: [number, number][] = [
    [5, 0], // edge 1 = N
    [0, 1], // edge 2 = NE
    [1, 2], // edge 3 = SE
    [2, 3], // edge 4 = S
    [3, 4], // edge 5 = SW
    [4, 5], // edge 6 = NW
  ];
  const [v1, v2] = edgeVertices[edge - 1];
  const a1 = (Math.PI / 180) * (60 * v1 - 30);
  const a2 = (Math.PI / 180) * (60 * v2 - 30);
  const x = cx + size * (Math.cos(a1) + Math.cos(a2)) / 2;
  const y = cy + size * (Math.sin(a1) + Math.sin(a2)) / 2;
  return [x, y];
}

// ─── Terrain colour lookup ────────────────────────────────────────────────────

const TERRAIN_COLOUR: Record<string, string> = Object.fromEntries(
  TERRAIN_TABLE.map((t) => [t.terrain, t.colour])
);

// ─── Terrain symbol overlays (JRPG-style icons drawn inside each hex) ────────

/**
 * Draws iconic terrain symbols inside a hex.
 * All coordinates are relative to the hex centre (cx, cy).
 * Symbols are scaled to `size` so they always fit within the hex boundary.
 */
function _terrainOverlay(terrain: string, cx: number, cy: number, size: number): string {
  const s = size * 0.36; // working radius — keeps symbols well inside hex edges
  switch (terrain) {
    case "Forests":   return _forests(cx, cy, s, 3, "#1a4a18", "#3a7a28");
    case "Jungles":   return _forests(cx, cy, s, 5, "#0c3010", "#1a5a14");
    case "Mountains": return _mountains(cx, cy, s);
    case "Hills":     return _hills(cx, cy, s);
    case "Deserts":   return _deserts(cx, cy, s);
    case "Tundras":   return _tundra(cx, cy, s);
    case "Marshlands":return _marsh(cx, cy, s, "#6a0a8a", "#9a3ab8");
    case "Swamps":    return _marsh(cx, cy, s, "#4a2060", "#7a4a94");
    case "Seas":      return _seas(cx, cy, s);
    case "Grasslands":return _grasslands(cx, cy, s);
    default: return "";
  }
}

/** Pine-tree triangles. count=3 for Forest, 5 for Jungle. */
function _forests(cx: number, cy: number, s: number, count: number, dark: string, mid: string): string {
  // Offsets for 3 or 5 trees around centre
  const positions3 = [[0, -s * 0.5], [-s * 0.55, s * 0.35], [s * 0.55, s * 0.35]];
  const positions5 = [[0, -s * 0.6], [-s * 0.55, s * 0.0], [s * 0.55, s * 0.0], [-s * 0.3, s * 0.55], [s * 0.3, s * 0.55]];
  const positions = count === 5 ? positions5 : positions3;
  const th = s * 0.52; // tree height
  const tw = s * 0.38; // tree half-width
  return positions.map(([dx, dy]) => {
    const tx = cx + dx; const ty = cy + dy;
    return `<polygon points="${tx.toFixed(1)},${(ty - th / 2).toFixed(1)} ${(tx - tw).toFixed(1)},${(ty + th / 2).toFixed(1)} ${(tx + tw).toFixed(1)},${(ty + th / 2).toFixed(1)}"
      fill="${mid}" stroke="${dark}" stroke-width="0.6"/>`;
  }).join("");
}

/** Mountain peaks — large & small peak side by side. */
function _mountains(cx: number, cy: number, s: number): string {
  // Large peak (left-centre)
  const ph = s * 0.9; const pw = s * 0.75;
  const peak1 = `<polygon points="${(cx - s * 0.15).toFixed(1)},${(cy - ph * 0.5).toFixed(1)} ${(cx - pw).toFixed(1)},${(cy + ph * 0.5).toFixed(1)} ${(cx + pw * 0.45).toFixed(1)},${(cy + ph * 0.5).toFixed(1)}"
    fill="#d8d8d8" stroke="#666" stroke-width="0.8"/>`;
  // Snow cap on large peak
  const snow1 = `<polygon points="${(cx - s * 0.15).toFixed(1)},${(cy - ph * 0.5).toFixed(1)} ${(cx - s * 0.42).toFixed(1)},${(cy - ph * 0.1).toFixed(1)} ${(cx + s * 0.12).toFixed(1)},${(cy - ph * 0.1).toFixed(1)}"
    fill="#ffffff" opacity="0.85" stroke="none"/>`;
  // Smaller peak (right)
  const peak2 = `<polygon points="${(cx + s * 0.5).toFixed(1)},${(cy - ph * 0.15).toFixed(1)} ${(cx + s * 0.1).toFixed(1)},${(cy + ph * 0.5).toFixed(1)} ${(cx + s * 0.9).toFixed(1)},${(cy + ph * 0.5).toFixed(1)}"
    fill="#c0c0c0" stroke="#666" stroke-width="0.8"/>`;
  return peak1 + snow1 + peak2;
}

/** Rounded hill bumps. */
function _hills(cx: number, cy: number, s: number): string {
  // Two overlapping smooth arcs
  const y0 = cy + s * 0.2;
  const h1 = `<path d="M ${(cx - s * 0.9).toFixed(1)},${y0.toFixed(1)} Q ${(cx - s * 0.3).toFixed(1)},${(cy - s * 0.55).toFixed(1)} ${(cx + s * 0.2).toFixed(1)},${y0.toFixed(1)}"
    fill="#9a6b3a" stroke="#6a4020" stroke-width="0.8"/>`;
  const h2 = `<path d="M ${(cx - s * 0.15).toFixed(1)},${y0.toFixed(1)} Q ${(cx + s * 0.45).toFixed(1)},${(cy - s * 0.4).toFixed(1)} ${(cx + s * 1.0).toFixed(1)},${y0.toFixed(1)}"
    fill="#8a5a2a" stroke="#6a4020" stroke-width="0.8"/>`;
  return h1 + h2;
}

/** Wavy sand dune curves. */
function _deserts(cx: number, cy: number, s: number): string {
  const y1 = cy - s * 0.15; const y2 = cy + s * 0.3;
  const dune1 = `<path d="M ${(cx - s).toFixed(1)},${y1.toFixed(1)} Q ${(cx - s * 0.4).toFixed(1)},${(cy - s * 0.55).toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} Q ${(cx + s * 0.4).toFixed(1)},${(cy + s * 0.25).toFixed(1)} ${(cx + s).toFixed(1)},${y1.toFixed(1)}"
    fill="none" stroke="#b89a00" stroke-width="1.8" stroke-linecap="round"/>`;
  const dune2 = `<path d="M ${(cx - s * 0.7).toFixed(1)},${y2.toFixed(1)} Q ${(cx - s * 0.1).toFixed(1)},${(cy - s * 0.1).toFixed(1)} ${(cx + s * 0.4).toFixed(1)},${y2.toFixed(1)} Q ${(cx + s * 0.75).toFixed(1)},${(cy + s * 0.55).toFixed(1)} ${(cx + s).toFixed(1)},${y2.toFixed(1)}"
    fill="none" stroke="#c8a800" stroke-width="1.4" stroke-linecap="round" opacity="0.7"/>`;
  return dune1 + dune2;
}

/** Snowflake / ice crystal. */
function _tundra(cx: number, cy: number, s: number): string {
  const arms = [0, 60, 120, 180, 240, 300].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    const ex = cx + s * 0.75 * Math.cos(rad);
    const ey = cy + s * 0.75 * Math.sin(rad);
    // Crossbar at 60% along each arm
    const bx = cx + s * 0.45 * Math.cos(rad);
    const by = cy + s * 0.45 * Math.sin(rad);
    const perpRad = rad + Math.PI / 2;
    const bw = s * 0.2;
    return `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#b8d4e8" stroke-width="1.2"/>
      <line x1="${(bx - bw * Math.cos(perpRad)).toFixed(1)}" y1="${(by - bw * Math.sin(perpRad)).toFixed(1)}" x2="${(bx + bw * Math.cos(perpRad)).toFixed(1)}" y2="${(by + bw * Math.sin(perpRad)).toFixed(1)}" stroke="#b8d4e8" stroke-width="1"/>`;
  });
  return arms.join("") + `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(s * 0.12).toFixed(1)}" fill="#d8eef8"/>`;
}

/** Reed stalks with seed-heads (Marshlands / Swamps). */
function _marsh(cx: number, cy: number, s: number, dark: string, mid: string): string {
  const reeds = [[-0.45, 0], [0, -0.1], [0.45, 0.05]].map(([dx, dy]) => {
    const rx = cx + dx * s; const bot = cy + s * 0.55; const top = cy + dy * s - s * 0.5;
    return `<line x1="${rx.toFixed(1)}" y1="${bot.toFixed(1)}" x2="${rx.toFixed(1)}" y2="${top.toFixed(1)}" stroke="${mid}" stroke-width="1.5"/>
      <ellipse cx="${rx.toFixed(1)}" cy="${(top - s * 0.12).toFixed(1)}" rx="${(s * 0.07).toFixed(1)}" ry="${(s * 0.14).toFixed(1)}" fill="${dark}"/>`;
  });
  // Water ripple at base
  const ripple = `<path d="M ${(cx - s * 0.7).toFixed(1)},${(cy + s * 0.6).toFixed(1)} Q ${cx.toFixed(1)},${(cy + s * 0.4).toFixed(1)} ${(cx + s * 0.7).toFixed(1)},${(cy + s * 0.6).toFixed(1)}" fill="none" stroke="#4a80a0" stroke-width="1" opacity="0.6"/>`;
  return reeds.join("") + ripple;
}

/** Ocean wave lines. */
function _seas(cx: number, cy: number, s: number): string {
  const waves = [-0.3, 0.1].map((dy) => {
    const y = cy + dy * s;
    return `<path d="M ${(cx - s * 0.8).toFixed(1)},${y.toFixed(1)} Q ${(cx - s * 0.4).toFixed(1)},${(y - s * 0.22).toFixed(1)} ${cx.toFixed(1)},${y.toFixed(1)} Q ${(cx + s * 0.4).toFixed(1)},${(y + s * 0.22).toFixed(1)} ${(cx + s * 0.8).toFixed(1)},${y.toFixed(1)}"
      fill="none" stroke="#a0d4ff" stroke-width="1.8" stroke-linecap="round"/>`;
  });
  return waves.join("");
}

/** Subtle grass blade strokes. */
function _grasslands(cx: number, cy: number, s: number): string {
  const blades = [[-0.4, 0], [0, 0.1], [0.4, -0.05]].map(([dx, dy]) => {
    const bx = cx + dx * s; const by = cy + dy * s;
    return `<line x1="${bx.toFixed(1)}" y1="${(by + s * 0.35).toFixed(1)}" x2="${(bx + s * 0.08).toFixed(1)}" y2="${(by - s * 0.3).toFixed(1)}" stroke="#3a8a3a" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="${(bx + s * 0.15).toFixed(1)}" y1="${(by + s * 0.25).toFixed(1)}" x2="${(bx + s * 0.22).toFixed(1)}" y2="${(by - s * 0.2).toFixed(1)}" stroke="#3a8a3a" stroke-width="1" stroke-linecap="round"/>`;
  });
  return blades.join("");
}

// ─── Settlement icons ────────────────────────────────────────────────────────

const SETTLEMENT_ICON: Record<string, string> = {
  camp: "▲",
  village: "◆",
  town: "■",
  city: "★",
};

// ─── World Map Renderer ───────────────────────────────────────────────────────

/**
 * Renders the Valoria world overview as an 800×600 SVG.
 * - Visited continents: full colour with landmarks
 * - Unvisited continents: dark grey (fog of war)
 * - Current continent: pulsing highlight ring
 */
export function renderWorldMap(state: WorldBuilderState): string {
  const visitedSheetIds = new Set(state.hexSheets.map((s) => s.continentId).filter(Boolean) as number[]);
  const currentSheet = state.hexSheets[state.currentSheetIndex];
  const currentContinentId = currentSheet?.continentId;

  const continentSvg = WORLD_CONTINENTS.map((c) => {
    const visited = visitedSheetIds.has(c.id);
    const isCurrent = c.id === currentContinentId;

    const fill = visited ? c.colour : "#3a3a4a";
    const stroke = visited ? c.strokeColour : "#555566";
    const strokeWidth = isCurrent ? 3 : 1.5;

    // Glow animation for current continent
    const animation = isCurrent
      ? `<animate attributeName="stroke-opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />`
      : "";

    const polygon = `<polygon
      points="${c.svgPoints}"
      fill="${fill}"
      stroke="${stroke}"
      stroke-width="${strokeWidth}"
      opacity="${visited ? 1 : 0.7}"
    >${animation}</polygon>`;

    // Continent name label (only for visited)
    const label = visited
      ? `<text x="${c.labelX}" y="${c.labelY}" text-anchor="middle"
          font-family="serif" font-size="13" font-weight="bold"
          fill="#f5e6c0" stroke="#1a1a2a" stroke-width="2" paint-order="stroke"
        >${c.name}</text>`
      : "";

    // Sacred site icon (visited only)
    const siteIcon = visited
      ? `<text x="${c.sacredSiteX}" y="${c.sacredSiteY}" text-anchor="middle"
          font-family="serif" font-size="12" fill="#ffe87c"
          stroke="#1a1a2a" stroke-width="1.5" paint-order="stroke"
        >✦</text>`
      : "";

    // Town icons (first town, visited only)
    const townIcons = visited
      ? c.towns
          .slice(0, 2)
          .map((_, i) => {
            // Approximate positions offset from the label
            const tx = c.labelX + (i === 0 ? -25 : 25);
            const ty = c.labelY + 22;
            return `<text x="${tx}" y="${ty}" text-anchor="middle"
                font-family="serif" font-size="11" fill="#f5e6c0"
                stroke="#1a1a2a" stroke-width="1.5" paint-order="stroke"
              >⊙</text>`;
          })
          .join("")
      : "";

    return [polygon, label, siteIcon, townIcons].join("\n");
  }).join("\n");

  // Compass rose (bottom-right, always visible)
  const compass = `
    <g transform="translate(740, 550)">
      <circle r="20" fill="#1a3a5c" stroke="#8ab4cc" stroke-width="1"/>
      <text x="0" y="-10" text-anchor="middle" font-family="serif" font-size="10" fill="#c0d8e8">N</text>
      <text x="0" y="14"  text-anchor="middle" font-family="serif" font-size="10" fill="#c0d8e8">S</text>
      <text x="-14" y="4" text-anchor="middle" font-family="serif" font-size="10" fill="#c0d8e8">W</text>
      <text x="14"  y="4" text-anchor="middle" font-family="serif" font-size="10" fill="#c0d8e8">E</text>
      <line x1="0" y1="-16" x2="0" y2="16" stroke="#8ab4cc" stroke-width="0.5"/>
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#8ab4cc" stroke-width="0.5"/>
    </g>`;

  // World title
  const title = `<text x="400" y="36" text-anchor="middle"
      font-family="serif" font-size="24" font-weight="bold" letter-spacing="4"
      fill="#f5e6c0" stroke="#2a1a00" stroke-width="2.5" paint-order="stroke"
    >${WORLD_NAME}</text>`;

  // Year subtitle
  const subtitle = `<text x="400" y="56" text-anchor="middle"
      font-family="serif" font-size="11" fill="#c0a060" letter-spacing="2"
    >YEAR ${state.calendar.year} — MONTH ${state.calendar.month}</text>`;

  // Border frame
  const frame = `<rect x="4" y="4" width="792" height="592"
      fill="none" stroke="#8ab4cc" stroke-width="2" rx="4"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <radialGradient id="ocean" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e4a6e"/>
      <stop offset="100%" stop-color="#0d2236"/>
    </radialGradient>
  </defs>
  <!-- Ocean background -->
  <rect width="800" height="600" fill="url(#ocean)"/>
  <!-- Ocean texture dots -->
  ${_oceanTexture()}
  ${frame}
  ${continentSvg}
  ${compass}
  ${title}
  ${subtitle}
</svg>`;
}

/** Light dot pattern to suggest ocean waves */
function _oceanTexture(): string {
  const dots: string[] = [];
  for (let x = 20; x < 800; x += 40) {
    for (let y = 20; y < 600; y += 40) {
      dots.push(`<circle cx="${x}" cy="${y}" r="1" fill="#2a5a7a" opacity="0.4"/>`);
    }
  }
  return dots.join("");
}

// ─── Hex Grid Renderer ────────────────────────────────────────────────────────

export interface HexRenderOptions {
  /** Hex size in pixels (default: 36) */
  hexSize?: number;
  /** Show fog-of-war hexes adjacent to explored area (default: true) */
  showFogAdjacent?: boolean;
}

/**
 * Renders a single hex sheet (continent) as a pointy-top hex grid SVG.
 * The SVG auto-sizes to fit all explored hexes + a ring of fog hexes around them.
 */
export function renderHexSheet(
  sheet: HexSheet,
  currentHexId: string,
  options: HexRenderOptions = {},
): string {
  const size = options.hexSize ?? 36;
  const showFog = options.showFogAdjacent ?? true;

  const exploredIds = Object.keys(sheet.hexes);
  if (exploredIds.length === 0) {
    return _emptySheetSvg(sheet.continentName ?? "Unknown Land");
  }

  // Collect all hexes to render: explored + adjacent fog ring
  const fogIds = new Set<string>();
  if (showFog) {
    for (const id of exploredIds) {
      for (const neighbour of _neighbours(id)) {
        if (!sheet.hexes[neighbour]) fogIds.add(neighbour);
      }
    }
  }

  // Compute bounding box to centre the SVG
  const allIds = [...exploredIds, ...Array.from(fogIds)];
  const coords = allIds.map(parseHexId);
  const minQ = Math.min(...coords.map((c) => c.q));
  const maxQ = Math.max(...coords.map((c) => c.q));
  const minR = Math.min(...coords.map((c) => c.r));
  const maxR = Math.max(...coords.map((c) => c.r));

  const padding = size * 2;
  // Pixel extents of the bounding box centre
  const minX = size * SQRT3 * (minQ + minR / 2);
  const minY = size * 1.5 * minR;
  const maxX = size * SQRT3 * (maxQ + maxR / 2);
  const maxY = size * 1.5 * maxR;

  const offsetX = -minX + padding;
  const offsetY = -minY + padding + 60; // +60 for header
  const svgWidth = Math.ceil(maxX - minX + padding * 2);
  const svgHeight = Math.ceil(maxY - minY + padding * 2 + 60 + 80); // +80 for legend

  // Build SVG layers
  const fogLayer = Array.from(fogIds).map((id) => {
    const { q, r } = parseHexId(id);
    const [cx, cy] = hexCenter(q, r, size, offsetX, offsetY);
    return `<polygon points="${hexPoints(cx, cy, size)}"
      fill="#1e1e2a" stroke="#2a2a3a" stroke-width="0.5" opacity="0.85"/>`;
  }).join("\n");

  const hexLayer = exploredIds.map((id) => {
    const hex = sheet.hexes[id];
    const { q, r } = parseHexId(id);
    const [cx, cy] = hexCenter(q, r, size, offsetX, offsetY);
    const fill = TERRAIN_COLOUR[hex.terrain] ?? "#888888";
    const isCurrentHex = id === currentHexId;
    const strokeColour = isCurrentHex ? "#ffffff" : "#1a1a1a";
    const strokeWidth = isCurrentHex ? 2 : 0.8;

    return `<polygon points="${hexPoints(cx, cy, size)}"
      fill="${fill}" stroke="${strokeColour}" stroke-width="${strokeWidth}"/>`;
  }).join("\n");

  // Terrain symbol overlays (drawn on top of hex fill, below roads/icons)
  const terrainLayer = exploredIds.map((id) => {
    const hex = sheet.hexes[id];
    // Skip overlay if hex has settlement icon (let the icon dominate) or is very small
    if (hex.settlement || size < 24) return "";
    const { q, r } = parseHexId(id);
    const [cx, cy] = hexCenter(q, r, size, offsetX, offsetY);
    return _terrainOverlay(hex.terrain, cx, cy, size);
  }).join("\n");

  // Roads and rivers
  const edgeLayer = exploredIds.flatMap((id) => {
    const hex = sheet.hexes[id];
    const { q, r } = parseHexId(id);
    const [cx, cy] = hexCenter(q, r, size, offsetX, offsetY);
    const lines: string[] = [];

    for (const edge of hex.roads) {
      const [mx, my] = edgeMidpoint(cx, cy, size, edge);
      // Dirt road: brown outer stroke + sandy inner highlight
      lines.push(
        `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}"
          stroke="#3a2005" stroke-width="3" stroke-linecap="round"/>`,
        `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}"
          stroke="#a07840" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="3,3"/>`
      );
    }
    for (const edge of hex.rivers) {
      const [mx, my] = edgeMidpoint(cx, cy, size, edge);
      // Curved river: compute a perpendicular control point for a gentle arc
      const angle = Math.atan2(my - cy, mx - cx);
      const perpX = Math.cos(angle + Math.PI / 2) * size * 0.18;
      const perpY = Math.sin(angle + Math.PI / 2) * size * 0.18;
      const cpX = (cx + mx) / 2 + perpX;
      const cpY = (cy + my) / 2 + perpY;
      // Dark outer bank
      lines.push(
        `<path d="M ${cx.toFixed(1)},${cy.toFixed(1)} Q ${cpX.toFixed(1)},${cpY.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}"
          fill="none" stroke="#1a4a7a" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`
      );
      // Bright water highlight
      lines.push(
        `<path d="M ${cx.toFixed(1)},${cy.toFixed(1)} Q ${cpX.toFixed(1)},${cpY.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}"
          fill="none" stroke="#64b8f0" stroke-width="2" stroke-linecap="round" opacity="0.9"/>`
      );
    }
    return lines;
  }).join("\n");

  // Icons and labels overlaid on hexes
  const iconLayer = exploredIds.map((id) => {
    const hex = sheet.hexes[id];
    const { q, r } = parseHexId(id);
    const [cx, cy] = hexCenter(q, r, size, offsetX, offsetY);
    const elements: string[] = [];

    // Settlement icon
    if (hex.settlement) {
      const icon = SETTLEMENT_ICON[hex.settlement.type] ?? "⊙";
      elements.push(
        `<text x="${cx.toFixed(1)}" y="${(cy + 5).toFixed(1)}" text-anchor="middle"
          font-family="serif" font-size="${size * 0.5}" fill="#f5e6c0"
          stroke="#1a1a1a" stroke-width="1.5" paint-order="stroke"
        >${icon}</text>`
      );
    }

    // Quest code (small, top-left of hex)
    if (hex.questCode) {
      elements.push(
        `<text x="${(cx - size * 0.35).toFixed(1)}" y="${(cy - size * 0.5).toFixed(1)}"
          font-family="monospace" font-size="${Math.max(8, size * 0.28)}"
          fill="#ffe87c" stroke="#1a1a1a" stroke-width="1" paint-order="stroke"
        >${hex.questCode}</text>`
      );
    }

    // Camp marker (in addition to settlement icon if both exist)
    if (hex.hasCamp && !hex.settlement) {
      elements.push(
        `<text x="${cx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="middle"
          font-family="serif" font-size="${size * 0.45}" fill="#e0c060"
          stroke="#1a1a1a" stroke-width="1.5" paint-order="stroke"
        >▲</text>`
      );
    }

    return elements.join("\n");
  }).join("\n");

  // Player position pulsing ring
  const playerLayer = (() => {
    if (!sheet.hexes[currentHexId]) return "";
    const { q, r } = parseHexId(currentHexId);
    const [cx, cy] = hexCenter(q, r, size, offsetX, offsetY);
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(size * 0.3).toFixed(1)}"
      fill="none" stroke="#ff6644" stroke-width="2.5">
      <animate attributeName="r" values="${(size * 0.25).toFixed(1)};${(size * 0.4).toFixed(1)};${(size * 0.25).toFixed(1)}"
        dur="2s" repeatCount="indefinite"/>
      <animate attributeName="stroke-opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
    </circle>`;
  })();

  // Continent header banner
  const continentName = sheet.continentName ?? `Land ${sheet.sheetId}`;
  const questProgress = `${sheet.questsCompleted}/25 Quests`;
  const header = `
    <rect x="0" y="0" width="${svgWidth}" height="55" fill="#1a1a2a" opacity="0.9"/>
    <text x="${svgWidth / 2}" y="30" text-anchor="middle"
      font-family="serif" font-size="20" font-weight="bold" letter-spacing="3"
      fill="#f5e6c0" stroke="#2a1a00" stroke-width="1.5" paint-order="stroke"
    >${continentName}</text>
    <text x="${svgWidth / 2}" y="48" text-anchor="middle"
      font-family="serif" font-size="11" fill="#c0a060" letter-spacing="1"
    >${questProgress}${sheet.isComplete ? " ✓ COMPLETE" : ""}</text>`;

  // Terrain legend
  const legend = _terrainLegend(svgWidth, svgHeight, size);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="1" dy="1" stdDeviation="2" flood-opacity="0.5"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="${svgWidth}" height="${svgHeight}" fill="#0d1a0d"/>
  <!-- Fog of war hexes -->
  ${fogLayer}
  <!-- Terrain hexes -->
  ${hexLayer}
  <!-- Terrain symbol overlays -->
  ${terrainLayer}
  <!-- Roads and rivers -->
  ${edgeLayer}
  <!-- Settlement icons and quest labels -->
  ${iconLayer}
  <!-- Player position -->
  ${playerLayer}
  <!-- Header -->
  ${header}
  <!-- Legend -->
  ${legend}
</svg>`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Direction vectors for the 6 neighbours of a hex */
const DIRECTION_VECTORS: Record<number, [number, number]> = {
  1: [0, -1],
  2: [1, -1],
  3: [1, 0],
  4: [0, 1],
  5: [-1, 1],
  6: [-1, 0],
};

function _neighbours(id: string): string[] {
  const { q, r } = parseHexId(id);
  return Object.values(DIRECTION_VECTORS).map(
    ([dq, dr]) => `q:${q + dq},r:${r + dr}`
  );
}

function _emptySheetSvg(continentName: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
    <rect width="400" height="200" fill="#0d1a0d"/>
    <text x="200" y="90" text-anchor="middle" font-family="serif" font-size="18" fill="#c0a060">${continentName}</text>
    <text x="200" y="120" text-anchor="middle" font-family="serif" font-size="13" fill="#555566">No hexes explored yet</text>
  </svg>`;
}

function _terrainLegend(svgWidth: number, svgHeight: number, hexSize: number): string {
  const itemSize = Math.min(12, hexSize * 0.35);
  const legendY = svgHeight - 70;
  const itemsPerRow = 5;
  const itemW = Math.floor(svgWidth / itemsPerRow);

  const items = TERRAIN_TABLE.map((t, i) => {
    const col = i % itemsPerRow;
    const row = Math.floor(i / itemsPerRow);
    const x = col * itemW + 10;
    const y = legendY + row * 20;
    return `<rect x="${x}" y="${y}" width="${itemSize}" height="${itemSize}" fill="${t.colour}" stroke="#333" stroke-width="0.5"/>
      <text x="${x + itemSize + 4}" y="${y + itemSize - 1}" font-family="sans-serif" font-size="9" fill="#c0c0c0">${t.terrain}</text>`;
  }).join("\n");

  return `<rect x="0" y="${legendY - 8}" width="${svgWidth}" height="${svgHeight - legendY + 8}"
      fill="#0d1a0d" opacity="0.85"/>
    ${items}`;
}
