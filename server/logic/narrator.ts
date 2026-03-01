import { HumanMessage, SystemMessage, BaseMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { StateGraph, END } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { VectorService } from "../services/VectorService.ts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// --- State Definition ---
export interface NarratorState {
  room: unknown;
  messages: BaseMessage[];
  narrative?: string;
}

// --- Tool Definition ---
const vectorService = new VectorService();

const queryRulesTool = new DynamicStructuredTool({
  name: "query_rules",
  description: "Search the D100 Dungeon rulebook for specific rules, tables, or mechanics context.",
  schema: z.object({
    query: z.string().describe("The search term or question to look up in the rules."),
  }),
  func: async ({ query }: { query: string }) => {
    try {
      const results = await vectorService.queryText("d100-rules", query, 3);
      // @ts-ignore: results structure from vector service is dynamic
      if (results.documents && results.documents[0]) {
         return results.documents[0].join("\n\n---\n\n");
      }
      return "No rules found.";
    } catch (e) {
      const error = e as Error;
      return `Error querying rules: ${error.message}`;
    }
  },
});

const tools = [queryRulesTool];

// Manual ToolNode implementation (if prebuilt is missing/issues)
const toolNode = async (state: NarratorState) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  
  if (!lastMessage.tool_calls?.length) {
      return { messages: [] };
  }

  const toolMessages: ToolMessage[] = [];
  
  for (const call of lastMessage.tool_calls) {
      const tool = tools.find((t) => t.name === call.name);
      if (tool) {
          // @ts-ignore: Tool call args type mismatch in some versions
          const output = await tool.invoke(call.args);
          toolMessages.push(new ToolMessage({
              tool_call_id: call.id!,
              content: output,
              name: call.name
          }));
      }
  }
  
  return { messages: toolMessages };
};

// --- Model Setup ---
const chat = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.5-flash", 
  temperature: 0.8,
// @ts-ignore: Deno global
  apiKey: Deno.env.get("GOOGLE_API_KEY") || "dummy-key-for-testing", 
});

// @ts-ignore: bind method on ChatGoogleGenerativeAI has complex tool binding types
const model = chat.bind({
  tools: tools,
});

// --- Nodes ---

// 1. Generation Node
async function generateNode(state: NarratorState) {
  const { room, messages } = state;
  let inputMessages = messages;

  if (messages.length === 0) {
      const roomJSON = JSON.stringify(room, null, 2);
      
      const systemPrompt = `You are the 'Narrator' AI for a grimdark JRPG. 
Your prose is a hard-edged contract. Strip away AI tics: 'Indeed', 'A sense of', 'In the depths', and 'Mysterious'. 
Be forceful. Use active verbs. Describe the world as it is: decaying, dangerous, and indifferent to the hero's survival.

### Tone & Style
- **Prose**: Punchy, visceral, and gritty. Use 'Beautiful Prose' principles—timeless, forceful English.
- **JRPG Tropes**: Frame entries into new areas with dramatic gravity. If a room has a significant feature, treat it as a landmark.
- **Sensory Details**: You MUST mention the stench of rot or the metallic tang of blood when appropriate. The air should feel heavy or sterile.
- **Brevity**: 2 paragraphs maximum. Every word must bleed.

### Color Constraints
The 'color' field dictates the ambient horror:
- **Red**: Heat, choking smoke, the iron smell of fresh slaughter. Distant, rhythmic pounding like a dying heart.
- **Green**: Slick walls, the sweet scent of gangrene, stagnant pools that ripple without cause.
- **Blue**: A biting, ozone-thick chill. The silence is a physical weight. Frost spiders in the corners.
- **Yellow**: Choking dust, the smell of ancient parchment and crumbling teeth. Whispers that aren't quite wind.

### Feature Mechanics
Describe room features as obstacles or grim curiosities. Use 'query_rules' if the mechanical nature of a feature (e.g., 'Altar of Bone') is unclear.

### Input Data
${roomJSON}

Forge the narrative now.`;

      inputMessages = [new SystemMessage(systemPrompt), new HumanMessage("Describe the room.")];
  }

  const response = await model.invoke(inputMessages);
  return { messages: [response] };
}

function shouldContinue(state: NarratorState) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return END;
}

// --- Graph Construction ---
// Note: In some versions of LangGraph, using a simple object as state works better 
// if we use the Annotation system.
import { Annotation } from "@langchain/langgraph";

const NarratorAnnotation = Annotation.Root({
  room: Annotation<unknown>({
    reducer: (x, y) => y ?? x,
    default: () => ({}),
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  narrative: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
});

const graphBuilder = new StateGraph(NarratorAnnotation);

// @ts-ignore: LangGraph node types are complex
graphBuilder.addNode("narrator", generateNode);
// @ts-ignore: LangGraph node types are complex
graphBuilder.addNode("tools", toolNode);
// @ts-ignore: LangGraph edge types are complex
graphBuilder.addEdge("tools", "narrator");
// @ts-ignore: LangGraph entry point types are complex
graphBuilder.setEntryPoint("narrator");
// @ts-ignore: LangGraph conditional edge types are complex
graphBuilder.addConditionalEdges("narrator", shouldContinue);

export const narratorGraph = graphBuilder.compile();
