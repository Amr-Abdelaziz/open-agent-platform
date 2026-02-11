"use client";

import React from "react";
import { HybridChunkingOptions } from "../hooks/use-rag";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings2, Cpu, Layers, Image as ImageIcon, Binary, ChevronDown, Loader2, Hash, Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOllama } from "@/hooks/use-ollama";
import { OllamaModelInfo } from "@/types/ollama";

interface HybridChunkingSettingsProps {
    options: HybridChunkingOptions;
    onChange: (options: HybridChunkingOptions) => void;
    onSave?: () => void;
    isSaving?: boolean;
}

export function HybridChunkingSettings({ options, onChange, onSave, isSaving }: HybridChunkingSettingsProps) {
    const { discoverModels } = useOllama();
    const [embeddingModels, setEmbeddingModels] = React.useState<OllamaModelInfo[]>([]);
    const [loadingModels, setLoadingModels] = React.useState(false);

    const handleChange = (key: keyof HybridChunkingOptions, value: any) => {
        onChange({ ...options, [key]: value });
    };

    React.useEffect(() => {
        const fetchModels = async () => {
            setLoadingModels(true);
            try {
                const data = await discoverModels();
                if (data?.models) {
                    const models = data.models.filter(m =>
                        m.capabilities.some(c => c.toLowerCase().includes("embed"))
                    );
                    setEmbeddingModels(models);
                }
            } catch (error) {
                console.error("Failed to fetch embedding models:", error);
            } finally {
                setLoadingModels(false);
            }
        };
        fetchModels();
    }, [discoverModels]);

    const Section = ({ title, icon: Icon, children, defaultOpen = false }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean }) => {
        const [isOpen, setIsOpen] = React.useState(defaultOpen);
        return (
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b border-white/5 last:border-0">
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group hover:no-underline">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-foreground/70 group-hover:text-blue-400 transition-colors">
                        <Icon className="size-3.5" />
                        {title}
                    </div>
                    <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pb-4 space-y-4">
                    {children}
                </CollapsibleContent>
            </Collapsible>
        );
    };

    return (
        <div className="space-y-2 py-2">
            <div className="flex items-center gap-2 mb-2">
                <Settings2 className="size-3.5 text-blue-500" />
                <h4 className="text-[11px] font-black uppercase tracking-wider">Processing Config</h4>
            </div>

            <div className="space-y-1">
                {/* Core Settings */}
                <Section title="Core Engine" icon={Cpu} defaultOpen={true}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">PDF Backend</Label>
                            <Select
                                value={options.convert_pdf_backend || "dlparse_v4"}
                                onValueChange={(v) => handleChange("convert_pdf_backend", v)}
                            >
                                <SelectTrigger className="h-7 text-[10px] bg-background/50 border-white/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dlparse_v4">DLParse V4</SelectItem>
                                    <SelectItem value="dlparse_v2">DLParse V2</SelectItem>
                                    <SelectItem value="pypdfium2">PyPdfium2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">Pipeline</Label>
                            <Select
                                value={options.convert_pipeline || "standard"}
                                onValueChange={(v) => handleChange("convert_pipeline", v)}
                            >
                                <SelectTrigger className="h-7 text-[10px] bg-background/50 border-white/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="vlm">VLM Vision</SelectItem>
                                    <SelectItem value="asr">ASR Audio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-medium">Abort on Error</Label>
                        <Switch
                            className="scale-75 origin-right"
                            checked={options.convert_abort_on_error}
                            onCheckedChange={(c) => handleChange("convert_abort_on_error", c)}
                        />
                    </div>
                </Section>

                {/* Page Range */}
                <Section title="Document Range" icon={Hash}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">Start Page</Label>
                            <Input
                                type="number"
                                min={1}
                                value={options.convert_page_range?.[0] || 1}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    const end = options.convert_page_range?.[1] || "9223372036854775807";
                                    handleChange("convert_page_range", [val, end]);
                                }}
                                className="h-7 text-[10px] bg-background/50 border-white/5"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">End Page</Label>
                            <Input
                                type="text"
                                value={options.convert_page_range?.[1] === "9223372036854775807" ? "All" : options.convert_page_range?.[1] || "All"}
                                onChange={(e) => {
                                    const val = e.target.value === "All" || e.target.value === "" ? "9223372036854775807" : e.target.value;
                                    const start = options.convert_page_range?.[0] || 1;
                                    handleChange("convert_page_range", [start, val]);
                                }}
                                className="h-7 text-[10px] bg-background/50 border-white/5"
                            />
                        </div>
                    </div>
                </Section>

                {/* OCR & Vision */}
                <Section title="OCR & Vision" icon={ImageIcon}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">OCR Engine</Label>
                            <Select
                                value={options.convert_ocr_engine || "easyocr"}
                                onValueChange={(v) => handleChange("convert_ocr_engine", v)}
                            >
                                <SelectTrigger className="h-7 text-[10px] bg-background/50 border-white/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="auto">Auto</SelectItem>
                                    <SelectItem value="easyocr">EasyOCR (Default)</SelectItem>
                                    <SelectItem value="ocrmac">OCR Mac</SelectItem>
                                    <SelectItem value="rapidocr">RapidOCR</SelectItem>
                                    <SelectItem value="tesserocr">TesserOCR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">Images</Label>
                            <Select
                                value={options.convert_image_export_mode || "embedded"}
                                onValueChange={(v) => handleChange("convert_image_export_mode", v)}
                            >
                                <SelectTrigger className="h-7 text-[10px] bg-background/50 border-white/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="embedded">Embedded</SelectItem>
                                    <SelectItem value="placeholder">Placeholder</SelectItem>
                                    <SelectItem value="referenced">Referenced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-medium">Enable OCR</Label>
                            <Switch
                                className="scale-75 origin-right"
                                checked={options.convert_do_ocr ?? true}
                                onCheckedChange={(c) => handleChange("convert_do_ocr", c)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-medium">Force OCR</Label>
                            <Switch
                                className="scale-75 origin-right"
                                checked={options.convert_force_ocr}
                                onCheckedChange={(c) => handleChange("convert_force_ocr", c)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-medium">Include Images</Label>
                            <Switch
                                className="scale-75 origin-right"
                                checked={options.convert_include_images ?? true}
                                onCheckedChange={(c) => handleChange("convert_include_images", c)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-medium text-blue-400">Classification</Label>
                            <Switch
                                className="scale-75 origin-right"
                                checked={options.convert_do_picture_classification}
                                onCheckedChange={(c) => handleChange("convert_do_picture_classification", c)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-medium text-pink-500/80">Pic Description</Label>
                            <Switch
                                className="scale-75 origin-right"
                                checked={options.convert_do_picture_description}
                                onCheckedChange={(c) => handleChange("convert_do_picture_description", c)}
                            />
                        </div>
                    </div>
                </Section>

                {/* VLM Models */}
                <Section title="VLM Models" icon={Sparkles}>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">Pipeline Model (Preset)</Label>
                            <Select
                                value={options.convert_vlm_pipeline_model || "none"}
                                onValueChange={(v) => handleChange("convert_vlm_pipeline_model", v === "none" ? null : v)}
                            >
                                <SelectTrigger className="h-7 text-[10px] bg-background/50 border-white/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None / Default</SelectItem>
                                    <SelectItem value="smoldocling">SmolDocling</SelectItem>
                                    <SelectItem value="smoldocling_vllm">SmolDocling VLLM</SelectItem>
                                    <SelectItem value="granite_vision">Granite Vision</SelectItem>
                                    <SelectItem value="granite_vision_vllm">Granite Vision VLLM</SelectItem>
                                    <SelectItem value="granite_vision_ollama">Granite Vision Ollama</SelectItem>
                                    <SelectItem value="got_ocr_2">GOT OCR 2</SelectItem>
                                    <SelectItem value="granite_docling">Granite Docling</SelectItem>
                                    <SelectItem value="granite_docling_vllm">Granite Docling VLLM</SelectItem>
                                    <SelectItem value="deepseekocr_ollama">DeepSeekOCR Ollama</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">VLM Model API</Label>
                            <Input
                                placeholder="Mutually exclusive with preset"
                                value={options.convert_vlm_pipeline_model_api || ""}
                                onChange={(e) => handleChange("convert_vlm_pipeline_model_api", e.target.value)}
                                className="h-7 text-[10px] bg-background/50 border-white/5"
                            />
                        </div>
                    </div>
                </Section>

                <Section title="Layout & Tables" icon={Layers}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">Table Mode</Label>
                            <Select
                                value={options.convert_table_mode || "accurate"}
                                onValueChange={(v) => handleChange("convert_table_mode", v)}
                            >
                                <SelectTrigger className="h-7 text-[10px] bg-background/50 border-white/5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="accurate">Accurate</SelectItem>
                                    <SelectItem value="fast">Fast</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">Doc Scale</Label>
                            <Input
                                type="number"
                                step="0.5"
                                value={options.convert_images_scale || 2.0}
                                onChange={(e) => handleChange("convert_images_scale", parseFloat(e.target.value))}
                                className="h-7 text-[10px] bg-background/50 border-white/5"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-medium">Extract Tables</Label>
                            <Switch
                                className="scale-75 origin-right"
                                checked={options.convert_do_table_structure ?? true}
                                onCheckedChange={(c) => handleChange("convert_do_table_structure", c)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-medium">Code Discovery</Label>
                            <Switch
                                className="scale-75 origin-right"
                                checked={options.convert_do_code_enrichment}
                                onCheckedChange={(c) => handleChange("convert_do_code_enrichment", c)}
                            />
                        </div>
                    </div>
                </Section>

                <Section title="Strategy" icon={Binary}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">Tokenizer / Embedding</Label>
                            <Select
                                value={options.chunking_tokenizer || "sentence-transformers/all-MiniLM-L6-v2"}
                                onValueChange={(v) => handleChange("chunking_tokenizer", v)}
                            >
                                <SelectTrigger className="h-7 text-[10px] bg-background/50 border-white/5 font-mono">
                                    <SelectValue placeholder={loadingModels ? "Loading..." : "Select Model"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sentence-transformers/all-MiniLM-L6-v2">
                                        <div className="flex items-center gap-2">
                                            <Binary className="size-3 text-blue-400" />
                                            <span>Default (MiniLM-L6)</span>
                                        </div>
                                    </SelectItem>
                                    {embeddingModels.map((model) => (
                                        <SelectItem key={`${model.instance_url}-${model.name}`} value={model.name}>
                                            <div className="flex items-center gap-2">
                                                <div className="size-1.5 rounded-full bg-emerald-500" />
                                                <span>{model.name}</span>
                                                <span className="text-[8px] opacity-40 uppercase font-mono italic">Ollama</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {loadingModels && (
                                <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground animate-pulse mt-1">
                                    <Loader2 className="size-2.5 animate-spin" />
                                    Synchronizing Ollama models...
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">Max Tokens</Label>
                            <Input
                                type="number"
                                value={options.chunking_max_tokens || 512}
                                onChange={(e) => handleChange("chunking_max_tokens", parseInt(e.target.value))}
                                className="h-7 text-[10px] bg-background/50 border-white/5"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[9px] uppercase font-mono text-muted-foreground/70">Merge Chunks</Label>
                            <div className="flex h-7 items-center justify-end">
                                <Switch
                                    className="scale-75 origin-right"
                                    checked={options.chunking_merge_peers ?? true}
                                    onCheckedChange={(c) => handleChange("chunking_merge_peers", c)}
                                />
                            </div>
                        </div>
                    </div>
                </Section>
            </div>

            {onSave && (
                <div className="pt-4 mt-2 border-t border-white/5">
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="w-full h-8 text-[11px] font-bold uppercase tracking-wider gap-2 bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                    >
                        {isSaving ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <Save className="size-3.5" />
                        )}
                        {isSaving ? "Saving Configuration..." : "Save Settings to Database"}
                    </Button>
                </div>
            )}
        </div>
    );
}
