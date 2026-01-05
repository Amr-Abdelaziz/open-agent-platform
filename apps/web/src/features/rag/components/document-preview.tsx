"use client";

import React, { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRagContext } from "../providers/RAG";
import { ApiDocument } from "../hooks/use-rag";
import { MarkdownText } from "@/components/ui/markdown-text";
import { FileText, Eye, Loader2, Download, Copy, Check, Database, File as FileIcon, Printer } from "lucide-react";
import { toast } from "sonner";

interface DocumentPreviewProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    document: ApiDocument | null;
    collectionId: string;
    defaultTab?: string;
}

export function DocumentPreview({
    isOpen,
    onOpenChange,
    document,
    collectionId,
    defaultTab = "raw",
}: DocumentPreviewProps) {
    const { getDocumentChunks } = useRagContext();
    const [content, setContent] = useState<string>("");
    const [chunks, setChunks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("raw");

    useEffect(() => {
        if (isOpen && document && collectionId) {
            loadDocumentContent();
            if (defaultTab) {
                setActiveTab(defaultTab);
            }
        } else {
            setContent("");
            setChunks([]);
        }
    }, [isOpen, document, collectionId, defaultTab]);

    const loadDocumentContent = async () => {
        if (!document || !collectionId) return;
        setLoading(true);
        try {
            // Use file_id from metadata if available, else document.id
            const fileId = document.metadata?.file_id || document.id;
            const chunks = await getDocumentChunks(collectionId, fileId);

            // Sort chunks by index if possible
            const sortedChunks = chunks.sort((a, b) => {
                const indexA = a.metadata?.index ?? 0;
                const indexB = b.metadata?.index ?? 0;
                return indexA - indexB;
            });

            setChunks(sortedChunks);
            const fullText = sortedChunks.map(chunk => chunk.page_content || chunk.content || "").join("\n\n");
            setContent(fullText);
        } catch (error) {
            console.error("Error loading document content:", error);
            toast.error("Failed to load document content");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard");
    };

    const handleDownload = () => {
        if (activeTab === "pdf") {
            if (document?.source?.startsWith("http")) {
                window.open(document.source, "_blank");
            } else {
                handlePrint();
            }
            return;
        }

        let mimeType = "text/plain";
        let extension = ".txt";
        let downloadContent = content;

        if (activeTab === "markdown") {
            mimeType = "text/markdown";
            extension = ".md";
        } else if (activeTab === "chunks") {
            mimeType = "application/json";
            extension = ".json";
            downloadContent = JSON.stringify(chunks, null, 2);
        }

        const blob = new Blob([downloadContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement("a");
        a.href = url;

        // Remove existing extension if present
        const baseName = (document?.title || document?.metadata?.name || "document").replace(/\.[^/.]+$/, "");
        a.download = `${baseName}${extension}`;

        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Downloaded as ${activeTab.toUpperCase()}`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full flex flex-col h-full bg-background/95 backdrop-blur-sm border-l border-border/50">
                <SheetHeader className="pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <FileText className="size-5" />
                        </div>
                        <div className="flex flex-col">
                            <SheetTitle className="truncate max-w-[400px]">
                                {document?.title || document?.metadata?.name || "Document Preview"}
                            </SheetTitle>
                            <SheetDescription>
                                Preview the contents of your uploaded document
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-col pt-4 gap-4">
                    <div className="flex items-center justify-between">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
                            <TabsList className="bg-muted/50 p-1">
                                <TabsTrigger value="raw" className="gap-2">
                                    <Eye className="size-3.5" />
                                    Raw
                                </TabsTrigger>
                                <TabsTrigger value="markdown" className="gap-2">
                                    <FileText className="size-3.5" />
                                    Markdown
                                </TabsTrigger>
                                <TabsTrigger value="pdf" className="gap-2">
                                    <FileIcon className="size-3.5" />
                                    PDF
                                </TabsTrigger>
                                <TabsTrigger value="chunks" className="gap-2">
                                    <Database className="size-3.5" />
                                    Chunks ({chunks.length})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={handleCopy} disabled={!content}>
                                {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                            </Button>
                            <Button variant="outline" size="icon" onClick={handlePrint} title="Print as PDF">
                                <Printer className="size-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={handleDownload} disabled={!content}>
                                <Download className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 relative rounded-xl border border-border/50 bg-background/50 overflow-hidden">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] z-10">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="size-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground font-medium italic">Assembling document chunks...</p>
                                </div>
                            </div>
                        ) : null}

                        <ScrollArea className="h-full w-full p-6">
                            <div className="max-w-full">
                                <Tabs value={activeTab} className="h-full">
                                    <TabsContent value="raw" className="mt-0 focus-visible:outline-none">
                                        <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/80">
                                            {content || (loading ? "" : "No content available.")}
                                        </pre>
                                    </TabsContent>
                                    <TabsContent value="markdown" className="mt-0 focus-visible:outline-none h-full">
                                        <MarkdownText className="prose-sm dark:prose-invert">
                                            {content || (loading ? "" : "No content available.")}
                                        </MarkdownText>
                                    </TabsContent>
                                    <TabsContent value="pdf" className="mt-0 focus-visible:outline-none h-full">
                                        {document?.source?.startsWith("http") ? (
                                            <iframe
                                                src={document.source}
                                                className="w-full h-[600px] rounded-lg border border-border/50 shadow-inner"
                                                title="PDF Preview"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center py-8">
                                                <div id="printable-document" className="w-full max-w-[90%] bg-white dark:bg-zinc-900 border border-border/10 shadow-2xl rounded-sm min-h-[700px] p-12 text-zinc-800 dark:text-zinc-200 font-serif leading-relaxed text-base overflow-visible relative print:shadow-none print:max-w-none print:p-0">
                                                    {/* PDF Page Header Decor */}
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
                                                    <div className="flex justify-between items-start mb-12 opacity-50 text-[10px] uppercase tracking-widest font-sans">
                                                        <span>{document?.title || "Document"}</span>
                                                        <span>Page 1 / 1</span>
                                                    </div>

                                                    <h1 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
                                                        {document?.title || document?.metadata?.name || "Document Title"}
                                                    </h1>

                                                    <div className="space-y-6 whitespace-pre-wrap">
                                                        {content || "No content available for PDF generation."}
                                                    </div>

                                                    <div className="mt-20 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-600 font-sans uppercase tracking-widest flex justify-between">
                                                        <span>Generated Preview</span>
                                                        <span>LangConnect RAG</span>
                                                    </div>
                                                </div>
                                                <p className="mt-6 text-xs text-muted-foreground italic bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                                                    Showing a generated high-fidelity layout. Original PDF source not directly accessible.
                                                </p>
                                            </div>
                                        )}
                                    </TabsContent>
                                    <TabsContent value="chunks" className="mt-0 focus-visible:outline-none">
                                        <div className="space-y-4">
                                            {chunks.length > 0 ? (
                                                chunks.map((chunk, idx) => (
                                                    <div key={idx} className="p-4 rounded-lg border border-border/50 bg-muted/30 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/80 px-2 py-0.5 rounded">
                                                                Chunk #{idx + 1}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {(chunk.page_content || chunk.content || "").length} characters
                                                            </span>
                                                        </div>
                                                        <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                                            {chunk.page_content || chunk.content}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic text-center py-8">
                                                    {loading ? "" : "No chunks discovered for this document."}
                                                </p>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
