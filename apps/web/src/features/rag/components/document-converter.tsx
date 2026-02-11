"use client";

import type React from "react";
import { useState, DragEvent } from "react";
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
import { FileUp, X, Sparkles, Languages } from "lucide-react";
import { useRagContext } from "../providers/RAG";
import { toast } from "sonner";

export function DocumentConverter() {
    const {
        selectedCollection,
        handleGraniteConversion,
        documentsLoading,
    } = useRagContext();

    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFiles = (files: File[] | null) => {
        if (!files?.length) return;

        // Primarily images and PDFs for vision model
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
        ];
        const filteredFiles = files.filter((file) =>
            allowedTypes.includes(file.type),
        );

        if (filteredFiles.length < files.length) {
            toast.warning("Some files were filtered out. Supported: PDF, JPG, PNG, WEBP.", { richColors: true });
        }

        setStagedFiles((prevFiles) => [...prevFiles, ...filteredFiles]);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            handleFiles(Array.from(event.target.files));
        }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);

        if (event.dataTransfer.files) {
            handleFiles(Array.from(event.dataTransfer.files));
        }
    };

    const removeStagedFile = (indexToRemove: number) => {
        setStagedFiles((prevFiles) =>
            prevFiles.filter((_, index) => index !== indexToRemove),
        );
    };

    const handleProcessFiles = async () => {
        if (!selectedCollection) {
            toast.error("Please select a collection first", { richColors: true });
            return;
        }
        if (stagedFiles.length === 0) {
            toast.error("No files staged for processing", { richColors: true });
            return;
        }

        setIsUploading(true);

        // Convert File[] to FileList
        const dataTransfer = new DataTransfer();
        stagedFiles.forEach((file) => dataTransfer.items.add(file));
        const fileList = dataTransfer.files;

        try {
            await handleGraniteConversion(fileList, selectedCollection.uuid);
            setStagedFiles([]);
        } catch (error) {
            // Error handled in hook
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="glass-card neon-border-purple border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="size-24" />
            </div>
            <CardHeader className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <Languages className="size-5 text-primary" />
                    <CardTitle className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        AI Document Converter
                    </CardTitle>
                </div>
                <CardDescription className="text-foreground/50 font-medium">
                    High-fidelity document understanding using IBM Granite Vision models.
                </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">
                <div
                    className={`flex flex-col items-center rounded-xl border-2 border-dashed p-10 transition-all duration-300 ${isDragging
                        ? "neon-border-purple bg-primary/10 scale-[1.01]"
                        : "border-primary/20 bg-primary/5 hover:border-primary/40"
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <FileUp className="text-primary h-8 w-8" />
                    </div>
                    <p className="text-foreground/70 mb-2 font-semibold">
                        Drag and drop images or PDFs here
                    </p>
                    <p className="text-muted-foreground mb-4 text-xs italic">
                        Supports JPG, PNG, WEBP, and PDF
                    </p>
                    <Input
                        type="file"
                        className="hidden"
                        id="granite-file-upload"
                        multiple
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf"
                    />
                    <Label htmlFor="granite-file-upload">
                        <Button
                            variant="outline"
                            className="border-primary/50 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                            asChild
                        >
                            <span>Select Files</span>
                        </Button>
                    </Label>
                </div>

                {stagedFiles.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                                Staged Files <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px]">{stagedFiles.length}</span>
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => setStagedFiles([])}
                            >
                                Clear all
                            </Button>
                        </div>
                        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                            {stagedFiles.map((file, index) => (
                                <li
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 text-sm group hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded bg-background flex items-center justify-center text-[10px] font-bold text-muted-foreground line-clamp-1">
                                            {file.name.split('.').pop()?.toUpperCase()}
                                        </div>
                                        <span className="truncate max-w-[200px] font-medium">{file.name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeStagedFile(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                        <Button
                            onClick={handleProcessFiles}
                            disabled={!selectedCollection || isUploading || documentsLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300 active:scale-95"
                        >
                            {isUploading ? (
                                <div className="flex items-center gap-2">
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4" />
                                    Convert with Granite Vision
                                </div>
                            )}
                        </Button>
                    </div>
                )}

                {!selectedCollection && (
                    <div className="text-center py-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <p className="text-amber-500 text-sm font-medium">
                            Please select a collection to enable conversion
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
