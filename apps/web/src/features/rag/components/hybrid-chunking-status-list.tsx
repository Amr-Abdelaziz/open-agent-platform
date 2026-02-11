"use client";

import React, { useEffect, useState } from "react";
import { useRagContext } from "../providers/RAG";
import { HybridChunkingTask } from "../hooks/use-rag";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, FileText, Clock, AlertCircle, CheckCircle2, Trash2, StopCircle, Eraser } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HybridChunkingStatusListProps {
    collectionId: string;
}

export function HybridChunkingStatusList({ collectionId }: HybridChunkingStatusListProps) {
    const { listHybridChunkingTasks, deleteHybridChunkingTask, clearRunningTasks, clearResults } = useRagContext();
    const [tasks, setTasks] = useState<HybridChunkingTask[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTasks = async (silent = false) => {
        if (!collectionId) return;
        if (!silent) setLoading(true);
        try {
            const data = await listHybridChunkingTasks(collectionId);
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch hybrid chunking tasks:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Are you sure you want to delete this task record from the database?")) return;
        try {
            await deleteHybridChunkingTask(taskId);
            setTasks(prev => prev.filter(t => t.task_id !== taskId));
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    };

    const handleClearConverters = async () => {
        if (!confirm("Are you sure you want to stop all running conversion tasks?")) return;
        try {
            await clearRunningTasks();
            fetchTasks();
        } catch (error) {
            console.error("Failed to clear converters:", error);
        }
    };

    const handleClearResults = async () => {
        if (!confirm("Are you sure you want to clear all processing results from memory?")) return;
        try {
            await clearResults();
            fetchTasks();
        } catch (error) {
            console.error("Failed to clear results:", error);
        }
    };

    useEffect(() => {
        fetchTasks();
        // Poll every 3 seconds to catch status updates and new tasks silently
        const interval = setInterval(() => {
            fetchTasks(true);
        }, 3000);

        return () => clearInterval(interval);
    }, [collectionId]);

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        switch (s) {
            case "completed":
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 py-1 px-2.5">
                        <CheckCircle2 className="size-3" />
                        Completed
                    </Badge>
                );
            case "failed":
                return (
                    <Badge variant="destructive" className="gap-1.5 py-1 px-2.5">
                        <AlertCircle className="size-3" />
                        Failed
                    </Badge>
                );
            case "processing":
            case "pending":
                return (
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse gap-1.5 py-1 px-2.5">
                        <RefreshCcw className="size-3 animate-spin" />
                        {s === "processing" ? "Processing" : "Pending"}
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (!collectionId) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-md">
                        <FileText className="size-4 text-blue-500" />
                    </div>
                    <h4 className="text-sm font-black tracking-tight uppercase">Conversion Tasks</h4>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearConverters}
                        className="h-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 gap-1.5 text-[10px] font-bold uppercase"
                    >
                        <StopCircle className="size-3.5" />
                        Stop All
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearResults}
                        className="h-8 text-pink-500 hover:text-pink-600 hover:bg-pink-500/10 gap-1.5 text-[10px] font-bold uppercase"
                    >
                        <Eraser className="size-3.5" />
                        Clear Results
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => fetchTasks()} disabled={loading} className="h-8 group text-blue-500">
                        <RefreshCcw className={`size-3.5 mr-1.5 transition-transform group-hover:rotate-180 duration-500 ${loading ? 'animate-spin' : ''}`} />
                        Sync
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[350px] -mx-4 px-4">
                <div className="rounded-xl border border-white/5 bg-background/20 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-white/5 bg-white/5">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-1/2">File Asset</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timeline</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right border-none">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                            <Clock className="size-8 stroke-[1]" />
                                            <p className="text-xs font-bold uppercase tracking-tighter">No active conversion threads</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tasks.map((task) => (
                                    <TableRow key={task.task_id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col gap-0.5 max-w-[200px]">
                                                <span className="text-xs font-bold truncate text-foreground/80 group-hover:text-blue-500 transition-colors">
                                                    {task.file_path.split("/").pop()}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground font-mono truncate opacity-60">
                                                    {task.file_path}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {task.status.toLowerCase() === "completed" && task.metadata?.gorbit_result && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="View Result JSON"
                                                        onClick={() => {
                                                            console.log("Task Result:", task.metadata?.gorbit_result);
                                                            alert("Result collected and stored in DB. Check console for full JSON.\n\nChunks: " + (task.metadata?.gorbit_result?.chunks?.length || 0));
                                                        }}
                                                    >
                                                        <FileText className="size-3.5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={() => handleDeleteTask(task.task_id)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>
        </div>
    );
}
