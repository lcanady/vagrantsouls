import { assert, assertEquals } from "@std/assert";
import { VectorService } from "../server/services/VectorService.ts";

// Mock global fetch
const mockFetch = (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const url = input.toString();
  
  // 1. Create Collection
  if (url.includes("/api/v1/collections") && init?.method === "POST") {
    // Check request body
    const body = JSON.parse(init.body as string);
    if (body.name === "test-collection") {
        return Promise.resolve(new Response(JSON.stringify({ 
            id: "uuid-1234", 
            name: "test-collection",
            metadata: body.metadata 
        }), { status: 200 }));
    }
  }

  // 1b. Get Collection
    if (url.includes("/api/v1/collections/test-collection") && (!init || init.method === "GET")) {
        return Promise.resolve(new Response(JSON.stringify({
            id: "uuid-1234",
            name: "test-collection"
        }), { status: 200 }));
    }

  // 2. Add Documents
  if (url.includes("/add") && init?.method === "POST") {
    return Promise.resolve(new Response(JSON.stringify(true), { status: 200 })); 
  }

  // 3. Query
  if (url.includes("/query") && init?.method === "POST") {
    const _body = JSON.parse(init.body as string);
    return Promise.resolve(new Response(JSON.stringify({
      ids: [["doc1"]],
      distances: [[0.1]],
      metadatas: [[{ "category": "test" }]],
      documents: [[ "This is a test document" ]]
    }), { status: 200 }));
  }

  return Promise.resolve(new Response("Not Found", { status: 404 }));
};

// Replace global fetch for test
// Using `globalThis.fetch` to override
const _originalFetch = globalThis.fetch;
globalThis.fetch = mockFetch as typeof globalThis.fetch;

Deno.test("VectorService Tests", async (t) => {
  const service = new VectorService("http://mock-chroma:4200");

  await t.step("Create Collection", async () => {
    const col = await service.createCollection("test-collection", { description: "Test" });
    assertEquals(col.name, "test-collection");
    assertEquals(col.id, "uuid-1234");
  });

  await t.step("Add Documents", async () => {
    const result = await service.addDocuments(
      "uuid-1234", 
      ["doc1"], 
      [[0.1, 0.2, 0.3]], 
      [{ "category": "test" }]
    );
    assert(result); 
  });

  await t.step("Query Documents", async () => {
    const results = await service.query(
      "uuid-1234",
      [[0.1, 0.2, 0.3]],
      1
    );
    assertEquals(results.ids[0][0], "doc1");
  });

});

// Restore fetch? Not strictly needed for one-shot test script but good practice
// globalThis.fetch = originalFetch;
