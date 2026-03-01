import { z as _z } from "zod";
import { GameStateSchema as _GameStateSchema, GameState } from "./models/gamestate.ts";
import { Party, PartySchema as _PartySchema } from "./models/party.ts";
import { Adventurer, AdventurerSchema as _AdventurerSchema } from "./models/adventurer.ts";

// In-memory storage for MVP
// In a real app, this would be a database.
export const parties: Record<string, Party> = {};
export const adventurers: Record<string, Adventurer> = {};
export const gameStates: Record<string, GameState> = {}; // Party ID -> GameState

// Helper to get or create a game state for a party
export const getGameState = (partyId: string): GameState | undefined => {
  return gameStates[partyId];
};

export const createInitialState = (): GameState => {
  return {
    adventurer: { 
      id: crypto.randomUUID(),
      name: "Hero",
      hp: 30,
      maxHp: 30,
      fate: 3,
      life: 3,
      str: 50,
      dex: 40,
      int: 30,
      experiencePips: 0,
      head: null,
      torso: null,
      back: null,
      mainHand: null,
      offHand: null,
      belt1: null,
      belt2: null,
      backpack: [],
      reputation: 0,
      gold: 0,
      oil: 0,
      food: 0,
      picks: 0,
      poison: 0,
      disease: 0,
      darkness: false,
      starvation: false,
      skills: {},
      spells: {},
      investments: {},
      monsterParts: [],
      witcheryFormulas: {},
      witcheryEffects: [],
      witcheryMishaps: [],
      campaignQuests: {},
      sideQuests: {},
      questsCompleted: 0,
      questsFailed: 0,
      combatExperience: {},
      guildId: undefined,
      guildStanding: 0,
    },
    timeTrack: 0,
    startedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString()
  };
};

export const createGameState = (partyId: string): GameState => {
  const newState = createInitialState();
  if (gameStates[partyId]) {
      // Clear existing keys and re-assign to maintain reference
      const oldState = gameStates[partyId];
      for (const key in oldState) {
          delete (oldState as Record<string, unknown>)[key];
      }
      Object.assign(oldState, newState);
      return oldState;
  }
  gameStates[partyId] = newState;
  return newState;
};

// -- Party Management --
export const createParty = (leaderId: string): Party => {
  const partyId = crypto.randomUUID();
  const newParty: Party = {
    id: partyId,
    name: "Adventuring Party",
    leaderId,
    members: [leaderId],
    status: "LOBBY",
    createdAt: new Date().toISOString(),
  };
  parties[partyId] = newParty;
  createGameState(partyId); // Initialize game state for this party
  return newParty;
};

export const getParty = (partyId: string): Party | undefined => {
  return parties[partyId];
};

export const updateParty = (partyId: string, updates: Partial<Party>): Party | undefined => {
  const party = parties[partyId];
  if (!party) return undefined;
  parties[partyId] = { ...party, ...updates };
  return parties[partyId];
};

// -- Adventurer Management --
export const createAdventurer = (name: string): Adventurer & { id: string } => {
  const id = crypto.randomUUID();
  const newAdventurer: Adventurer = {
    id,
    name,
    hp: 30,
    maxHp: 30,
    fate: 3,
    life: 3,
    str: 50,
    dex: 40,
    int: 30,
    experiencePips: 0,
    head: null,
    torso: null,
    back: null,
    mainHand: null,
    offHand: null,
    belt1: null,
    belt2: null,
    backpack: [],
    reputation: 0,
    gold: 0,
    oil: 0,
    food: 0,
    picks: 0,
    poison: 0,
    disease: 0,
    darkness: false,
    starvation: false,
    skills: {},
    spells: {},
    investments: {},
    monsterParts: [],
    witcheryFormulas: {},
    witcheryEffects: [],
    witcheryMishaps: [],
    campaignQuests: {},
    sideQuests: {},
    questsCompleted: 0,
    questsFailed: 0,
    combatExperience: {},
    guildId: undefined,
    guildStanding: 0,
  };
  adventurers[id] = newAdventurer;
  return newAdventurer as Adventurer & { id: string };
};

export const getAdventurer = (id: string): Adventurer | undefined => {
  return adventurers[id];
};

export const updateAdventurer = (id: string, updates: Partial<Adventurer>): Adventurer | undefined => {
  const adv = adventurers[id];
  if (!adv) return undefined;
  adventurers[id] = { ...adv, ...updates };
  return adventurers[id];
};


// Legacy support (to not break everything immediately, but we should migrate)
// We'll just point to the *first* party or a default one.
let defaultPartyId: string | null = null;

export const legacyGameState = (): GameState => {
  if (!defaultPartyId) {
     const leader = createAdventurer("Solo Hero");
     const party = createParty(leader.id);
     defaultPartyId = party.id;
  }
  return gameStates[defaultPartyId!];
};

export const resetGameState = () => {
    // This resets the *default* game only
  if (defaultPartyId) {
      createGameState(defaultPartyId);
  }
  return legacyGameState();
};

export const updateGameState = (updates: Partial<GameState>) => {
    const state = legacyGameState();
    if (defaultPartyId) {
         // Mutate the original object to avoid stale references
         Object.assign(state, updates);
         state.lastSavedAt = new Date().toISOString();
         return state;
    }
    return state;
};

// Export the "active" gameState getter for backward compatibility
export const gameState = legacyGameState();
