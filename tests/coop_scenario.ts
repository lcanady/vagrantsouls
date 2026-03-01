
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log("Starting Co-op Engine Verification...");

  const verify = (condition: boolean, msg: string) => {
    if (!condition) {
      console.error(`❌ FAILED: ${msg}`);
      Deno.exit(1);
    } else {
      console.log(`✅ PASSED: ${msg}`);
    }
  };

  const API_URL = "http://localhost:4200/api/v1";
  const WS_URL = "ws://localhost:4200/ws/party";

  // 1. Create Party
  console.log("\n--- Step 1: Create Party ---");
  const createRes = await fetch(`${API_URL}/party/create`, {
    method: "POST",
    body: JSON.stringify({ leaderName: "Leader" })
  });
  const party = await createRes.json();
  verify(!!party.id, "Party created with ID");
  const partyId = party.id;
  const leaderId = party.leaderId;
  console.log(`Party ID: ${partyId}, Leader ID: ${leaderId}`);

  // 2. Join Party (Player 2)
  console.log("\n--- Step 2: Join Party ---");
  const joinRes = await fetch(`${API_URL}/party/${partyId}/join`, {
    method: "POST",
    body: JSON.stringify({ adventurerName: "Player2" })
  });
  const joinData = await joinRes.json();
  verify(!!joinData.adventurerId, "Player 2 joined");
  const player2Id = joinData.adventurerId;

  // 3. Connect WebSockets
  console.log("\n--- Step 3: WebSocket Connection ---");
  const ws1 = new WebSocket(`${WS_URL}/${partyId}`);
  const ws2 = new WebSocket(`${WS_URL}/${partyId}`);

  const messages1: unknown[] = [];
  const messages2: unknown[] = [];

  ws1.onmessage = (e) => messages1.push(JSON.parse(e.data));
  ws2.onmessage = (e) => messages2.push(JSON.parse(e.data));

  await new Promise<void>((resolve) => {
    let connected = 0;
    const check = () => {
        connected++;
        if (connected === 2) resolve();
    }
    ws1.onopen = check;
    ws2.onopen = check;
  });
  verify(true, "WebSockets connected");

  // 4. Start Combat
  console.log("\n--- Step 4: Start Combat ---");
  const startRes = await fetch(`${API_URL}/combat/start`, {
      method: "POST",
      body: JSON.stringify({ partyId, roll: 50 }) // Roll 50 -> Zombie (AV 10, HP 6)
  });
  const startData = await startRes.json();
  verify(!!startData.monster, "Combat started");
  
  // Verify Scaling: 2 players -> HP should be Base * 1.5 * (2-1) = Base * 1.5.
  // Zombie HP is 6. Expect 9.
  verify(startData.monster.hp === 9, `Monster HP scaled correctly (Expected 9, got ${startData.monster.hp})`);

  // Wait for WS broadcast
  await delay(500);
  verify(messages1.some(m => m.type === "COMBAT_START"), "Leader received COMBAT_START via WS");
  verify(messages2.some(m => m.type === "COMBAT_START"), "Player 2 received COMBAT_START via WS");

  // 5. Submit Actions
  console.log("\n--- Step 5: Submit Actions ---");
  
  // Leader attacks
  const action1Res = await fetch(`${API_URL}/combat/attack`, {
      method: "POST",
      body: JSON.stringify({ partyId, adventurerId: leaderId, weaponSlot: "rHand" })
  });
  const action1Data = await action1Res.json();
  verify(action1Data.message.includes("waiting"), "Leader action pending");
  
  // Player 2 attacks
  const action2Res = await fetch(`${API_URL}/combat/attack`, {
      method: "POST",
      body: JSON.stringify({ partyId, adventurerId: player2Id, weaponSlot: "rHand" })
  });
  const action2Data = await action2Res.json();
  verify(action2Data.message === "Turn resolved", "Turn resolved after 2nd action");

  // Wait for WS resolution
  await delay(500);
  verify(messages1.some(m => m.type === "TURN_RESOLUTION"), "Leader received TURN_RESOLUTION via WS");
  verify(messages2.some(m => m.type === "TURN_RESOLUTION"), "Player 2 received TURN_RESOLUTION via WS");

  console.log("\n--- Verification Complete ---");
  ws1.close();
  ws2.close();
}

runTest();
