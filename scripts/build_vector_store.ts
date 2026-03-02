
// scripts/build_vector_store.ts

import { VectorService } from "../server/services/VectorService.ts";
// Import transformers.js from CDN compatible with Deno/Browser
// We use the Module version.
import { pipeline } from "@xenova/transformers";

// Configuration
const CHROMA_COLLECTION = "d100-rules";
const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

async function buildVectorStore() {
  console.log("Initializing Vector Service...");
  const vectorService = new VectorService();
  
  // Ensure collection exists
  try {
    await vectorService.createCollection(CHROMA_COLLECTION, { description: "Vagrant Souls Rules" });
    console.log(`Collection '${CHROMA_COLLECTION}' created.`);
  } catch (e) {
    console.log(`Collection '${CHROMA_COLLECTION}' might already exist or error:`, e.message);
  }

  console.log("Loading rules...");
  const text = await Deno.readTextFile("d100_dungeon_rules.txt");
  
  // Chunking Strategy: Header/Topic
  // We'll look for lines that are ALL CAPS and short to denote headers.
  // We'll group text under these headers.
  
  const lines = text.split(/\r\n|\n|\r/);
  const chunks: { header: string; text: string }[] = [];
  
  let currentHeader = "INTRODUCTION";
  let currentBuffer: string[] = [];
  
  const isHeader = (line: string) => {
    const trimmed = line.trim();
    // Headers usually ALL CAPS, at least 3 chars, not too long.
    // Exclude Table ranges like "72-74"
    return trimmed.length > 3 && 
           trimmed.length < 50 && 
           /^[A-Z0-9\s\.\-]+$/.test(trimmed) && 
           !/^\d+-\d+$/.test(trimmed) &&
           !/^\d+$/.test(trimmed);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (isHeader(trimmed)) {
      if (currentBuffer.length > 0) {
        chunks.push({
          header: currentHeader,
          text: currentBuffer.join(" ")
        });
        currentBuffer = [];
      }
      currentHeader = trimmed;
    } else {
        // Simple heuristic: if line is part of a table (starts with number/range), maybe skip?
        // But context is good. We'll include it for now, let RAG filter relevance.
        currentBuffer.push(trimmed);
    }
  }
  
  if (currentBuffer.length > 0) {
    chunks.push({ header: currentHeader, text: currentBuffer.join(" ") });
  }
  
  console.log(`Created ${chunks.length} chunks.`);
  
  console.log("Loading Embedding Model (this may take a while first time)...");
  // @ts-ignore: pipeline types are complex
  const extractor = await pipeline('feature-extraction', MODEL_NAME);

  console.log("Generating Embeddings and Indexing...");
  
  const BATCH_SIZE = 10;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    
    // Generate embeddings
    const embeddings: number[][] = [];
    const ids: string[] = [];
    const metadatas: Record<string, unknown>[] = [];
    const documents: string[] = [];
    
    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      try {
          const output = await extractor(chunk.text, { pooling: 'mean', normalize: true });
          // output is tensor, get array
          embeddings.push(Array.from(output.data));
          
          const id = `rule-${i + j}`;
          ids.push(id);
          metadatas.push({ header: chunk.header, source: "d100_dungeon_rules.txt" });
          documents.push(chunk.text);
      } catch (e) {
          console.error(`Error embedding chunk ${i+j}:`, e);
      }
    }
    
    if (ids.length > 0) {
        await vectorService.addDocuments(
            // We need the collection ID, not name, usually? 
            // The VectorService implementation uses /api/v1/collections/{id}/add
            // But verify if Chroma accepts name or needs ID.
            // Usually we need to fetch the collection first to get the ID.
            // Let's modify VectorService or fetch ID here.
            // Assuming we need ID.
            await getCollectionId(vectorService, CHROMA_COLLECTION),
            ids,
            embeddings,
            metadatas,
            documents
        );
        console.log(`Indexed batch ${i / BATCH_SIZE + 1} / ${Math.ceil(chunks.length / BATCH_SIZE)}`);
    }
  }
  
  console.log("Done!");
}

async function getCollectionId(service: VectorService, name: string): Promise<string> {
    try {
        const col = await service.getCollection(name);
        return col.id;
    } catch (e) {
        throw new Error(`Could not find collection ${name}: ${e.message}`);
    }
}

if (import.meta.main) {
  buildVectorStore();
}
