"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Folder, File, ChevronRight, ArrowLeft, Download, Search, RefreshCw, HardDrive, ExternalLink, FileText, Image as ImageIcon, Music, Video, Archive, Eye, File as FileIcon, Trash2, Zap, Upload, Settings2 } from "lucide-react";
import { useRagContext } from "../providers/RAG";
import { HybridChunkingStatusList } from "./hybrid-chunking-status-list";
import { HybridChunkingSettings } from "./hybrid-chunking-settings";
import { HybridChunkingOptions } from "../hooks/use-rag";
import { useAuthContext } from "@/providers/Auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { MarkdownText } from "@/components/ui/markdown-text";
import { Loader2, Copy, Check } from "lucide-react";

interface StorageItem {
    name: string;
    id?: string;
    updated_at?: string;
    created_at?: string;
    last_accessed_at?: string;
    metadata?: any;
}

export function StorageBrowser() {
    const { browseStorage, downloadStorage, deleteStorageFile, startHybridChunking, selectedCollection, uploadToStorage, getDoclingSettings, updateDoclingSettings, getStorageFile } = useRagContext();
    const { user } = useAuthContext();
    const [path, setPath] = useState<string>("");
    const [items, setItems] = useState<StorageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Preview state
    const [previewItem, setPreviewItem] = useState<StorageItem | null>(null);
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [conversionOptions, setConversionOptions] = useState<HybridChunkingOptions>({});
    const [savingSettings, setSavingSettings] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Initialize path with user UUID once user is available
    useEffect(() => {
        if (user?.id && !path) {
            setPath(user.id);
        }
    }, [user, path]);

    // Load persisted docling settings
    useEffect(() => {
        const loadSettings = async () => {
            const savedSettings = await getDoclingSettings();
            if (savedSettings) {
                setConversionOptions(prev => ({
                    ...prev,
                    ...savedSettings
                }));
            }
        };
        loadSettings();
    }, [getDoclingSettings]);

    const handleSettingsChange = useCallback((newOptions: HybridChunkingOptions) => {
        setConversionOptions(newOptions);
    }, []);

    const onSaveSettings = useCallback(async () => {
        setSavingSettings(true);
        try {
            await updateDoclingSettings(conversionOptions);
            toast.success("Settings saved to database");
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setSavingSettings(false);
        }
    }, [updateDoclingSettings, conversionOptions]);

    const fetchItems = useCallback(async (currentPath: string) => {
        if (!currentPath) return;
        setLoading(true);
        try {
            const response = await browseStorage(currentPath);
            const itemsList = Array.isArray(response) ? response : (response.items || []);

            // Sort: folders first, then alphabetical
            const sortedItems = itemsList.sort((a: any, b: any) => {
                const isFolderA = !a.id;
                const isFolderB = !b.id;
                if (isFolderA && !isFolderB) return -1;
                if (!isFolderA && isFolderB) return 1;
                return a.name.localeCompare(b.name);
            });
            setItems(sortedItems);
        } catch (error: any) {
            toast.error("Failed to load storage items", {
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    }, [browseStorage]);

    useEffect(() => {
        fetchItems(path);
    }, [path, fetchItems]);

    const handleNavigate = (itemName: string) => {
        const newPath = path ? `${path}/${itemName}` : itemName;
        setPath(newPath);
    };

    const handleGoBack = () => {
        if (!path || !user?.id || path === user.id) return;
        const parts = path.split("/");
        parts.pop();
        setPath(parts.join("/"));
    };

    const handleDownload = async (itemName: string) => {
        const fullPath = path ? `${path}/${itemName}` : itemName;
        try {
            await downloadStorage(fullPath);
            toast.success(`Downloaded ${itemName}`);
        } catch (error: any) {
            toast.error("Download failed", {
                description: error.message
            });
        }
    };

    const handlePreview = async (item: StorageItem) => {
        setPreviewItem(item);
        setPreviewLoading(true);
        setPreviewContent(null);
        setPreviewUrl(null);

        const fullPath = path ? `${path}/${item.name}` : item.name;
        const ext = item.name.split('.').pop()?.toLowerCase();
        const isPdf = ext === 'pdf';

        try {
            const blob = await getStorageFile(fullPath);

            if (isPdf) {
                const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                setPreviewUrl(url);
            } else {
                const text = await blob.text();
                setPreviewContent(text);
            }
        } catch (error: any) {
            toast.error("Preview failed", {
                description: error.message
            });
            setPreviewItem(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleCopyPreview = () => {
        if (!previewContent) return;
        navigator.clipboard.writeText(previewContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard");
    };

    const handleDelete = async (itemName: string) => {
        const fullPath = path ? `${path}/${itemName}` : itemName;

        try {
            await deleteStorageFile(fullPath);
            toast.success(`Deleted ${itemName}`);
            fetchItems(path);
        } catch (error: any) {
            toast.error("Delete failed", {
                description: error.message
            });
        }
    };

    const handleProcess = async (itemName: string) => {
        if (!selectedCollection) {
            toast.error("Please select a collection first", {
                description: "Documents and chunks need to be stored in a collection."
            });
            return;
        }

        const fullPath = path ? `${path}/${itemName}` : itemName;
        const loadingToast = toast.loading(`Initiating hybrid chunking for ${itemName}...`);

        try {
            await startHybridChunking(selectedCollection.uuid, fullPath, conversionOptions);
            toast.success(`Processing started for ${itemName}`, { id: loadingToast });
        } catch (error: any) {
            toast.error("Process failed", {
                id: loadingToast,
                description: error.message
            });
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!selectedCollection) {
            toast.error("Please select a collection first", {
                description: "Documents and chunks need to be stored in a collection."
            });
            return;
        }

        setUploading(true);
        const loadingToast = toast.loading(`Uploading and initiating conversion for ${file.name}...`);

        try {
            // 1. Upload to storage
            await uploadToStorage(file, path);
            toast.message("Upload successful", { id: loadingToast, description: "Starting conversion..." });

            // 2. Trigger hybrid chunking
            const fullPath = path ? `${path}/${file.name}` : file.name;
            await startHybridChunking(selectedCollection.uuid, fullPath, conversionOptions);

            toast.success(`${file.name} uploaded and conversion started`, { id: loadingToast });
            fetchItems(path);
        } catch (error: any) {
            toast.error("Process failed", {
                id: loadingToast,
                description: error.message
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFileIcon = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext!)) return <ImageIcon className="size-4 text-pink-500" />;
        if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext!)) return <FileText className="size-4 text-blue-500" />;
        if (['mp3', 'wav', 'ogg'].includes(ext!)) return <Music className="size-4 text-purple-500" />;
        if (['mp4', 'webm', 'mov'].includes(ext!)) return <Video className="size-4 text-orange-500" />;
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext!)) return <Archive className="size-4 text-yellow-600" />;
        return <FileIcon className="size-4 text-muted-foreground" />;
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card className="glass-card neon-border-blue border-none overflow-hidden flex flex-col h-full bg-background/20">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <HardDrive className="size-5 text-blue-500" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Storage</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-mono tracking-widest">Global Asset Browser</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSettings(!showSettings)}
                            className={`size-8 rounded-full ${showSettings ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"}`}
                            title="Processing Settings"
                        >
                            <Settings2 className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleUploadClick}
                            disabled={loading || uploading}
                            className="size-8 rounded-full text-blue-500 hover:bg-blue-500/10"
                            title="Upload & Convert"
                        >
                            <Upload className={`size-4 ${uploading ? "animate-bounce" : ""}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchItems(path)}
                            className="size-8 rounded-full"
                            disabled={loading}
                        >
                            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-4 bg-background/40 p-1.5 rounded-lg border border-white/5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleGoBack}
                        disabled={!path || loading}
                        className="size-7"
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div className="flex-1 flex items-center overflow-hidden">
                        <span className="text-[10px] font-mono text-muted-foreground px-2 whitespace-nowrap overflow-hidden text-ellipsis">
                            {path.includes('/') ? `... / ${path.split('/').pop()}` : 'root'}
                        </span>
                    </div>
                </div>

                <div className="relative mt-3">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-background/30 border-white/5 text-xs focus:ring-blue-500/20"
                    />
                </div>

                {showSettings && (
                    <div className="border border-white/10 rounded-lg p-4 bg-black/20 backdrop-blur-sm mb-4">
                        <HybridChunkingSettings
                            options={conversionOptions}
                            onChange={handleSettingsChange}
                            onSave={onSaveSettings}
                            isSaving={savingSettings}
                        />
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden pt-0 mt-4">
                <ScrollArea className="h-[500px] -mx-6 px-6">
                    <div className="space-y-1 pb-4">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-transparent">
                                    <Skeleton className="size-8 rounded-lg" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map((item, idx) => {
                                const isFolder = !item.id;
                                return (
                                    <div
                                        key={idx}
                                        className="group flex items-center justify-between p-3 rounded-xl bg-background/20 border border-white/5 hover:bg-background/40 hover:border-blue-500/20 transition-all cursor-pointer"
                                        onClick={() => isFolder ? handleNavigate(item.name) : null}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`p-2 rounded-lg ${isFolder ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10"}`}>
                                                {isFolder ? <Folder className="size-4" /> : getFileIcon(item.name)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold truncate group-hover:text-blue-500 transition-colors">
                                                    {item.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {isFolder ? (
                                                        <span className="text-[10px] text-muted-foreground uppercase font-mono">Directory</span>
                                                    ) : (
                                                        <>
                                                            <span className="text-[10px] text-muted-foreground uppercase font-mono">
                                                                {item.metadata?.mimetype?.split('/')[1] || "File"}
                                                            </span>
                                                            <div className="size-1 rounded-full bg-border" />
                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                {formatSize(item.metadata?.size)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isFolder ? (
                                                <ChevronRight className="size-4 text-muted-foreground" />
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 rounded-lg text-amber-500 hover:bg-amber-500/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleProcess(item.name);
                                                        }}
                                                        title="Convert & Chunk"
                                                    >
                                                        <Zap className="size-3.5 fill-amber-500/20" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePreview(item);
                                                        }}
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 rounded-lg text-blue-500 hover:bg-blue-500/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(item.name);
                                                        }}
                                                    >
                                                        <Download className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 rounded-lg text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(item.name);
                                                        }}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30">
                                <Search className="size-12 mb-4 stroke-[1]" />
                                <p className="text-sm font-bold tracking-tight">Empty Workspace</p>
                                <p className="text-[10px] uppercase font-mono">No matching records found</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

            <Sheet open={!!previewItem} onOpenChange={(open) => {
                if (!open) {
                    setPreviewItem(null);
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                }
            }}>
                <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col h-full bg-background/95 backdrop-blur-sm border-l border-border/50">
                    <SheetHeader className="pb-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                {previewItem && getFileIcon(previewItem.name)}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <SheetTitle className="truncate pr-8">
                                    {previewItem?.name || "File Preview"}
                                </SheetTitle>
                                <SheetDescription className="text-xs uppercase font-mono tracking-widest flex items-center gap-2">
                                    <span>{previewItem?.metadata?.mimetype || "Asset"}</span>
                                    {previewItem?.metadata?.size && (
                                        <>
                                            <div className="size-1 rounded-full bg-border" />
                                            <span>{formatSize(previewItem.metadata.size)}</span>
                                        </>
                                    )}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-hidden flex flex-col pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none">PREVIEW MODE</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                {previewContent && (
                                    <Button variant="outline" size="icon" onClick={handleCopyPreview} className="size-8">
                                        {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => previewItem && handleDownload(previewItem.name)}
                                >
                                    <Download className="size-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 relative rounded-xl border border-border/50 bg-background/50 overflow-hidden min-h-0">
                            {previewLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] z-10">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="size-8 animate-spin text-emerald-500" />
                                        <p className="text-sm text-muted-foreground font-medium italic">Fetching asset contents...</p>
                                    </div>
                                </div>
                            ) : previewUrl ? (
                                <iframe
                                    src={previewUrl}
                                    className="w-full h-full border-none"
                                    title="PDF Preview"
                                />
                            ) : previewContent ? (
                                <ScrollArea className="h-full w-full p-6">
                                    {previewItem?.name.endsWith('.md') ? (
                                        <MarkdownText className="prose-sm dark:prose-invert">
                                            {previewContent}
                                        </MarkdownText>
                                    ) : (
                                        <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/80">
                                            {previewContent}
                                        </pre>
                                    )}
                                </ScrollArea>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 p-12 text-center">
                                    <FileIcon className="size-12 mb-4 stroke-[1]" />
                                    <p className="text-sm font-bold tracking-tight">Preview Not Available</p>
                                    <p className="text-[10px] uppercase font-mono mt-1">This file type cannot be rendered directly</p>
                                </div>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {selectedCollection && (
                <div className="p-6 border-t border-white/5 bg-background/40">
                    <HybridChunkingStatusList collectionId={selectedCollection.uuid} />
                </div>
            )}
        </Card>
    );
}
