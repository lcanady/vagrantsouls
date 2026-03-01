
// scripts/parse_tables.ts

interface TableEntry {
  range: string;
  content: string;
}

interface Table {
  id: string; // e.g., "A", "M"
  title: string;
  entries: TableEntry[];
}

async function parseTables() {
  const text = await Deno.readTextFile("d100_dungeon_rules.txt");
  const lines = text.split(/\r\n|\n|\r/);

  const tables: Record<string, Table> = {};
  let currentTableId = "General";
  let currentRange: string | null = null;
  let currentContent: string[] = [];

  // Regexes
  const tableHeaderRegex = /^\s*TABLE\s+([A-Z0-9]+)(?:\s+[-–]\s+(.*))?/i;
  // Range: 1-5, 10, 05-09. 
  // Should be isolated or at start of line?
  // Debug showed "72-74" on its own line. Match that strict first.
  const rangeRegex = /^\s*(\d+(?:\s*[-–]\s*\d+)?)\s*$/; 

  // Helper to save current entry
  const saveEntry = () => {
    if (currentRange && currentContent.length > 0) {
      if (!tables[currentTableId]) {
        tables[currentTableId] = { id: currentTableId, title: "", entries: [] };
      }
      tables[currentTableId].entries.push({
        range: currentRange,
        content: currentContent.join(" ").trim()
      });
    }
    currentContent = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const headerMatch = line.match(tableHeaderRegex);
    if (headerMatch) {
      // New Table
      saveEntry(); // Save pending entry of previous table
      currentRange = null;
      
      currentTableId = headerMatch[1].toUpperCase();
      const title = headerMatch[2] || "";
      
      if (!tables[currentTableId]) {
        tables[currentTableId] = { id: currentTableId, title, entries: [] };
      }
      continue;
    }

    const rangeMatch = line.match(rangeRegex);
    if (rangeMatch) {
      // Possible start of new entry.
      // But verify if it's not just a number in text.
      // E.g. "I rolled a 5."
      // But we check for "line is ONLY range".
      
      saveEntry();
      currentRange = rangeMatch[1];
      continue;
    }

    // Otherwise, content
    if (currentRange) {
      currentContent.push(line);
    } 
    // If no range active, maybe it's general text or Description for table?
    // We ignore strict text outside of range context for this "Table Parser".
  }
  
  saveEntry(); // Last one

  // Write to JSON
  await Deno.mkdir("data", { recursive: true });
  await Deno.writeTextFile("data/tables.json", JSON.stringify(Object.values(tables), null, 2));
  console.log(`Parsed ${Object.keys(tables).length} tables.`);
  Object.values(tables).forEach(t => {
      console.log(`Table ${t.id}: ${t.entries.length} entries`);
  });
}

if (import.meta.main) {
  parseTables();
}
