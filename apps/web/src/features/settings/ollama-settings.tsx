"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useOllama } from "@/hooks/use-ollama";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, RefreshCw, Server, Cpu, Activity, Database, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OllamaModelInfo } from "@/types/ollama";

export function OllamaSettings() {
    const {
        instances,
        loading,
        fetchInstances,
        createInstance,
        deleteInstance,
        discoverModels,
        checkHealth,
        setEmbeddingModel,
        getActiveEmbedding,
    } = useOllama();

    const [newUrl, setNewUrl] = useState("http://localhost:11434");
    const [newName, setNewName] = useState("");
    const [models, setModels] = useState<OllamaModelInfo[]>([]);
    const [discovering, setDiscovering] = useState(false);
    const [healthStatus, setHealthStatus] = useState<Record<string, any>>({});
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const [activeEmbeddingModel, setActiveEmbeddingModel] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const fetchHealth = useCallback(async () => {
        const data = await checkHealth();
        if (data) {
            setHealthStatus(data);
            setLastChecked(new Date());
        }
    }, [checkHealth]);

    const fetchActiveModel = useCallback(async () => {
        const data = await getActiveEmbedding();
        if (data?.model_name) {
            setActiveEmbeddingModel(data.model_name);
        }
    }, [getActiveEmbedding]);

    useEffect(() => {
        setMounted(true);
        fetchInstances();
        fetchHealth();
        fetchActiveModel();

        // Auto refresh health every minute
        const interval = setInterval(fetchHealth, 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchInstances, fetchHealth]);

    const handleAddInstance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl) {
            toast.error("URL is required");
            return;
        }
        await createInstance({ url: newUrl, name: newName || null });
        setNewUrl("http://localhost:11434");
        setNewName("");
    };

    const handleDiscoverModels = async () => {
        setDiscovering(true);
        const data = await discoverModels();
        if (data) {
            setModels(data.models);
            toast.success(`Discovered ${data.total_count} models from ${data.instances_checked} instances`);
        }
        await fetchHealth();
        await fetchActiveModel();
        setDiscovering(false);
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-10 container mx-auto py-8">
            <div className="flex items-center justify-between glass-card p-6 rounded-2xl neon-border-pink relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-xl neon-border-pink">
                        <Cpu className="size-8 text-accent drop-shadow-[0_0_15px_rgba(var(--accent),0.5)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
                            Model Management
                        </h1>
                        <p className="text-foreground/50 font-medium">Configure and synchronize your orbital processing units</p>
                    </div>
                </div>
            </div>

            {/* Instances Management */}
            <Card className="glass-card neon-border-pink border-none overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Server className="size-48" />
                </div>
                <CardHeader className="relative z-10">
                    <div className="flex items-center gap-2">
                        <Server className="size-5 text-accent" />
                        <CardTitle className="font-black text-xl tracking-tight">Active Nodes</CardTitle>
                    </div>
                    <CardDescription className="text-foreground/60">
                        Synchronize local and remote processing units to the Gorbit network.
                    </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 flex flex-col gap-6">
                    <form onSubmit={handleAddInstance} className="grid gap-4 sm:grid-cols-7">
                        <div className="sm:col-span-3 grid gap-2">
                            <Label htmlFor="ollama-url">Instance URL</Label>
                            <Input
                                id="ollama-url"
                                placeholder="http://localhost:11434"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                className="bg-background/50"
                            />
                        </div>
                        <div className="sm:col-span-3 grid gap-2">
                            <Label htmlFor="ollama-name">Friendly Name (Optional)</Label>
                            <Input
                                id="ollama-name"
                                placeholder="Local Ollama"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="bg-background/50"
                            />
                        </div>
                        <div className="sm:col-span-1 flex items-end">
                            <Button type="submit" className="w-full" disabled={loading}>
                                <Plus className="size-4 mr-2" />
                                Add
                            </Button>
                        </div>
                    </form>

                    <Separator className="my-2" />

                    {instances.length > 0 ? (
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>URL</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {instances.map((instance) => (
                                        <TableRow key={instance.url} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">{instance.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{instance.url}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={instance.is_active ? "default" : "secondary"}>
                                                        {instance.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                    {healthStatus[instance.url] && (
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[10px] gap-1",
                                                                healthStatus[instance.url].status === 'ok'
                                                                    ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
                                                                    : "text-destructive border-destructive/20 bg-destructive/5"
                                                            )}
                                                        >
                                                            <div className={cn("size-1.5 rounded-full animate-pulse",
                                                                healthStatus[instance.url].status === 'ok' ? "bg-emerald-500" : "bg-destructive"
                                                            )} />
                                                            {healthStatus[instance.url].status === 'ok' ? "Healthy" : "Error"}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteInstance(instance.url)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg border-border">
                            <Server className="size-12 mb-2 opacity-20" />
                            <p>No Ollama instances added yet.</p>
                        </div>
                    )}
                </CardContent>
                {instances.length > 0 && lastChecked && (
                    <CardFooter className="py-2 px-6 border-t bg-muted/20">
                        <span className="text-[10px] text-muted-foreground opacity-60 italic">
                            Last heartbeat check: {lastChecked.toLocaleTimeString()}
                        </span>
                    </CardFooter>
                )}
            </Card>

            {/* Models Discovery */}
            <Card className="border-none bg-background/50 backdrop-blur-sm shadow-xl ring-1 ring-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Cpu className="size-5 text-primary" />
                            <CardTitle>Discovered Models</CardTitle>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDiscoverModels}
                            disabled={discovering || instances.length === 0}
                        >
                            <RefreshCw className={`size-4 mr-2 ${discovering ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                    <CardDescription>
                        Models available across all your registered Ollama instances.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-8">
                    {/* Chat Models */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Activity className="size-4 text-primary/70" />
                            <h3 className="text-sm font-semibold tracking-tight">Chat & Completion Models</h3>
                        </div>
                        {models.filter(m => m.capabilities.some(c => c.toLowerCase().includes('chat'))).length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {models.filter(m => m.capabilities.some(c => c.toLowerCase().includes('chat'))).map((model) => (
                                    <ModelCard
                                        key={`${model.instance_url}-${model.name}`}
                                        model={model}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic px-1">No chat models discovered.</p>
                        )}
                    </div>

                    <Separator />

                    {/* Embedding Models */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Database className="size-4 text-primary/70" />
                            <h3 className="text-sm font-semibold tracking-tight">Embedding Models</h3>
                        </div>
                        {models.filter(m => m.capabilities.some(c => c.toLowerCase().includes('embed'))).length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {models.filter(m => m.capabilities.some(c => c.toLowerCase().includes('embed'))).map((model) => (
                                    <ModelCard
                                        key={`${model.instance_url}-${model.name}`}
                                        model={model}
                                        isActive={activeEmbeddingModel === model.name}
                                        onSelect={async () => {
                                            const success = await setEmbeddingModel(model.name, model.instance_url);
                                            if (success) setActiveEmbeddingModel(model.name);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic px-1">No embedding models discovered.</p>
                        )}
                    </div>

                    {models.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg border-border">
                            <Cpu className="size-12 mb-2 opacity-20" />
                            <p>Click refresh to discover models.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function ModelCard({
    model,
    onSelect,
    isActive
}: {
    model: OllamaModelInfo;
    onSelect?: () => Promise<void>;
    isActive?: boolean;
}) {
    const [isSelecting, setIsSelecting] = useState(false);

    const handleSelect = async () => {
        if (!onSelect) return;
        setIsSelecting(true);
        try {
            await onSelect();
        } finally {
            setIsSelecting(false);
        }
    };

    return (
        <div className={cn(
            "p-4 rounded-xl border flex flex-col gap-2 transition-all group relative overflow-hidden",
            isActive
                ? "bg-primary/5 border-primary shadow-lg ring-1 ring-primary/20"
                : "bg-muted/30 border-border hover:border-primary/50"
        )}>
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                {model.capabilities.some(c => c.toLowerCase().includes('embed')) ? <Database className="size-8" /> : <Activity className="size-8" />}
            </div>
            {isActive && (
                <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[8px] uppercase font-bold px-2 py-0.5 rounded-br-lg">
                    Active
                </div>
            )}
            <div className="flex items-center justify-between mt-1">
                <span className="font-semibold text-sm truncate pr-8">{model.name}</span>
                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                    {model.size ? `${(model.size / 1024 / 1024 / 1024).toFixed(1)} GB` : "N/A"}
                </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
                {model.instance_url}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
                {model.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary" className="px-1.5 py-0 text-[9px] uppercase tracking-wider">
                        {cap}
                    </Badge>
                ))}
            </div>

            {onSelect && (
                <div className="mt-auto pt-2">
                    <Button
                        size="sm"
                        variant={isActive ? "secondary" : "outline"}
                        className="w-full text-[10px] h-8 gap-2"
                        disabled={isSelecting || isActive}
                        onClick={handleSelect}
                    >
                        {isSelecting ? (
                            <RefreshCw className="size-3 animate-spin" />
                        ) : isActive ? (
                            <CheckCircle className="size-3" />
                        ) : (
                            <Database className="size-3" />
                        )}
                        {isActive ? "Currently Active" : "Select as Embedding"}
                    </Button>
                </div>
            )}
        </div>
    );
}

