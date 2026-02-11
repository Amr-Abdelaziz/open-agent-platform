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

export interface HybridChunkingTask {
  task_id: string;
  collection_id: string;
  owner_id: string;
  file_path: string;
  status: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface HybridChunkingOptions {
  include_converted_doc?: boolean;
  target_type?: string;
  convert_from_formats?: string[];
  convert_image_export_mode?: string;
  convert_do_ocr?: boolean;
  convert_force_ocr?: boolean;
  convert_ocr_engine?: string;
  convert_ocr_lang?: string[] | null;
  convert_pdf_backend?: string;
  convert_table_mode?: string;
  convert_table_cell_matching?: boolean;
  convert_pipeline?: string;
  convert_page_range?: (number | string)[];
  convert_document_timeout?: number;
  convert_abort_on_error?: boolean;
  convert_do_table_structure?: boolean;
  convert_include_images?: boolean;
  convert_images_scale?: number;
  convert_md_page_break_placeholder?: string;
  convert_do_code_enrichment?: boolean;
  convert_do_formula_enrichment?: boolean;
  convert_do_picture_classification?: boolean;
  convert_do_picture_description?: boolean;
  convert_picture_description_area_threshold?: number;
  convert_picture_description_local?: string;
  convert_picture_description_api?: string;
  convert_vlm_pipeline_model?: string | null;
  convert_vlm_pipeline_model_local?: string;
  convert_vlm_pipeline_model_api?: string;
  chunking_use_markdown_tables?: boolean;
  chunking_include_raw_text?: boolean;
  chunking_max_tokens?: number | null;
  chunking_tokenizer?: string;
  chunking_merge_peers?: boolean;
}

export interface CrawlTask {
  task_id: string;
  status: string;
  collection_id: string;
  url: string;
  created_at: string;
  updated_at: string;
  source_id?: string;
  metadata?: Record<string, any>;
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
  handleGraniteConversion: (
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
  getGraniteMarkdownPreview: (file: File, maxPages?: number) => Promise<string>;
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
  // Storage
  browseStorage: (path?: string) => Promise<any>;
  downloadStorage: (path: string) => Promise<void>;
  getStorageFile: (path: string) => Promise<Blob>;
  deleteStorageFile: (path: string) => Promise<void>;
  uploadToStorage: (file: File, path?: string) => Promise<void>;
  // Hybrid Chunking
  startHybridChunking: (collectionId: string, filePath: string, options?: HybridChunkingOptions) => Promise<void>;
  listHybridChunkingTasks: (collectionId: string) => Promise<HybridChunkingTask[]>;
  getTaskStatus: (taskId: string) => Promise<any>;
  getTaskResult: (taskId: string) => Promise<any>;
  deleteHybridChunkingTask: (taskId: string) => Promise<void>;
  clearRunningTasks: () => Promise<void>;
  clearResults: () => Promise<void>;
  // Settings persistence
  getDoclingSettings: () => Promise<HybridChunkingOptions | undefined>;
  updateDoclingSettings: (settings: HybridChunkingOptions) => Promise<void>;
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

  // --- Hybrid Chunking & Settings ---

  const getDoclingSettings = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from("docling_settings")
        .select("settings")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.settings as HybridChunkingOptions | undefined;
    } catch (error) {
      console.error("Error fetching docling settings:", error);
      return undefined;
    }
  }, [session?.user?.id]);

  const updateDoclingSettings = useCallback(async (settings: HybridChunkingOptions) => {
    if (!session?.user?.id) return;
    try {
      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();
      const { error } = await (supabase as any)
        .from("docling_settings")
        .upsert({
          owner_id: session.user.id,
          settings,
          updated_at: new Date().toISOString(),
        } as any);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating docling settings:", error);
      toast.error("Failed to save settings");
    }
  }, [session?.user?.id]);

  const startHybridChunking = useCallback(async (collectionId: string, filePath: string, options?: HybridChunkingOptions) => {
    if (!session?.accessToken) {
      toast.error("No session found");
      return;
    }

    // 1. Create task in our DB
    const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
    const supabase = getSupabaseClient();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || "";

    const { data: task, error: dbError } = await ((supabase as any)
      .from("hybrid_chunking_tasks")
      .insert({
        collection_id: collectionId,
        owner_id: userId,
        file_path: filePath,
        status: "pending",
        metadata: { options }
      } as any)
      .select()
      .single() as any);

    console.log("Supabase insert result:", { task, dbError });

    if (dbError) {
      console.error("Task insertion failed:", dbError);
      throw new Error(`Failed to create task record: ${dbError.message}`);
    }

    // 2. Trigger the external service
    const gorbitUrl = "http://gorbit:5001/v1/chunk/hybrid/file/async";

    try {
      // Download the file from Supabase storage to send as multipart data
      const { data: blob, error: downloadError } = await supabase.storage
        .from("documents")
        .download(filePath);

      if (downloadError) {
        throw new Error(`Failed to download file from storage: ${downloadError.message}`);
      }

      const formData = new FormData();
      // Aligning with openapi.json: use 'files' as a multipart/form-data field (binary array)
      formData.append("files", blob, filePath.split("/").pop() || "file");

      const dbSettings = (await getDoclingSettings()) || {};

      // 3. Built strictly whitelisted FormData
      const allowedKeys = [
        "include_converted_doc",
        "target_type",
        "convert_",
        "chunking_"
      ];

      console.log("--- GORBIT PAYLOAD DEBUG ---");
      console.log("Original DB settings:", dbSettings);

      Object.entries(dbSettings).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        // Whitelist check
        const isAllowed = allowedKeys.some(allowed =>
          key === allowed || key.startsWith(allowed)
        );

        if (!isAllowed) {
          console.warn(`Stripping forbidden key from Gorbit payload: ${key}`);
          return;
        }

        if (Array.isArray(value)) {
          console.log(`Appending array: ${key}=${JSON.stringify(value)}`);
          value.forEach(v => formData.append(key, String(v)));
        } else {
          console.log(`Appending field: ${key}=${value}`);
          formData.append(key, String(value));
        }
      });
      console.log("----------------------------");

      const response = await fetch(gorbitUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Hybrid chunking request failed:", errorData);
        throw new Error(errorData.detail || `Failed to start hybrid chunking: ${response.statusText}`);
      }

      const gorbitTask = await response.json();
      console.log("Hybrid chunking task started on gorbit:", gorbitTask);

      toast.success("Hybrid chunking task started");

      // Update task status to processing
      const { error: updateError } = await ((supabase as any)
        .from("hybrid_chunking_tasks")
        .update({
          status: "processing",
          metadata: {
            ...task.metadata,
            gorbit_task: gorbitTask
          }
        } as any)
        .eq("task_id", task.task_id) as any);

      if (updateError) {
        console.error("Failed to update task status to processing:", updateError);
      }

    } catch (error: any) {
      console.error("Error in startHybridChunking:", error);
      if (task?.task_id) {
        const { error: finalUpdateError } = await ((supabase as any)
          .from("hybrid_chunking_tasks")
          .update({
            status: "failed",
            metadata: {
              ...((task as any)?.metadata || {}),
              error: error.message
            }
          } as any)
          .eq("task_id", task.task_id) as any);

        if (finalUpdateError) {
          console.error("Failed to update task status to failed:", finalUpdateError);
        }
      }
      throw error;
    }
  }, [session, getDoclingSettings]);

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
      if (!session?.accessToken || !session?.user?.id) {
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

      setDocumentsLoading(true);
      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();
      const userId = session.user.id;

      try {
        // We do sequential processing to avoid overwhelming the Gorbit worker
        // and because we want to ensure each file is uploaded before starting task
        for (const file of Array.from(files)) {
          const fileName = file.name;
          const storagePath = `${userId}/${fileName}`;

          // 1. Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(storagePath, file, { upsert: true });

          if (uploadError) {
            console.error(`Upload failed for ${fileName}:`, uploadError);
            toast.error(`Failed to upload ${fileName}`);
            continue;
          }

          // 2. Start Hybrid Chunking (Docling)
          try {
            await startHybridChunking(collectionId, storagePath);
          } catch (err: any) {
            console.error(`Docling trigger failed for ${fileName}:`, err);
            toast.error(`Gorbit failed for ${fileName}`);
          }
        }
      } finally {
        setDocumentsLoading(false);
      }
    },
    [session, startHybridChunking],
  );

  const handleGraniteConversion = useCallback(
    async (files: FileList | null, collectionId: string) => {
      if (!session?.accessToken) {
        toast.error("No session found", {
          richColors: true,
          description: "Failed to process documents. Please try again.",
        });
        return;
      }

      if (!files || files.length === 0) {
        console.warn("Granite conversion skipped: No files selected.");
        return;
      }

      setDocumentsLoading(true);
      const loadingToast = toast.loading("Processing with Granite Vision...", { richColors: true });

      try {
        const url = getApiUrlOrThrow();
        url.pathname = `/collections/${collectionId}/documents/granite`;

        const formData = new FormData();
        Array.from(files).forEach((file) => {
          formData.append("files", file, file.name);
        });

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let errorDetail = errorData.detail || response.statusText;
          if (Array.isArray(errorDetail)) {
            errorDetail = JSON.stringify(errorDetail);
          }
          throw new Error(`Granite conversion failed: ${errorDetail}`);
        }

        toast.success("Granite conversion started successfully", { richColors: true });

        // Refresh documents
        const updatedDocs = await listDocuments(collectionId);
        setDocuments(updatedDocs);

      } catch (error: any) {
        console.error("Granite conversion error:", error);
        toast.error(error.message || "Failed to start Granite conversion");
      } finally {
        setDocumentsLoading(false);
        toast.dismiss(loadingToast);
      }
    },
    [session, listDocuments]
  );

  const handleTextUpload = useCallback(
    async (textInput: string, collectionId: string) => {
      if (!session?.accessToken || !session?.user?.id) {
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

      setDocumentsLoading(true);
      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();
      const userId = session.user.id;

      try {
        const textBlob = new Blob([textInput], { type: "text/plain" });
        const fileName = `note_${new Date().getTime()}.txt`;
        const storagePath = `${userId}/${fileName}`;
        const textFile = new File([textBlob], fileName, { type: "text/plain" });

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(storagePath, textFile, { upsert: true });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        // 2. Trigger Hybrid Chunking
        await startHybridChunking(collectionId, storagePath);
      } finally {
        setDocumentsLoading(false);
      }
    },
    [session, startHybridChunking],
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

  const getGraniteMarkdownPreview = useCallback(
    async (file: File, maxPages?: number): Promise<string> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return "";
      }

      const url = getApiUrlOrThrow();
      url.pathname = "/documents/markdown/granite";
      if (maxPages) {
        url.searchParams.set("max_pages", maxPages.toString());
      }

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to generate markdown: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Granite Markdown API Response:", data);

      if (typeof data === 'string') return data;
      if (typeof data === 'object' && data !== null) {
        // Prioritize the 'markdown' key if it exists
        if ('markdown' in data && typeof data.markdown === 'string') {
          return data.markdown;
        }

        // Fallback: look for any key that isn't 'filename'
        const keys = Object.keys(data);
        const contentKey = keys.find(k => k !== 'filename' && typeof data[k] === 'string');
        if (contentKey) return data[contentKey];

        // Last resort: first string value
        const values = Object.values(data);
        const firstString = values.find(v => typeof v === 'string');
        if (firstString) return firstString as string;
      }
      return JSON.stringify(data);
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
      url.pathname = `/collections/${collectionId}/documents/${documentId}/embed`;

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
    handleGraniteConversion,
    handleTextUpload,
    getDocumentChunks,
    searchDocuments,
    getMarkdownPreview,
    getGraniteMarkdownPreview,
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

    // Storage
    getStorageFile: useCallback(async (path: string): Promise<Blob> => {
      if (!session?.accessToken) {
        toast.error("No session found");
        throw new Error("No session found");
      }

      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.storage
        .from('documents')
        .download(path);

      if (error) {
        throw new Error(`Failed to fetch from Supabase: ${error.message}`);
      }

      return data;
    }, [session]),
    browseStorage: useCallback(async (path: string = "") => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return [];
      }

      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.storage
        .from('documents')
        .list(path);

      if (error) {
        throw new Error(`Failed to list storage: ${error.message}`);
      }

      return data || [];
    }, [session]),

    downloadStorage: useCallback(async (path: string) => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return;
      }

      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.storage
        .from('documents')
        .download(path);

      if (error) {
        throw new Error(`Failed to download from Supabase: ${error.message}`);
      }

      const downloadUrl = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', path.split('/').pop() || 'file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    }, [session]),

    deleteStorageFile: useCallback(async (path: string) => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return;
      }

      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.storage
        .from('documents')
        .remove([path]);

      if (error) {
        throw new Error(`Failed to delete from Supabase: ${error.message}`);
      }
    }, [session]),

    uploadToStorage: useCallback(async (file: File, path: string = "") => {
      if (!session?.accessToken) {
        toast.error("No session found");
        return;
      }

      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();

      // Ensure the path ends with the filename
      const fullPath = path ? (path.endsWith('/') ? `${path}${file.name}` : `${path}/${file.name}`) : file.name;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fullPath, file, {
          upsert: true
        });

      if (error) {
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
      }
    }, [session]),

    startHybridChunking,

    listHybridChunkingTasks: useCallback(async (collectionId: string): Promise<HybridChunkingTask[]> => {
      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();

      const { data, error } = await ((supabase as any)
        .from("hybrid_chunking_tasks")
        .select("*")
        .eq("collection_id", collectionId)
        .order("created_at", { ascending: false }) as any);

      if (error) {
        throw new Error(`Failed to fetch tasks: ${error.message}`);
      }

      const tasks = data as HybridChunkingTask[];

      // Sync active tasks in the background
      const activeTasks = tasks.filter(t =>
        ["pending", "processing"].includes(t.status.toLowerCase())
      );

      if (activeTasks.length > 0 && session?.accessToken) {
        // We trigger the sync in the background so we don't block the UI
        // The next poll will pick up the updated status from the database
        activeTasks.forEach(async (task) => {
          const gorbitTaskId = task.metadata?.gorbit_task?.task_id;
          if (!gorbitTaskId) return;

          try {
            const gorbitUrl = `http://gorbit:5001/v1/status/poll/${gorbitTaskId}`;
            const response = await fetch(gorbitUrl, {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
              },
            });

            if (response.ok) {
              const gorbitStatusData = await response.json();
              const gorbitStatus = gorbitStatusData.task_status.toLowerCase();

              let newStatus = task.status;
              if (gorbitStatus === "completed" || gorbitStatus === "success") {
                newStatus = "completed";
              } else if (gorbitStatus === "failed") {
                newStatus = "failed";
              }

              if (newStatus !== task.status.toLowerCase() || (newStatus === "completed" && !task.metadata?.ingested)) {
                let gorbitResultData = task.metadata?.gorbit_result;
                let ingested = task.metadata?.ingested || false;

                // 1. Fetch result if missing
                if (newStatus === "completed" && !gorbitResultData) {
                  try {
                    const resultUrl = `http://gorbit:5001/v1/result/${gorbitTaskId}`;
                    const resltResponse = await fetch(resultUrl, {
                      headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                      },
                    });
                    if (resltResponse.ok) {
                      gorbitResultData = await resltResponse.json();
                      console.log(`Fetched result for task ${task.task_id}`);
                    }
                  } catch (resError) {
                    console.error(`Failed to fetch result for task ${task.task_id}:`, resError);
                  }
                }

                // 2. Ingest if completed and not yet ingested
                if (newStatus === "completed" && gorbitResultData && !ingested) {
                  console.log(`Starting DB ingestion for task ${task.task_id}...`);
                  try {
                    const docIdMap: Record<string, string> = {};

                    // A. Documents & Filename Mapping
                    const documentsFromGorbit = gorbitResultData.documents || [];
                    const chunksFromGorbit = gorbitResultData.chunks || [];

                    for (const doc of documentsFromGorbit) {
                      const docId = uuidv4();
                      const filename = doc.content?.filename || "Untitled";
                      docIdMap[filename] = docId;

                      const { error: docError } = await (supabase as any)
                        .from("documents")
                        .insert({
                          id: docId,
                          collection_id: task.collection_id,
                          owner_id: task.owner_id,
                          title: filename,
                          source: task.file_path,
                          content: (doc.content?.md_content || doc.content?.text_content || doc.content?.html_content || "").slice(0, 100000), // Safety truncation
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          metadata: {
                            task_id: task.task_id,
                            ingested_from: "hybrid_chunking",
                            embedding_status: "pending",
                            ...doc.content?.metadata
                          }
                        });

                      if (docError) console.error("Error inserting document:", docError);
                    }

                    // Ensure all filenames present in chunks have a document row (fallback if include_converted_doc was false)
                    const uniqueChunkFilenames = new Set(chunksFromGorbit.map((c: any) => c.filename));
                    for (const fname of Array.from(uniqueChunkFilenames)) {
                      if (fname && !docIdMap[fname as string]) {
                        const docId = uuidv4();
                        docIdMap[fname as string] = docId;
                        console.log(`Creating fallback document entry for ${fname}`);
                        await (supabase as any)
                          .from("documents")
                          .insert({
                            id: docId,
                            collection_id: task.collection_id,
                            owner_id: task.owner_id,
                            title: String(fname),
                            source: task.file_path,
                            content: `Chunks for ${fname}`,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            metadata: {
                              task_id: task.task_id,
                              ingested_from: "hybrid_chunking",
                              embedding_status: "pending",
                              dummy: true
                            }
                          });
                      }
                    }

                    // B. Chunks Mapping
                    const chunksToInsert = chunksFromGorbit
                      .filter((chunk: any) => chunk.text && chunk.text.trim()) // content cannot be empty
                      .map((chunk: any) => {
                        const documentId = docIdMap[chunk.filename] || Object.values(docIdMap)[0];

                        return {
                          id: uuidv4(),
                          document_id: documentId,
                          content: chunk.text,
                          chunk_index: chunk.chunk_index,
                          token_count: chunk.num_tokens || 0,
                          metadata: {
                            ...chunk.metadata,
                            headings: chunk.headings,
                            captions: chunk.captions,
                            page_numbers: chunk.page_numbers,
                            filename: chunk.filename,
                            task_id: task.task_id
                          }
                        };
                      })
                      .filter((c: any) => c.document_id); // final safety check for NOT NULL constraint

                    if (chunksToInsert.length > 0) {
                      console.log(`Inserting ${chunksToInsert.length} chunks...`);
                      const { error: chunkError } = await (supabase as any)
                        .from("chunks")
                        .insert(chunksToInsert);

                      if (chunkError) {
                        console.error("Error inserting chunks batch:", chunkError);
                        // Fallback to individual inserts if batch fails
                        for (const chunk of chunksToInsert) {
                          const { error: singleError } = await (supabase as any).from("chunks").insert(chunk);
                          if (singleError) console.error("Failed to insert single chunk:", singleError);
                        }
                      }
                    }

                    ingested = true;
                    console.log(`Ingestion complete for task ${task.task_id}: ${Object.keys(docIdMap).length} docs, ${chunksToInsert.length} chunks.`);

                    // 4. Trigger Embedding for each ingested document
                    for (const docId of Object.values(docIdMap)) {
                      try {
                        const embedUrl = getApiUrlOrThrow();
                        embedUrl.pathname = `/collections/${task.collection_id}/documents/${docId}/embed`;

                        console.log(`Triggering auto-embedding for doc ${docId} at ${embedUrl.toString()}`);

                        fetch(embedUrl.toString(), {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${session.accessToken}`,
                          },
                        }).then(async (resp) => {
                          if (resp.ok) {
                            // Fetch existing to preserve other metadata
                            const { data: currentDoc } = await (supabase as any)
                              .from("documents")
                              .select("metadata")
                              .eq("id", docId)
                              .single();

                            await (supabase as any)
                              .from("documents")
                              .update({
                                metadata: {
                                  ...(currentDoc?.metadata || {}),
                                  embedding_status: "completed"
                                }
                              })
                              .eq("id", docId);
                          }
                        }).catch(e => console.error(`Embedding trigger failed for ${docId}:`, e));
                      } catch (err) {
                        console.error("Failed to trigger embedding for doc:", docId, err);
                      }
                    }

                    // 5. Refresh document list
                    const updatedDocs = await listDocuments(task.collection_id);
                    setDocuments(updatedDocs);
                  } catch (ingestError) {
                    console.error("Ingestion failed:", ingestError);
                  }
                }

                // 3. Update task status and state in our DB
                await ((supabase as any)
                  .from("hybrid_chunking_tasks")
                  .update({
                    status: newStatus,
                    metadata: {
                      ...task.metadata,
                      last_sync: new Date().toISOString(),
                      gorbit_response: gorbitStatusData,
                      gorbit_result: gorbitResultData,
                      ingested: ingested
                    }
                  } as any)
                  .eq("task_id", task.task_id));
              }
            }
          } catch (err) {
            console.error(`Failed to sync task ${task.task_id}:`, err);
          }
        });
      }

      return tasks;
    }, [session]),

    getTaskStatus: useCallback(async (taskId: string) => {
      const gorbitUrl = `http://gorbit:5001/v1/status/poll/${taskId}`;

      const response = await fetch(gorbitUrl, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch task status: ${response.statusText}`);
      }

      return await response.json();
    }, [session]),

    getTaskResult: useCallback(async (taskId: string) => {
      const gorbitUrl = `http://gorbit:5001/v1/result/${taskId}`;

      const response = await fetch(gorbitUrl, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch task result: ${response.statusText}`);
      }

      return await response.json();
    }, [session]),

    deleteHybridChunkingTask: useCallback(async (taskId: string) => {
      const { getSupabaseClient } = await import("@/lib/auth/supabase-client");
      const supabase = getSupabaseClient();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("hybrid_chunking_tasks")
        .delete()
        .eq("task_id", taskId);

      if (error) throw error;
      toast.success("Task deleted successfully");
    }, []),

    clearRunningTasks: useCallback(async () => {
      if (!session?.accessToken) throw new Error("Not authenticated");
      const gorbitUrl = "http://gorbit:5001/v1/clear/converters";

      const response = await fetch(gorbitUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to clear running tasks: ${response.statusText}`);
      }
      toast.success("Running tasks cleared");
    }, [session]),

    clearResults: useCallback(async () => {
      if (!session?.accessToken) throw new Error("Not authenticated");
      const gorbitUrl = "http://gorbit:5001/v1/clear/results";

      const response = await fetch(gorbitUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to clear results: ${response.statusText}`);
      }
      toast.success("Processing results cleared");
    }, [session]),

    getDoclingSettings,
    updateDoclingSettings,
  };
}
