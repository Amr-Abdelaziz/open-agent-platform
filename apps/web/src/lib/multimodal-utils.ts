import type { Base64ContentBlock } from "@langchain/core/messages";
import { toast } from "sonner";
// Returns a Promise of a typed multimodal block for images or PDFs
export async function fileToContentBlock(
  file: File,
): Promise<Base64ContentBlock> {
  const supportedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const supportedFileTypes = [...supportedImageTypes, "application/pdf"];

  if (!supportedFileTypes.includes(file.type)) {
    toast.error(
      `Unsupported file type: ${file.type}. Supported types are: ${supportedFileTypes.join(", ")}`,
    );
    return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
  }

  const data = await fileToBase64(file);

  if (supportedImageTypes.includes(file.type)) {
    return {
      type: "image",
      source_type: "base64",
      mime_type: file.type,
      data,
      metadata: { name: file.name },
    };
  }

  // PDF
  return {
    type: "document" as any,
    source_type: "base64",
    mime_type: "application/pdf",
    data,
    metadata: { filename: file.name },
  };
}

// Converts a PDF to markdown using the RAG API
export async function pdfToMarkdown(
  file: File,
  ragApiUrl: string,
  accessToken: string,
): Promise<string> {
  const url = new URL(ragApiUrl);
  url.pathname = "/documents/markdown";

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to generate markdown: ${response.statusText}`);
  }

  const data = await response.json();
  // Support various response formats:
  // 1. { "filename.pdf": "markdown content" }
  // 2. { "markdown": "content" }
  // 3. { "content": "content" }
  const content = data[file.name] || data.markdown || data.content || data.text || Object.values(data)[0];
  return typeof content === "string" ? content : JSON.stringify(content);
}

// Helper to convert File to base64 string
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isBase64ContentBlock(
  block: unknown,
): block is Base64ContentBlock {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;
  // file or document type (legacy/new)
  if (
    ((block as { type: unknown }).type === "file" ||
      (block as { type: unknown }).type === "document") &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    ((block as { mime_type: string }).mime_type.startsWith("image/") ||
      (block as { mime_type: string }).mime_type === "application/pdf")
  ) {
    return true;
  }
  // image type (new)
  if (
    (block as { type: unknown }).type === "image" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    (block as { mime_type: string }).mime_type.startsWith("image/")
  ) {
    return true;
  }
  return false;
}
