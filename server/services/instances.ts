import { PartyService } from "./PartyService.ts";
import { CombatLobby } from "./CombatLobby.ts";
import { EncounterService } from "./EncounterService.ts";
import { WebSocketService } from "./WebSocketService.ts";
import { Dice } from "./dice.ts";

export const partyService = new PartyService();
export const combatLobby = new CombatLobby();
export const encounterService = new EncounterService();
export const webSocketService = new WebSocketService();
export const dice = new Dice();
