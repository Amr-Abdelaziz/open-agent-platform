import { useState, Dispatch, SetStateAction, useCallback } from "react";
import { Document } from "@langchain/core/documents";
import { v4 as uuidv4 } from "uuid";
import { Collection, CollectionCreate } from "@/types/collection";
import { toast } from "sonner";
import { useAuthContext } from "@/providers/Auth";

export const DEFAULT_COLLECTION_NAME = "default_collection";

export function getDefaultCollection(collections: Collection[]): Collection {
  return (
    collections.find((c) => c.name === DEFAULT_COLLECTION_NAME) ??
    collections[0]
  );
}

// --- Type Definitions from rag.json ---

export interface ApiDocument {
  id: string;
  collection_id: string;
  title?: string | null;
  source?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SearchResult {
  id: string;
  page_content: string;
  metadata?: Record<string, any> | null;
  score: number;
  document_info?: {
    id: string;
    title: string;
    source: string;
  } | null;
}

export interface CrawlRequest {
  url: string;
  crawl_type?: string;
  max_pages?: number;
  max_depth?: number;
  extract_code_examples?: boolean;
  max_concurrent?: number;
  urls?: string[];
  source_display_name?: string;
  skip_discovery?: boolean;
}

export interface CrawlTask {
  task_id: string;
  status: string;
  collection_id: string;
  url: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface CrawledPage {
  id: string;
  url: string;
  section_title?: string;
  word_count: number;
  char_count: number;
  created_at: string;
  full_content?: string;
  metadata: Record<string, any>;
}

function getApiUrlOrThrow(): URL {
  if (!process.env.NEXT_PUBLIC_RAG_API_URL) {
    throw new Error(
      "Failed to upload documents: API URL not configured. Please set NEXT_PUBLIC_RAG_API_URL",
    );
  }
  return new URL(process.env.NEXT_PUBLIC_RAG_API_URL);
}

export function getCollectionName(name: string | undefined) {
  if (!name) return "Unnamed collection";
  return name === DEFAULT_COLLECTION_NAME ? "Default" : name;
}

/**
 * Uploads documents to a specific collection using the API.
 *
 * @param collectionName The name of the collection to add documents to.
 * @param files An array of File objects to upload.
 * @param metadatas Optional array of metadata objects, one for each file.
 *                  Each item in the array should be a serializable object (dictionary).
 * @param apiUrlBase The base URL of your LangConnect API (e.g., "http://localhost:8000").
 * @returns A promise that resolves with the API response.
 */
async function uploadDocuments(
  collectionId: string,
  files: File[],
  authorization: string,
  metadatas?: Record<string, any>[],
): Promise<any> {
  const url = `${getApiUrlOrThrow().href}collections/${encodeURIComponent(collectionId)}/documents`;

  const formData = new FormData();

  // Append files
  files.forEach((file) => {
    formData.append("files", file, file.name);
  });

  // Append metadatas if provided
  if (metadatas) {
    if (metadatas.length !== files.length) {
      throw new Error(
        `Number of metadata objects (${metadatas.length}) must match the number of files (${files.length}).`,
      );
    }
    // FastAPI expects the metadatas as a JSON *string* in the form data
    const metadatasJsonString = JSON.stringify(metadatas);
    formData.append("metadatas_json", metadatasJsonString);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${authorization}`,
      },
    });

    if (!response.ok) {
      // Attempt to parse error details from the response body
      let errorDetail = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || JSON.stringify(errorJson);
      } catch (_) {
        // If parsing JSON fails, use the status text
        errorDetail = `${errorDetail} - ${response.statusText}`;
      }
      throw new Error(`Failed to upload documents: ${errorDetail}`);
    }

    return await response.json(); // Parse the successful JSON response
  } catch (error) {
    console.error("Error uploading documents:", error);
    throw error; // Re-throw the error for further handling
  }
}

// --- Type Definitions ---

// Return type for the combined hook
interface UseRagReturn {
  // Misc
  initialSearchExecuted: boolean;
  setInitialSearchExecuted: Dispatch<SetStateAction<boolean>>;
  // Initial load
  initialFetch: (accessToken: string) => Promise<void>;

  // Collection state and operations
  collections: Collection[];
  setCollections: Dispatch<SetStateAction<Collection[]>>;
  collectionsLoading: boolean;
  setCollectionsLoading: Dispatch<SetStateAction<boolean>>;
  getCollections: (accessToken?: string) => Promise<Collection[]>;
  createCollection: (
    name: string,
    metadata?: Record<string, any>,
    accessToken?: string,
  ) => Promise<Collection | undefined>;
  updateCollection: (
    collectionId: string,
    newName: string,
    metadata: Record<string, any>,
  ) => Promise<Collection | undefined>;
  deleteCollection: (collectionId: string) => Promise<string | undefined>;

  // Selected collection
  selectedCollection: Collection | undefined;
  setSelectedCollection: Dispatch<SetStateAction<Collection | undefined>>;

  // Document state and operations
  documents: ApiDocument[];
  setDocuments: Dispatch<SetStateAction<ApiDocument[]>>;
  documentsLoading: boolean;
  setDocumentsLoading: Dispatch<SetStateAction<boolean>>;
  listDocuments: (
    collectionId: string,
    args?: { limit?: number; offset?: number },
    accessToken?: string,
  ) => Promise<ApiDocument[]>;
  deleteDocument: (id: string) => Promise<void>;
  handleFileUpload: (
    files: FileList | null,
    collectionId: string,
  ) => Promise<void>;
  handleTextUpload: (textInput: string, collectionId: string) => Promise<void>;
  getDocumentChunks: (
    collectionId: string,
    fileId: string,
  ) => Promise<any[]>;
  searchDocuments: (
    collectionId: string,
    query: string,
    limit?: number,
    filter?: Record<string, any>
  ) => Promise<SearchResult[]>;
  getMarkdownPreview: (file: File) => Promise<string>;
  processDocument: (collectionId: string, documentId: string) => Promise<void>;
  checkOllamaHealth: () => Promise<any>;

  // Crawl operations
  startCrawl: (collectionId: string, request: CrawlRequest) => Promise<{ task_id: string }>;
  listCrawls: (collectionId: string) => Promise<CrawlTask[]>;
  getCrawlStatus: (taskId: string) => Promise<CrawlTask>;
  cancelCrawl: (taskId: string) => Promise<void>;
  deleteCrawl: (taskId: string) => Promise<void>;
  listPages: (collectionId: string, limit?: number, offset?: number) => Promise<CrawledPage[]>;
  getPageContent: (pageId: string) => Promise<CrawledPage>;
  deletePage: (pageId: string) => Promise<void>;
  deleteSource: (sourceId: string) => Promise<void>;
}

/**
 * Custom hook for managing RAG collections and documents.
 * Combines the logic of useCollections and useDocuments.
 */
export function useRag(): UseRagReturn {
  const { session } = useAuthContext();

  // --- State ---
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<
    Collection | undefined
  >(undefined);
  const [initialSearchExecuted, setInitialSearchExecuted] = useState(false);

  // --- Initial Fetch ---
  const initialFetch = useCallback(async (accessToken: string) => {
    setCollectionsLoading(true);
    setDocumentsLoading(true);
    let initCollections: Collection[] = [];

    try {
      initCollections = await getCollections(accessToken);
    } catch (e: any) {
      if (e.message.includes("Failed to fetch collections")) {
        // Database likely not initialized yet. Let's try this then re-fetch.
        await initializeDatabase(accessToken);
        initCollections = await getCollections(accessToken);
      }
    }

    if (!initCollections.length) {
      // No collections exist, return early
      setCollectionsLoading(false);
      setDocumentsLoading(false);
      setInitialSearchExecuted(true);
      return;
    }

    setCollections(initCollections);
    const defaultCollection = initCollections[0];
    setSelectedCollection(defaultCollection);

    setInitialSearchExecuted(true);
    setCollectionsLoading(false);

    const documents = await listDocuments(
      defaultCollection.uuid,
      {
        limit: 100,
      },
      accessToken,
    );
    setDocuments(documents);
    setDocumentsLoading(false);
  }, []);

  const initializeDatabase = useCallback(
    async (accessToken?: string) => {
      if (!session?.accessToken && !accessToken) {
        toast.error("No session found", {
          richColors: true,
          description: "Failed to list documents. Please try again.",
        });
        return [];
      }

      const url = getApiUrlOrThrow();
      url.pathname = "/admin/initialize-database";
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken || session?.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(
          `Failed to initialize database: ${response.statusText}`,
        );
      }
      const data = await response.json();
      return data;
    },
    [session],
  );

  // --- Document Operations ---

  const listDocuments = useCallback(
    async (
      collectionId: string,
      args?: { limit?: number; offset?: number },
      accessToken?: string,
    ): Promise<ApiDocument[]> => {
      if (!session?.accessToken && !accessToken) {
        toast.error("No session found", {
          richColors: true,
          description: "Failed to list documents. Please try again.",
        });
        return [];
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/collections/${collectionId}/documents`;
      if (args?.limit) {
        url.searchParams.set("limit", args.limit.toString());
      }
      if (args?.offset) {
        url.searchParams.set("offset", args.offset.toString());
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken || session?.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    },
    [session],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      if (!session?.accessToken) {
        toast.error("No session found", {
          richColors: true,
          description: "Failed to delete document. Please try again.",
        });
        return;
      }

      if (!selectedCollection) {
        throw new Error("No collection selected");
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/collections/${selectedCollection.uuid}/documents/${id}`;

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`);
      }

      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== id),
      );
    },
    [selectedCollection, session],
  );

  const handleFileUpload = useCallback(
    async (files: FileList | null, collectionId: string) => {
      if (!session?.accessToken) {
        toast.error("No session found", {
          richColors: true,
          description: "Failed to upload file document(s). Please try again.",
        });
        return;
      }

      if (!files || files.length === 0) {
        console.warn("File upload skipped: No files selected.");
        return;
      }

      const newDocs: Document[] = Array.from(files).map((file) => {
        return new Document({
          id: uuidv4(),
          pageContent: `Content of ${file.name}`, // Placeholder: Real implementation needs file reading
          metadata: {
            name: file.name,
            collection: collectionId,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            created_at: new Date().toISOString(),
          },
        });
      });

      setDocumentsLoading(true);
      try {
        const response = await uploadDocuments(
          collectionId,
          Array.from(files),
          session.accessToken,
          newDocs.map((d) => d.metadata),
        );
        // Refresh documents from API to get the proper UUIDs and fields
        const updatedDocs = await listDocuments(collectionId);
        setDocuments(updatedDocs);
      } finally {
        setDocumentsLoading(false);
      }
    },
    [session],
  );

  const handleTextUpload = useCallback(
    async (textInput: string, collectionId: string) => {
      if (!session?.accessToken) {
        toast.error("No session found", {
          richColors: true,
          description: "Failed to upload text document. Please try again.",
        });
        return;
      }

      if (!textInput.trim()) {
        console.warn("Text upload skipped: Text is empty.");
        return;
      }
      const textBlob = new Blob([textInput], { type: "text/plain" });
      const fileName = `Text Document ${new Date().toISOString().slice(0, 19).replace("T", " ")}.txt`;
      const textFile = new File([textBlob], fileName, { type: "text/plain" });
      const metadata = {
        name: fileName,
        collection: collectionId,
        size: `${(textInput.length / 1024).toFixed(1)} KB`,
        created_at: new Date().toISOString(),
      };
      setDocumentsLoading(true);
      try {
        await uploadDocuments(collectionId, [textFile], session.accessToken, [
          metadata,
        ]);
        // Refresh documents from API
        const updatedDocs = await listDocuments(collectionId);
        setDocuments(updatedDocs);
      } finally {
        setDocumentsLoading(false);
      }
    },
    [session],
  );

  const getDocumentChunks = useCallback(
    async (collectionId: string, fileId: string): Promise<any[]> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return [];
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/collections/${collectionId}/documents/${fileId}/chunks`;

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document chunks: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    [session],
  );

  const searchDocuments = useCallback(
    async (
      collectionId: string,
      query: string,
      limit: number = 10,
      filter?: Record<string, any>
    ): Promise<SearchResult[]> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return [];
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/collections/${collectionId}/documents/search`;

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ query, limit, filter }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      return await response.json();
    },
    [session]
  );

  const getMarkdownPreview = useCallback(
    async (file: File): Promise<string> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return "";
      }

      const url = getApiUrlOrThrow();
      url.pathname = "/documents/markdown";

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to generate markdown: ${response.statusText}`);
      }

      const data = await response.json();
      // data is expected to be { "filename": "markdown content" }
      const content = Object.values(data)[0] as string;
      return content;
    },
    [session]
  );

  const processDocument = useCallback(
    async (collectionId: string, documentId: string) => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return;
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/collections/${collectionId}/documents/${documentId}/process`;

      try {
        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to process document: ${response.statusText}`);
        }

        toast.success("Document processing started");

        // Refresh documents to get updated status/metadata
        await listDocuments(collectionId);
      } catch (error: any) {
        console.error("Error processing document:", error);
        toast.error(error.message || "Failed to start document processing");
        throw error;
      }
    },
    [session, listDocuments]
  );

  const checkOllamaHealth = useCallback(async () => {
    if (!session?.accessToken) {
      toast.error("No session found");
      return;
    }

    const url = getApiUrlOrThrow();
    url.pathname = "/api/ollama/health";

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Failed to check Ollama health: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error checking Ollama health:", error);
      toast.error(error.message || "Failed to check Ollama health");
      throw error;
    }
  }, [session]);

  const startCrawl = useCallback(
    async (collectionId: string, request: CrawlRequest) => {
      if (!session?.accessToken) {
        toast.error("No session found");
        throw new Error("No session found");
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/collections/${collectionId}/crawl`;

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to start crawl: ${response.statusText}`);
      }

      return await response.json();
    },
    [session]
  );

  const listCrawls = useCallback(
    async (collectionId: string): Promise<CrawlTask[]> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return [];
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/collections/${collectionId}/crawls`;

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch crawls: ${response.statusText}`);
      }

      return await response.json();
    },
    [session]
  );

  const getCrawlStatus = useCallback(
    async (taskId: string): Promise<CrawlTask> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        throw new Error("No session found");
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/crawl/${taskId}`;

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch crawl status: ${response.statusText}`);
      }

      return await response.json();
    },
    [session]
  );

  const cancelCrawl = useCallback(
    async (taskId: string) => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return;
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/crawl/${taskId}/cancel`;

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel crawl: ${response.statusText}`);
      }
    },
    [session]
  );

  const deleteCrawl = useCallback(
    async (taskId: string): Promise<void> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return;
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/crawl/${taskId}`;

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete crawl: ${response.statusText}`);
      }
    },
    [session]
  );

  const listPages = useCallback(
    async (collectionId: string, limit: number = 50, offset: number = 0): Promise<CrawledPage[]> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return [];
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/collections/${collectionId}/pages`;
      url.searchParams.set("limit", limit.toString());
      url.searchParams.set("offset", offset.toString());

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.statusText}`);
      }

      return await response.json();
    },
    [session]
  );

  const getPageContent = useCallback(
    async (pageId: string): Promise<CrawledPage> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        throw new Error("No session found");
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/pages/${pageId}`;

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page content: ${response.statusText}`);
      }

      return await response.json();
    },
    [session]
  );

  const deletePage = useCallback(
    async (pageId: string): Promise<void> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return;
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/pages/${pageId}`;

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete page: ${response.statusText}`);
      }
    },
    [session]
  );

  const deleteSource = useCallback(
    async (sourceId: string): Promise<void> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return;
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/sources/${sourceId}`;

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete source: ${response.statusText}`);
      }
    },
    [session]
  );

  // --- Collection Operations ---

  const getCollections = useCallback(
    async (accessToken?: string): Promise<Collection[]> => {
      if (!session?.accessToken && !accessToken) {
        toast.error("No session found", {
          richColors: true,
          description: "Failed to fetch collections. Please try again.",
        });
        return [];
      }

      const url = getApiUrlOrThrow();
      url.pathname = "/collections";

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken || session?.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    },
    [session],
  );

  const createCollection = useCallback(
    async (
      name: string,
      metadata: Record<string, any> = {},
      accessToken?: string,
    ): Promise<Collection | undefined> => {
      if (!session?.accessToken && !accessToken) {
        toast.error("No session found", {
          richColors: true,
          description: "Failed to create collection. Please try again.",
        });
        return;
      }

      const url = getApiUrlOrThrow();
      url.pathname = "/collections";

      const trimmedName = name.trim();
      if (!trimmedName) {
        console.error("Collection name cannot be empty.");
        return undefined;
      }
      const nameExists = collections.some(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
      );
      if (nameExists) {
        console.warn(`Collection with name "${trimmedName}" already exists.`);
        return undefined;
      }

      const newCollection: CollectionCreate = {
        name: trimmedName,
        metadata,
      };
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken || session?.accessToken}`,
        },
        body: JSON.stringify(newCollection),
      });
      if (!response.ok) {
        console.error(`Failed to create collection: ${response.statusText}`);
        return undefined;
      }
      const data = await response.json();
      setCollections((prevCollections) => [...prevCollections, data]);
      return data;
    },
    [collections, session],
  );

  const updateCollection = useCallback(
    async (
      collectionId: string,
      newName: string,
      metadata: Record<string, any>,
    ): Promise<Collection | undefined> => {
      if (!session?.accessToken) {
        toast.error("No session found", {
          richColors: true,
          description: "Failed to update collection. Please try again.",
        });
        return;
      }

      // Find the collection to update
      const collectionToUpdate = collections.find(
        (c) => c.uuid === collectionId,
      );

      if (!collectionToUpdate) {
        toast.error(`Collection with ID "${collectionId}" not found.`, {
          richColors: true,
        });
        return undefined;
      }

      const trimmedNewName = newName.trim();
      if (!trimmedNewName) {
        toast.error("Collection name cannot be empty.", { richColors: true });
        return undefined;
      }

      // Check if the new name already exists (only if name is changing)
      const nameExists = collections.some(
        (c) =>
          c.name.toLowerCase() === trimmedNewName.toLowerCase() &&
          c.name !== collectionToUpdate.name,
      );
      if (nameExists) {
        toast.warning(
          `Collection with name "${trimmedNewName}" already exists.`,
          { richColors: true },
        );
        return undefined;
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/collections/${collectionId}`;

      const updateData = {
        name: trimmedNewName,
        metadata: metadata,
      };

      const response = await fetch(url.toString(), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        toast.error(`Failed to update collection: ${response.statusText}`, {
          richColors: true,
        });
        return undefined;
      }

      const updatedCollection = await response.json();

      // Update the collections state
      setCollections((prevCollections) =>
        prevCollections.map((collection) =>
          collection.uuid === collectionId ? updatedCollection : collection,
        ),
      );

      // Update selected collection if it was the one that got updated
      if (selectedCollection && selectedCollection.uuid === collectionId) {
        setSelectedCollection(updatedCollection);
      }

      return updatedCollection;
    },
    [collections, selectedCollection, session],
  );

  const deleteCollection = useCallback(
    async (collectionId: string): Promise<string | undefined> => {
      if (!session?.accessToken) {
        toast.error("No session found", {
          richColors: true,
          description: "Failed to delete collection. Please try again.",
        });
        return;
      }

      const collectionToDelete = collections.find(
        (c) => c.uuid === collectionId,
      );

      if (!collectionToDelete) {
        return;
      }

      const url = getApiUrlOrThrow();
      url.pathname = `/collections/${collectionId}`;

      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        console.error(`Failed to delete collection: ${response.statusText}`);
        return undefined;
      }

      // Delete the collection itself
      setCollections((prevCollections) =>
        prevCollections.filter(
          (collection) => collection.uuid !== collectionId,
        ),
      );
    },
    [collections, session],
  );

  // --- Return combined state and functions ---
  return {
    // Misc
    initialSearchExecuted,
    setInitialSearchExecuted,
    initialFetch,

    // Collections
    collections,
    setCollections,
    collectionsLoading,
    setCollectionsLoading,
    getCollections,
    createCollection,
    updateCollection,
    deleteCollection,

    selectedCollection,
    setSelectedCollection,

    // Documents
    documents,
    setDocuments,
    documentsLoading,
    setDocumentsLoading,
    listDocuments,
    deleteDocument,
    handleFileUpload,
    handleTextUpload,
    getDocumentChunks,
    searchDocuments,
    getMarkdownPreview,
    processDocument,
    checkOllamaHealth,

    // Crawl
    startCrawl,
    listCrawls,
    getCrawlStatus,
    cancelCrawl,
    deleteCrawl,
    listPages,
    getPageContent,
    deletePage,
    deleteSource,
  };
}
