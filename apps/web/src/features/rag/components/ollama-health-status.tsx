"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRagContext } from "../providers/RAG";
import { Server, Activity, CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function OllamaHealthStatus() {
    const { checkOllamaHealth } = useRagContext();
    const [status, setStatus] = useState<"idle" | "checking" | "healthy" | "unhealthy" | "error">("idle");
    const [healthData, setHealthData] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const fetchHealth = useCallback(async () => {
        setStatus("checking");
        try {
            const data = await checkOllamaHealth();
            setHealthData(data);

            // Assume healthy if no errors thrown, but check data if it exists
            if (data && typeof data === 'object' && Object.values(data).some((v: any) => v.status === 'error')) {
                setStatus("unhealthy");
            } else {
                setStatus("healthy");
            }
        } catch (error) {
            console.error("Ollama health check failed:", error);
            setStatus("error");
        }
    }, [checkOllamaHealth]);

    useEffect(() => {
        setMounted(true);
        fetchHealth();

        // Auto refresh every 5 minutes
        const interval = setInterval(fetchHealth, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    if (!mounted) return null;

    return (
        <div className="flex items-center gap-2 p-1 px-2 glass-card rounded-lg border-primary/20 transition-all hover:neon-border-purple group/health shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-2 mr-1 px-1">
                <Server className="size-3.5 text-primary/70 group-hover/health:text-primary transition-colors duration-300" />
                <span className="text-[10px] font-black text-foreground/60 uppercase tracking-widest hidden sm:block">Status</span>
            </div>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-help">
                            {status === "checking" && (
                                <Badge variant="outline" className="animate-pulse gap-1 border-primary/30 bg-primary/5 text-primary text-[10px] h-5">
                                    <Activity className="size-3 animate-spin" />
                                    SYNC
                                </Badge>
                            )}

                            {status === "healthy" && (
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 gap-1 text-[10px] h-5 font-black uppercase tracking-tighter shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                    <CheckCircle className="size-3" />
                                    Live
                                </Badge>
                            )}

                            {status === "unhealthy" && (
                                <Badge variant="destructive" className="bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 gap-1 text-[10px] h-5 font-black uppercase tracking-tighter">
                                    <AlertCircle className="size-3" />
                                    Warn
                                </Badge>
                            )}

                            {status === "error" && (
                                <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/30 gap-1 text-[10px] h-5 font-black uppercase tracking-tighter">
                                    <XCircle className="size-3" />
                                    Fail
                                </Badge>
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-3 glass-card border-primary/20 shadow-2xl">
                        <div className="space-y-2">
                            <p className="font-bold text-sm tracking-tight text-primary">System Health Report</p>
                            {status === "healthy" && (
                                <p className="text-xs text-foreground/80 leading-relaxed">All organization collections are currently synchronized and responsive.</p>
                            )}
                            {status === "unhealthy" && (
                                <div className="space-y-1">
                                    <p className="text-xs text-amber-400 font-bold">Signal Interference Detected:</p>
                                    {healthData && Object.entries(healthData).map(([url, data]: [string, any]) => (
                                        data.status === 'error' && (
                                            <p key={url} className="text-[10px] text-muted-foreground truncate" title={url}>
                                                • {url}: {data.message || 'Transmission failed'}
                                            </p>
                                        )
                                    ))}
                                </div>
                            )}
                            {status === "error" && (
                                <p className="text-xs text-red-400 font-bold leading-relaxed">System critical failure. No active communication channels found.</p>
                            )}
                            <div className="pt-2 border-t border-white/5 mt-2">
                                <p className="text-[10px] font-medium text-muted-foreground italic">Continuous monitoring active...</p>
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Button
                variant="ghost"
                size="icon"
                className="size-6 hover:bg-primary/20 rounded-md transition-all active:scale-90 group/btn"
                onClick={fetchHealth}
                disabled={status === "checking"}
            >
                <RefreshCw className={cn("size-3 text-primary/70 group-hover/btn:text-primary", status === "checking" && "animate-spin")} />
            </Button>
        </div>
    );
}
