import { pipeline } from "@xenova/transformers";

export class VectorService {
  private baseUrl: string;
  // deno-lint-ignore no-explicit-any
  private static extractor: any = null; // Using any for library instance
  private static MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

  constructor(baseUrl: string = Deno.env.get("CHROMA_URL") || "http://localhost:4200") {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Ensure no trailing slash
  }

  private async getExtractor() {
    if (!VectorService.extractor) {
      console.log("Loading Embedding Model...");
      // @ts-ignore: Transformers pipeline has complex types that are difficult to type strictly in this context
      VectorService.extractor = await pipeline('feature-extraction', VectorService.MODEL_NAME);
    }
    return VectorService.extractor;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const extractor = await this.getExtractor();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  /**
   * Create a new collection in ChromaDB.
   * @param name The name of the collection.
   * @param metadata Optional metadata for the collection.
   */
  async createCollection(name: string, metadata: Record<string, unknown> = {}) {
    // Check if collection exists first or just try to create (Chroma returns existing if same name usually, or error)
    // API: POST /api/v1/collections
    const response = await fetch(`${this.baseUrl}/api/v1/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, metadata }),
    });

    if (!response.ok) {
        // If 409, it might already exist.
        if (response.status === 409) {
             // Try to get it? Or just return null/ignore?
             // For now, let's just return existing if we can fetch it, or throw if strictly create.
             // But prompt says "createCollection".
             return this.getCollection(name);
        }
        throw new Error(`Failed to create collection: ${response.statusText}`);
    }

    return await response.json();
  }

  async getCollection(name: string) {
       const response = await fetch(`${this.baseUrl}/api/v1/collections/${name}`);
       if (!response.ok) {
           throw new Error(`Failed to get collection: ${response.statusText}`);
       }
       return await response.json();
  }

  /**
   * Add documents to a collection.
   * @param collectionId The ID of the collection (UUID).
   * @param ids Array of document IDs.
   * @param embeddings Array of number arrays (the vectors).
   * @param metadatas Array of metadata objects.
   * @param documents Array of document text contents (optional).
   */
  async addDocuments(
    collectionId: string,
    ids: string[],
    embeddings: number[][],
    metadatas: Record<string, unknown>[] = [],
    documents: string[] = []
  ) {
    // API: POST /api/v1/collections/{collection_id}/add
    const body: Record<string, unknown> = {
      ids,
      embeddings,
    };
    
    if (metadatas.length > 0) body.metadatas = metadatas;
    // content/documents are optional in some versions, but good to have if we store text.
    if (documents.length > 0) body.documents = documents;

    const response = await fetch(`${this.baseUrl}/api/v1/collections/${collectionId}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to add documents: ${response.status} ${err}`);
    }

    return await response.json();
  }

  /**
   * Query the collection for nearest neighbors.
   * @param collectionId The ID of the collection.
   * @param queryEmbeddings Array of query vectors.
   * @param nResults Number of results to return.
   */
  async query(
    collectionId: string,
    queryEmbeddings: number[][],
    nResults: number = 5,
    where: Record<string, unknown> = {},
    whereDocument: Record<string, unknown> = {}
  ) {
    // API: POST /api/v1/collections/{collection_id}/query
    const body = {
      query_embeddings: queryEmbeddings,
      n_results: nResults,
      where, 
      where_document: whereDocument
    };

    const response = await fetch(`${this.baseUrl}/api/v1/collections/${collectionId}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to query documents: ${response.status} ${err}`);
    }

    return await response.json();
  }

  async queryText(
    collectionName: string,
    queryText: string,
    nResults: number = 5
  ) {
    const collection = await this.getCollection(collectionName);
    const embedding = await this.generateEmbedding(queryText);
    return this.query(collection.id, [embedding], nResults);
  }
}
