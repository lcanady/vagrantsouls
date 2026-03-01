/**
 * ArtisanService
 *
 * Handles:
 * - unlock          (pay 2200gp, gain artisan sheet)
 * - salvage         (SALVAGE test against Art)
 * - craft           (CRAFT test against Art)
 * - convertMaterials (10 lesser ↔ 1 full)
 * - payGuildStorage (50gp; lose materials if not paid)
 * - trainAtGuild    (200gp→skill pip, 2000gp→Art pip; costs 1 contact)
 */

import { Adventurer, Artisan, Schematic } from "../models/adventurer.ts";
import {
  findSalvageEntry,
  findCraftEntry,
  MATERIAL_HIERARCHY,
  MATERIAL_HIERARCHY_REVERSE,
} from "../data/artisan_tables.ts";

export interface SalvageInput {
  itemName: string;
  roll: number;        // d100
  prefix?: "standard" | "finer" | "greater" | "superior" | "legend";
}

export interface CraftInput {
  itemName: string;
  roll: number;       // d100
}

export interface ConvertInput {
  from: string;   // material name
  to: string;
  quantity: number;
}

export interface TrainInput {
  type: "Salvage" | "Crafting" | "Art";
  contactsUsed: number;
}

export interface ArtisanResult {
  success: boolean;
  message: string;
  doubled?: boolean;
  experienceGained?: boolean;
  craftedItem?: string;
  schematicLearned?: boolean;
}

type ArtisanReturn = { adventurer: Adventurer; result: ArtisanResult };

const UNLOCK_COST = 2200; // 2000gp training + 200gp equipment
const GUILD_STORAGE_FEE = 50;
const TRAIN_SKILL_COST = 200;
const TRAIN_ART_COST = 2000;

function addMaterials(
  base: Record<string, number>,
  additions: Record<string, number | undefined>,
  multiplier = 1,
): Record<string, number> {
  const result = { ...base };
  for (const [mat, qty] of Object.entries(additions)) {
    if (qty && qty > 0) {
      result[mat] = (result[mat] ?? 0) + qty * multiplier;
    }
  }
  // Remove zeros
  return Object.fromEntries(Object.entries(result).filter(([, v]) => v > 0));
}

function subtractMaterials(
  base: Record<string, number>,
  costs: Record<string, number | undefined>,
): Record<string, number> {
  const result = { ...base };
  for (const [mat, qty] of Object.entries(costs)) {
    if (qty && qty > 0) {
      result[mat] = Math.max(0, (result[mat] ?? 0) - qty);
    }
  }
  return Object.fromEntries(Object.entries(result).filter(([, v]) => v > 0));
}

function hasMaterials(
  held: Record<string, number>,
  required: Record<string, number | undefined>,
): boolean {
  return Object.entries(required).every(
    ([mat, qty]) => qty === undefined || qty <= 0 || (held[mat] ?? 0) >= qty,
  );
}

export class ArtisanService {
  /** Pay 2200gp to unlock the artisan sheet */
  unlock(adventurer: Adventurer): ArtisanReturn {
    if (adventurer.artisan) {
      return { adventurer, result: { success: false, message: "Adventurer is already an artisan." } };
    }
    if (adventurer.gold < UNLOCK_COST) {
      return {
        adventurer,
        result: {
          success: false,
          message: `Need ${UNLOCK_COST}gp to become an artisan (have ${adventurer.gold}gp).`,
        },
      };
    }
    const artisan: Artisan = {
      art: 40,
      salvageSkill: 0,
      craftingSkill: 0,
      artExperiencePips: 0,
      salvageExperiencePips: 0,
      craftingExperiencePips: 0,
      materials: {},
      schematics: [],
      scrapsPips: 0,
      guildStoragePaid: false,
    };
    return {
      adventurer: { ...adventurer, gold: adventurer.gold - UNLOCK_COST, artisan },
      result: { success: true, message: "Artisan sheet unlocked! Art: 40, Salvage/Crafting skill: +0." },
    };
  }

  /**
   * SALVAGE test: Art + salvageSkill against 1d100 roll.
   * Roll ≤ target: success — gain materials from X-table.
   * Roll > target: failure — item is destroyed.
   * Roll ≤ 10: also gain experience.
   * Roll ≤ 5: experience AND double materials.
   */
  salvage(adventurer: Adventurer, input: SalvageInput): ArtisanReturn {
    const artisan = adventurer.artisan;
    if (!artisan) {
      return { adventurer, result: { success: false, message: "Artisan sheet not unlocked." } };
    }

    const entry = findSalvageEntry(input.itemName);
    if (!entry) {
      return {
        adventurer,
        result: {
          success: false,
          message: `'${input.itemName}' cannot be salvaged — not found on salvage tables (X1-X5).`,
        },
      };
    }

    const target = artisan.art + artisan.salvageSkill;
    const success = input.roll <= target;
    const doubled = success && input.roll <= 5;
    const experienceGained = input.roll <= 10;

    let updatedArtisan = { ...artisan };

    if (experienceGained) {
      // Player chooses: shade Art exp track OR 2 pips Salvage exp track
      // Default to Salvage experience (2 pips)
      updatedArtisan = {
        ...updatedArtisan,
        salvageExperiencePips: updatedArtisan.salvageExperiencePips + 2,
      };
    }

    if (!success) {
      return {
        adventurer: { ...adventurer, artisan: updatedArtisan },
        result: {
          success: false,
          message: `Salvage failed (rolled ${input.roll}, needed ≤ ${target}). Item destroyed.`,
          experienceGained,
        },
      };
    }

    // Apply standard materials
    const multiplier = doubled ? 2 : 1;
    let materials = addMaterials(artisan.materials, entry.standard as Record<string, number>, multiplier);

    // Apply upgraded materials based on prefix
    const prefix = input.prefix ?? "standard";
    if (prefix !== "standard") {
      const upgradedKey = prefix as keyof typeof entry;
      const upgraded = entry[upgradedKey] as Record<string, number> | undefined;
      if (upgraded) {
        materials = addMaterials(materials, upgraded, multiplier);
      }
    }

    updatedArtisan = { ...updatedArtisan, materials };

    return {
      adventurer: { ...adventurer, artisan: updatedArtisan },
      result: {
        success: true,
        message: `Salvage successful${doubled ? " (doubled!)" : ""}.`,
        doubled,
        experienceGained,
      },
    };
  }

  /**
   * CRAFT test: Art against roll.
   * Roll ≤ Art: success — item crafted.
   * Roll > Art: failure — materials consumed, nothing crafted.
   * Roll ≤ 10: also gain experience.
   * Roll ≤ 5: experience AND learn a new schematic.
   */
  craft(adventurer: Adventurer, input: CraftInput): ArtisanReturn {
    const artisan = adventurer.artisan;
    if (!artisan) {
      return { adventurer, result: { success: false, message: "Artisan sheet not unlocked." } };
    }

    const entry = findCraftEntry(input.itemName);
    if (!entry) {
      return {
        adventurer,
        result: {
          success: false,
          message: `'${input.itemName}' cannot be crafted — check crafting tables X6-X8.`,
        },
      };
    }

    // Check materials
    if (!hasMaterials(artisan.materials, entry.standard as Record<string, number>)) {
      return {
        adventurer,
        result: { success: false, message: `Insufficient materials to craft ${input.itemName}.` },
      };
    }

    // Consume materials regardless of success or failure
    let materials = subtractMaterials(artisan.materials, entry.standard as Record<string, number>);
    let updatedArtisan: Artisan = { ...artisan, materials };

    const success = input.roll <= artisan.art;
    const experienceGained = input.roll <= 10;
    const schematicLearned = input.roll <= 5;

    if (experienceGained) {
      updatedArtisan = {
        ...updatedArtisan,
        craftingExperiencePips: updatedArtisan.craftingExperiencePips + 2,
      };
    }

    if (schematicLearned) {
      // Generate a simple schematic for the crafted item
      const newSchematic: Schematic = {
        name: `${input.itemName} Schematic`,
        modifier: -10,
        standardMaterials: entry.standard as Record<string, number>,
        upgradedMaterials: {},
        gpValue: 200,
      };
      updatedArtisan = {
        ...updatedArtisan,
        schematics: [...updatedArtisan.schematics, newSchematic],
      };
    }

    if (!success) {
      return {
        adventurer: { ...adventurer, artisan: updatedArtisan },
        result: {
          success: false,
          message: `Craft failed (rolled ${input.roll}, needed ≤ ${artisan.art}). Materials wasted.`,
          experienceGained,
        },
      };
    }

    return {
      adventurer: { ...adventurer, artisan: updatedArtisan },
      result: {
        success: true,
        message: `Crafted ${input.itemName} successfully!`,
        craftedItem: input.itemName,
        experienceGained,
        schematicLearned,
      },
    };
  }

  /**
   * Convert 10 lesser materials → 1 full, or 1 full → 10 lesser.
   */
  convertMaterials(adventurer: Adventurer, input: ConvertInput): ArtisanReturn {
    const artisan = adventurer.artisan;
    if (!artisan) {
      return { adventurer, result: { success: false, message: "Artisan sheet not unlocked." } };
    }

    const { from, to, quantity } = input;
    // Determine conversion direction
    const isUpgrade = MATERIAL_HIERARCHY[from] === to;
    const isDowngrade = MATERIAL_HIERARCHY_REVERSE[from] === to;

    if (!isUpgrade && !isDowngrade) {
      return {
        adventurer,
        result: { success: false, message: `Cannot convert '${from}' to '${to}'. Invalid material pair.` },
      };
    }

    if (isUpgrade) {
      const lessersNeeded = quantity * 10;
      if ((artisan.materials[from] ?? 0) < lessersNeeded) {
        return {
          adventurer,
          result: {
            success: false,
            message: `Not enough '${from}' (need ${lessersNeeded}, have ${artisan.materials[from] ?? 0}).`,
          },
        };
      }
      const materials = {
        ...artisan.materials,
        [from]: (artisan.materials[from] ?? 0) - lessersNeeded,
        [to]: (artisan.materials[to] ?? 0) + quantity,
      };
      return {
        adventurer: { ...adventurer, artisan: { ...artisan, materials } },
        result: { success: true, message: `Converted ${lessersNeeded} ${from} → ${quantity} ${to}.` },
      };
    }

    // Downgrade
    if ((artisan.materials[from] ?? 0) < quantity) {
      return {
        adventurer,
        result: {
          success: false,
          message: `Not enough '${from}' (need ${quantity}, have ${artisan.materials[from] ?? 0}).`,
        },
      };
    }
    const materials = {
      ...artisan.materials,
      [from]: (artisan.materials[from] ?? 0) - quantity,
      [to]: (artisan.materials[to] ?? 0) + quantity * 10,
    };
    return {
      adventurer: { ...adventurer, artisan: { ...artisan, materials } },
      result: { success: true, message: `Converted ${quantity} ${from} → ${quantity * 10} ${to}.` },
    };
  }

  /** Pay 50gp guild storage fee.  Failure clears all materials and schematics. */
  payGuildStorage(adventurer: Adventurer): ArtisanReturn {
    const artisan = adventurer.artisan;
    if (!artisan) {
      return { adventurer, result: { success: false, message: "Artisan sheet not unlocked." } };
    }
    if (adventurer.gold < GUILD_STORAGE_FEE) {
      // Cannot pay — clear everything
      const clearedArtisan: Artisan = {
        ...artisan,
        materials: {},
        schematics: [],
        guildStoragePaid: false,
      };
      return {
        adventurer: { ...adventurer, artisan: clearedArtisan },
        result: {
          success: false,
          message: `Cannot pay guild storage (${GUILD_STORAGE_FEE}gp). All materials and schematics lost.`,
        },
      };
    }
    return {
      adventurer: {
        ...adventurer,
        gold: adventurer.gold - GUILD_STORAGE_FEE,
        artisan: { ...artisan, guildStoragePaid: true },
      },
      result: { success: true, message: `Paid ${GUILD_STORAGE_FEE}gp guild storage fee.` },
    };
  }

  /**
   * Train at the Artisan Guild.
   * Salvage/Crafting pip: 200gp + 1 contact.
   * Art pip: 2000gp + 1 contact.
   * Contacts available = adventurer.reputation.
   */
  trainAtGuild(adventurer: Adventurer, input: TrainInput): ArtisanReturn {
    const artisan = adventurer.artisan;
    if (!artisan) {
      return { adventurer, result: { success: false, message: "Artisan sheet not unlocked." } };
    }

    const contactsAvailable = adventurer.reputation;
    if (input.contactsUsed >= contactsAvailable) {
      return {
        adventurer,
        result: {
          success: false,
          message: `No contacts available (used ${input.contactsUsed}/${contactsAvailable}).`,
        },
      };
    }

    const cost = input.type === "Art" ? TRAIN_ART_COST : TRAIN_SKILL_COST;
    if (adventurer.gold < cost) {
      return {
        adventurer,
        result: {
          success: false,
          message: `Not enough gold (need ${cost}gp, have ${adventurer.gold}gp).`,
        },
      };
    }

    let updatedArtisan = { ...artisan };
    if (input.type === "Art") {
      updatedArtisan = { ...updatedArtisan, artExperiencePips: updatedArtisan.artExperiencePips + 1 };
    } else if (input.type === "Salvage") {
      updatedArtisan = { ...updatedArtisan, salvageExperiencePips: updatedArtisan.salvageExperiencePips + 1 };
    } else {
      updatedArtisan = { ...updatedArtisan, craftingExperiencePips: updatedArtisan.craftingExperiencePips + 1 };
    }

    return {
      adventurer: {
        ...adventurer,
        gold: adventurer.gold - cost,
        artisan: updatedArtisan,
      },
      result: { success: true, message: `Trained ${input.type} skill at the guild for ${cost}gp.` },
    };
  }
}
