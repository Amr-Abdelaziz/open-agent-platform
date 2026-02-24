"use client";

import { useState, DragEvent, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/providers/Language";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FileUp, X, Sparkles, Languages, Eye, RefreshCw } from "lucide-react";
import { useRagContext } from "../providers/RAG";
import { useOllama } from "@/hooks/use-ollama";
import { toast } from "sonner";
import { OllamaModelInfo } from "@/types/ollama";

export function DocumentConverter() {
    const { t } = useLanguage();
    const {
        selectedCollection,
        handleGraniteConversion,
        documentsLoading,
    } = useRagContext();

    const { discoverModels } = useOllama();

    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Vision model selection state
    const [ollamaModels, setOllamaModels] = useState<OllamaModelInfo[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [modelsLoading, setModelsLoading] = useState(false);

    const fetchModels = useCallback(async () => {
        setModelsLoading(true);
        try {
            const data = await discoverModels();
            if (data?.models) {
                // Include all models (vision + general) so the user has full choice
                setOllamaModels(data.models);
                // Auto-select the first vision-capable model only if nothing chosen yet
                const visionModels = data.models.filter((m) =>
                    m.capabilities?.includes("vision") ||
                    m.name.toLowerCase().includes("vision") ||
                    m.name.toLowerCase().includes("llava") ||
                    m.name.toLowerCase().includes("minicpm") ||
                    m.name.toLowerCase().includes("qwen") ||
                    m.name.toLowerCase().includes("granite"),
                );
                const firstModel = visionModels[0] ?? data.models[0];
                if (firstModel) {
                    // Use functional updater so we don't need selectedModel in deps
                    setSelectedModel((prev) => prev || firstModel.name);
                }
            }
        } catch {
            // silently ignore — user can still convert with the default model
        } finally {
            setModelsLoading(false);
        }
    }, [discoverModels]);

    useEffect(() => {
        fetchModels();
    }, [fetchModels]);

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
            toast.warning(t('some_files_filtered_supported'), { richColors: true });
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
            toast.error(t('select_collection_first'), { richColors: true });
            return;
        }
        if (stagedFiles.length === 0) {
            toast.error(t('no_files_staged'), { richColors: true });
            return;
        }

        setIsUploading(true);

        // Convert File[] to FileList
        const dataTransfer = new DataTransfer();
        stagedFiles.forEach((file) => dataTransfer.items.add(file));
        const fileList = dataTransfer.files;

        try {
            await handleGraniteConversion(
                fileList,
                selectedCollection.uuid,
                selectedModel || undefined,
            );
            setStagedFiles([]);
        } catch (error) {
            // Error handled in hook
        } finally {
            setIsUploading(false);
        }
    };

    // Partition models into vision-capable and others for the selector
    const visionModels = ollamaModels.filter(
        (m) =>
            m.capabilities?.includes("vision") ||
            m.name.toLowerCase().includes("vision") ||
            m.name.toLowerCase().includes("llava") ||
            m.name.toLowerCase().includes("minicpm") ||
            m.name.toLowerCase().includes("qwen") ||
            m.name.toLowerCase().includes("granite"),
    );
    const otherModels = ollamaModels.filter((m) => !visionModels.includes(m));

    return (
        <Card className="glass-card neon-border-purple border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="size-24" />
            </div>
            <CardHeader className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <Languages className="size-5 text-primary" />
                    <CardTitle className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {t('ai_document_converter')}
                    </CardTitle>
                </div>
                <CardDescription className="text-foreground/50 font-medium">
                    {t('high_fidelity_document_understanding')}
                </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6">

                {/* Vision Model Selector */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                            <Eye className="size-3.5 text-primary/70" />
                            {t('vision_model')}
                        </Label>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 hover:bg-primary/20 rounded-md transition-all active:scale-90"
                            onClick={fetchModels}
                            disabled={modelsLoading}
                            title={t('refresh')}
                        >
                            <RefreshCw className={`size-3 text-primary/70 ${modelsLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>

                    <Select
                        value={selectedModel}
                        onValueChange={setSelectedModel}
                        disabled={modelsLoading || ollamaModels.length === 0}
                    >
                        <SelectTrigger className="w-full bg-primary/5 border-primary/20 hover:border-primary/40 transition-colors text-sm font-medium">
                            <SelectValue
                                placeholder={
                                    modelsLoading
                                        ? t('loading')
                                        : ollamaModels.length === 0
                                            ? t('no_models_available')
                                            : t('select_vision_model')
                                }
                            />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-primary/20">
                            {visionModels.length > 0 && (
                                <>
                                    <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary/60">
                                        {t('vision_capable')}
                                    </div>
                                    {visionModels.map((model) => (
                                        <SelectItem key={model.name} value={model.name}>
                                            <div className="flex items-center gap-2">
                                                <Eye className="size-3 text-primary/60 flex-shrink-0" />
                                                <span>{model.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </>
                            )}
                            {otherModels.length > 0 && (
                                <>
                                    <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">
                                        {t('other_models')}
                                    </div>
                                    {otherModels.map((model) => (
                                        <SelectItem key={model.name} value={model.name}>
                                            {model.name}
                                        </SelectItem>
                                    ))}
                                </>
                            )}
                        </SelectContent>
                    </Select>

                    {selectedModel && (
                        <p className="text-[11px] text-muted-foreground/70 italic">
                            {t('using_model')}: <span className="font-mono text-primary/80">{selectedModel}</span>
                        </p>
                    )}
                </div>

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
                        {t('drag_drop_images_pdfs')}
                    </p>
                    <p className="text-muted-foreground mb-4 text-xs italic">
                        {t('supported_formats_converter')}
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
                            <span>{t('select_files')}</span>
                        </Button>
                    </Label>
                </div>

                {stagedFiles.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                                {t('staged_files')} <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px]">{stagedFiles.length}</span>
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => setStagedFiles([])}
                            >
                                {t('clear_all')}
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
                                    {t('processing')}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4" />
                                    {selectedModel
                                        ? `${t('convert_with_vision_model')}: ${selectedModel}`
                                        : t('convert_with_granite_vision')}
                                </div>
                            )}
                        </Button>
                    </div>
                )}

                {!selectedCollection && (
                    <div className="text-center py-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <p className="text-amber-500 text-sm font-medium">
                            {t('select_collection_enable_conversion')}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
