import { assertEquals } from "@std/assert";
import { Dice } from "../server/services/dice.ts";
import { Book1TableService } from "../server/services/table_service.ts";

Deno.test("Dice Roll - Range Check", () => {
    const dice = new Dice();
    for (let i = 0; i < 100; i++) {
        const result = dice.roll(6);
        assertEquals(result >= 1 && result <= 6, true);
    }
});

Deno.test("Dice Roll D100 - Range Check", () => {
    const dice = new Dice();
    for (let i = 0; i < 100; i++) {
        const result = dice.rollD100();
        assertEquals(result >= 1 && result <= 100, true);
    }
});

Deno.test("Table M - Special Room (Roll 100)", () => {
    const tableService = new Book1TableService();
    const room = tableService.getTableM(100);
    
    assertEquals(room.color, "red");
    assertEquals(room.exits, 4);
    assertEquals(room.features.includes("Special Room"), true);
});

Deno.test("Table M - Standard Room Ranges", () => {
    const tableService = new Book1TableService();
    
    // 01-25: Red, 2 exits
    const room1 = tableService.getTableM(10);
    assertEquals(room1.color, "red");
    assertEquals(room1.exits, 2);

    // 26-50: Green, 3 exits
    const room2 = tableService.getTableM(30);
    assertEquals(room2.color, "green");
    assertEquals(room2.exits, 3);

    // 51-75: Blue, 2 exits
    const room3 = tableService.getTableM(60);
    assertEquals(room3.color, "blue");
    assertEquals(room3.exits, 2);

    // 76-99: Yellow, 4 exits
    const room4 = tableService.getTableM(90);
    assertEquals(room4.color, "yellow");
    assertEquals(room4.exits, 4);
});

Deno.test("Table E - Encounter Lookup", () => {
    const tableService = new Book1TableService();
    
    // Test simplified lookup
    const rat = tableService.getTableE(5);
    assertEquals(rat.name, "Rat");
    assertEquals(rat.hp, 2);

    const demon = tableService.getTableE(95);
    assertEquals(demon.name, "Demon");
    assertEquals(demon.hp, 25);
});
