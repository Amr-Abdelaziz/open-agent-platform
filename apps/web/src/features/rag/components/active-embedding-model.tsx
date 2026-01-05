"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useOllama } from "@/hooks/use-ollama";
import { Database, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function ActiveEmbeddingModel() {
    const { getActiveEmbedding } = useOllama();
    const [modelInfo, setModelInfo] = useState<{ model_name: string; instance_url: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    const fetchActive = useCallback(async () => {
        const data = await getActiveEmbedding();
        if (data) {
            setModelInfo(data);
        }
    }, [getActiveEmbedding]);

    useEffect(() => {
        setMounted(true);
        fetchActive();
    }, [fetchActive]);

    if (!mounted || !modelInfo) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 p-2 px-3 glass-card rounded-lg border-primary/30 transition-all hover:neon-border-cyan cursor-help group/trigger">
                        <Database className="size-4 text-secondary drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
                        <span className="text-xs font-bold text-foreground/90 truncate max-w-[150px] tracking-wide">
                            {modelInfo.model_name}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-secondary/50 text-secondary bg-secondary/10 uppercase font-black tracking-tighter shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                            Active
                        </Badge>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Cpu className="size-3 text-muted-foreground" />
                            <p className="text-xs font-medium">Embedding Model Settings</p>
                        </div>
                        <div className="pt-2 space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Model Name</p>
                            <p className="text-xs font-mono">{modelInfo.model_name}</p>

                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-2">Ollama Instance</p>
                            <p className="text-[10px] text-muted-foreground truncate font-mono">{modelInfo.instance_url}</p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
