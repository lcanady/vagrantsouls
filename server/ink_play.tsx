import React, { useState, useEffect, useCallback } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import SelectInput from "ink-select-input";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";

// --- Types ---
interface GameState {
  adventurer: {
    name: string;
    hp: number;
    maxHp: number;
    fate: number;
    life: number;
    gold: number;
    food: number;
    oil: number;
  };
  timeTrack: number;
  currentRoom?: {
    id: number;
    name: string;
    description: string;
    exits: string[];
  };
}

interface MoveResponse {
  timeTrack: number;
  roll: number;
  room: unknown;
  narrative: string;
  upkeepReport: unknown;
}

const API_URL = "http://localhost:4200";

// --- Hooks ---

const useTypewriter = (text: string, speed: number = 20) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [index, text, speed]);

  return displayedText;
};

// --- Components ---

const Header = () => (
  <Box flexDirection="column" alignItems="center" marginBottom={1}>
    <Gradient name="atlas">
      <BigText text="D100 DUNGEON" font="tiny" />
    </Gradient>
    <Box borderStyle="single" borderColor="blue" paddingX={1} width="100%" justifyContent="center">
        <Text bold color="white">⚔️ DOS COMMANDER VERSION ⚔️</Text>
    </Box>
  </Box>
);

const StatsPanel = ({ state }: { state: GameState }) => {
  if (!state.adventurer) return null;
  const { adventurer, timeTrack } = state;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} width={30}>
      <Text bold color="yellow" underline>ADVENTURER</Text>
      <Box justifyContent="space-between">
        <Text color="white">Name:</Text>
        <Text color="brightWhite">{adventurer.name}</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text color="white">HP:</Text>
        <Text color="red">{adventurer.hp}/{adventurer.maxHp}</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text color="white">Fate:</Text>
        <Text color="cyan">{adventurer.fate}</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text color="white">Life:</Text>
        <Text color="green">{adventurer.life}</Text>
      </Box>
      
      <Box marginTop={1}>
        <Text bold color="yellow" underline>RESOURCES</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text color="white">Gold:</Text>
        <Text color="yellow">{adventurer.gold}</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text color="white">Food:</Text>
        <Text color="white">{adventurer.food}</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text color="white">Oil:</Text>
        <Text color="white">{adventurer.oil}</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text color="white">Time:</Text>
        <Text color="magenta">{timeTrack}/20</Text>
      </Box>
    </Box>
  );
};

const ScenePanel = ({ narrative }: { narrative: string }) => {
  const typedNarrative = useTypewriter(narrative, 10);
  
  return (
    <Box flexGrow={1} flexDirection="column" borderStyle="double" borderColor="white" padding={1} marginLeft={1}>
      <Text bold color="yellow">--- THE SCENE ---</Text>
      <Box marginTop={1} minHeight={10}>
        <Text color="brightWhite">{typedNarrative}</Text>
      </Box>
    </Box>
  );
};

const Footer = () => (
    <Box borderStyle="single" borderColor="blue" paddingX={1} marginTop={1} justifyContent="center">
        <Text color="gray">Use arrow keys to navigate • Enter to select • Esc to quit</Text>
    </Box>
);

const App = () => {
  const [state, setState] = useState<GameState | null>(null);
  const [narrative, setNarrative] = useState("Initializing sensors... Welcome to the dungeon.");
  const [loading, setLoading] = useState(true);
  const { exit } = useApp();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/state`);
      const data = await res.json();
      setState(data);
      
      if (!data.adventurer) {
        setNarrative("No adventurer found. Creating a new hero...");
        const createRes = await fetch(`${API_URL}/api/v1/adventurer`, {
            method: "POST",
            body: JSON.stringify({
                name: "Hero",
                stats: { maxHp: 30, fate: 40, life: 50 } 
            }),
            headers: { "Content-Type": "application/json" }
        });
        if (createRes.ok) {
            const newState = await (await fetch(`${API_URL}/state`)).json();
            setState(newState);
            setNarrative("A new journey begins. You stand at the gates of the deep.");
        }
      }
    } catch (_e) {
      setNarrative("Critical Error: Unable to connect to the dungeon server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelect = async (item: { value: string }) => {
    if (item.value === "quit") {
      exit();
      return;
    }

    if (item.value === "move") {
        setNarrative("Treading carefully into the darkness...");
        try {
            const res = await fetch(`${API_URL}/api/v1/dungeon/move`, { method: "POST" });
            const result: MoveResponse = await res.json();
            setNarrative(result.narrative);
            fetchData();
        } catch (_e) {
            setNarrative("An unknown force blocks your path.");
        }
    }
    
    if (item.value === "search") {
        setNarrative("Searching the area... You find nothing but dust and echoes.");
    }
    
    if (item.value === "inventory") {
        setNarrative("Checking your backpack... It's mostly filled with standard supplies.");
    }
  };

  useInput((_input, key) => {
    if (key.escape) {
      exit();
    }
  });

  if (loading || !state) {
    return (
      <Box padding={2}>
        <Text color="cyan">Connect... </Text>
        <Text italic color="gray">{narrative}</Text>
      </Box>
    );
  }

  const menuItems = [
    { label: "Move Forward (Spend Time)", value: "move" },
    { label: "Search Room", value: "search" },
    { label: "Check Inventory", value: "inventory" },
    { label: "Self-Terminate (Quit)", value: "quit" },
  ];

  return (
    <Box flexDirection="column" padding={1} width={80}>
      <Header />
      
      <Box flexDirection="row" height={15}>
        <StatsPanel state={state} />
        <ScenePanel narrative={narrative} />
      </Box>

      <Box borderStyle="single" borderColor="yellow" paddingX={1} marginTop={1} flexDirection="column">
        <Text bold color="yellow">ACTIONS:</Text>
        <Box marginLeft={2} marginTop={1}>
            <SelectInput items={menuItems} onSelect={handleSelect} />
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

render(<App />);
