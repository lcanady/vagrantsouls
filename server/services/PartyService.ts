import { Party } from "../models/party.ts";
import { createParty, getParty, updateParty, createAdventurer } from "../state.ts";

export class PartyService {
  createParty(leaderName: string): Party & { leaderId: string } {
    const leader = createAdventurer(leaderName);
    const party = createParty(leader.id);
    return { ...party, leaderId: leader.id };
  }

  getParty(partyId: string): Party | undefined {
    return getParty(partyId);
  }

  joinParty(partyId: string, adventurerName: string): { party: Party; adventurerId: string } {
    const party = getParty(partyId);
    if (!party) {
      throw new Error("Party not found");
    }

    const adventurer = createAdventurer(adventurerName);
    // Add new member ID to the list
    const updatedMembers = [...party.members, adventurer.id];
    
    // Update the party in state
    updateParty(partyId, { members: updatedMembers });
    
    // Return the updated party and the new adventurer's ID
    const updatedParty = getParty(partyId)!;
    return { party: updatedParty, adventurerId: adventurer.id };
  }
  
  leaveParty(partyId: string, adventurerId: string): Party {
      const party = getParty(partyId);
      if (!party) throw new Error("Party not found");
      
      const updatedMembers = party.members.filter(id => id !== adventurerId);
      updateParty(partyId, { members: updatedMembers });
      
      return getParty(partyId)!;
  }
}
