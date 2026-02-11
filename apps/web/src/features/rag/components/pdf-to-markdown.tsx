"use client";

import React, { useState, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownText } from "@/components/ui/markdown-text";
import { FileUp, X, FileText, Copy, Check, Loader2, Download } from "lucide-react";
import { useRagContext } from "../providers/RAG";
import { toast } from "sonner";

export function PdfToMarkdown() {
    const { getGraniteMarkdownPreview } = useRagContext();
    const [file, setFile] = useState<File | null>(null);
    const [markdown, setMarkdown] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [maxPages, setMaxPages] = useState<number | undefined>(undefined);

    const handleFile = (selectedFile: File | null) => {
        if (!selectedFile) return;
        if (selectedFile.type !== "application/pdf") {
            toast.error("Please select a PDF file", { richColors: true });
            return;
        }
        setFile(selectedFile);
        setMarkdown("");
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            handleFile(event.target.files[0]);
        }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer.files?.[0]) {
            handleFile(event.dataTransfer.files[0]);
        }
    };

    const handleConvert = async () => {
        if (!file) return;
        setLoading(true);
        try {
            console.log("PDF to MD: Starting conversion for", file.name, "Max pages:", maxPages);
            const content = await getGraniteMarkdownPreview(file, maxPages);
            console.log("PDF to MD: Received content length", content?.length);

            if (content) {
                setMarkdown(content);
                toast.success("Conversion successful", { richColors: true });
            } else {
                setMarkdown("");
                toast.warning("Conversion returned empty content");
            }
        } catch (error: any) {
            console.error("PDF to MD Conversion error:", error);
            toast.error(error.message || "Conversion failed");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!markdown) return;
        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard");
    };

    const handleDownload = () => {
        if (!markdown) return;
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${file?.name.replace(".pdf", "") || "document"}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="glass-card border-none overflow-hidden relative h-fit">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <FileText className="size-5 text-blue-400" />
                        <CardTitle className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            PDF to MD Converter
                        </CardTitle>
                    </div>
                    <CardDescription className="text-foreground/50 font-medium">
                        Extract clean markdown from any PDF using Granite Vision.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div
                        className={`flex flex-col items-center rounded-xl border-2 border-dashed p-10 transition-all duration-300 ${isDragging
                            ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                            : "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40"
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="size-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                            <FileUp className="text-blue-400 h-8 w-8" />
                        </div>
                        {file ? (
                            <div className="flex flex-col items-center">
                                <p className="text-foreground font-semibold mb-1">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-4 text-xs text-muted-foreground hover:text-destructive"
                                    onClick={() => { setFile(null); setMarkdown(""); }}
                                >
                                    <X className="mr-2 size-3" />
                                    Change File
                                </Button>
                            </div>
                        ) : (
                            <>
                                <p className="text-foreground/70 mb-2 font-semibold">
                                    Drag and drop a PDF file
                                </p>
                                <Input
                                    type="file"
                                    className="hidden"
                                    id="pdf-md-upload"
                                    onChange={handleFileSelect}
                                    accept=".pdf"
                                />
                                <Label htmlFor="pdf-md-upload">
                                    <Button variant="outline" className="mt-2 border-blue-500/50 hover:bg-blue-500/10" asChild>
                                        <span>Choose File</span>
                                    </Button>
                                </Label>
                            </>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="max-pages" className="text-sm font-medium text-foreground/70">
                            Max Pages to Process (Optional)
                        </Label>
                        <Input
                            id="max-pages"
                            type="number"
                            min={1}
                            placeholder="All pages"
                            className="bg-background/50 border-white/10"
                            value={maxPages || ""}
                            onChange={(e) => setMaxPages(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                    </div>

                    <Button
                        onClick={handleConvert}
                        disabled={!file || loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold h-12 rounded-xl"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="size-4 animate-spin" />
                                Converting...
                            </div>
                        ) : (
                            "Convert to Markdown"
                        )}
                    </Button>
                </CardContent>
            </Card>

            <Card className="glass-card border-none overflow-hidden relative flex flex-col min-h-[500px]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-bold">Preview</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handleCopy} disabled={!markdown}>
                            {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleDownload} disabled={!markdown}>
                            <Download className="size-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-[600px] w-full border-t border-white/5">
                        <div className="p-6">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center py-20">
                                    <Loader2 className="size-8 animate-spin text-blue-400 mb-4" />
                                    <p className="text-muted-foreground animate-pulse">Converting document to markdown...</p>
                                </div>
                            ) : markdown ? (
                                <div className="text-foreground">
                                    <MarkdownText className="prose-sm dark:prose-invert">
                                        {markdown}
                                    </MarkdownText>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-20 text-muted-foreground italic">
                                    <div className="size-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                        <FileText className="size-6 opacity-20" />
                                    </div>
                                    <p>Converted content will appear here</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
