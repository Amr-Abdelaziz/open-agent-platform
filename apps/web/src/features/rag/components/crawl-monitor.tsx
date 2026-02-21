"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRag } from "../hooks/use-rag";
import { useLanguage } from "@/providers/Language";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    RefreshCw,
    CheckCircle2,
    Clock,
    AlertCircle,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Activity,
    Server,
    Cpu,
    Database,
    Wifi,
    Globe,
    Zap,
    ZapOff,
    Terminal,
    Bug,
    ShieldCheck,
    BarChart3,
    Trash2,
    RotateCcw,
    XCircle,
    Timer
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
    CrawlMonitorRequest,
    MonitorHealthResponse,
    CrawlMonitorWSMessage,
    MonitorEndpointStatsResponse,
    MonitorLogEntry
} from "../hooks/use-rag";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const safeFormatDistance = (dateStr: string) => {
    try {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "N/A";
        return formatDistanceToNow(date, { addSuffix: true });
    } catch {
        return "N/A";
    }
};

const safeFormatLocale = (dateStr: string, language: string) => {
    try {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "N/A";
        return date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
    } catch {
        return "N/A";
    }
};

const safeFormatTime = (dateStr: string | number) => {
    try {
        if (!dateStr) return "00:00:00";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "00:00:00";
        return date.toLocaleTimeString();
    } catch {
        return "00:00:00";
    }
};

const formatUptimeValue = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
};

export function CrawlMonitor() {
    const {
        forceMonitorCleanup,
        restartBrowser,
        resetMonitorStats
    } = useRag();
    const { t, language } = useLanguage();

    const [activeTasks, setActiveTasks] = useState<CrawlMonitorRequest[]>([]);
    const [completedTasks, setCompletedTasks] = useState<CrawlMonitorRequest[]>([]);
    const [healthData, setHealthData] = useState<MonitorHealthResponse | null>(null);
    const [browsers, setBrowsers] = useState<any[]>([]);
    const [janitorLogs, setJanitorLogs] = useState<MonitorLogEntry[]>([]);
    const [errorLogs, setErrorLogs] = useState<MonitorLogEntry[]>([]);
    const [timelineData, setTimelineData] = useState<CrawlMonitorWSMessage['timeline'] | null>(null);
    const [selectedTask, setSelectedTask] = useState<CrawlMonitorRequest | null>(null);
    const [prevCompletedCount, setPrevCompletedCount] = useState(0);

    const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timelineMetric, setTimelineMetric] = useState<"memory" | "requests" | "browsers">("memory");
    const [statusFilter, setStatusFilter] = useState<"all" | "success" | "errors">("all");

    useEffect(() => {
        let socket: WebSocket | null = null;
        let reconnectTimeout: any = null;

        const connect = () => {
            setWsStatus("connecting");

            const baseUrl = process.env.NEXT_PUBLIC_CRAWL4AI_API_URL || "http://aictserver:11235";
            const wsUrl = baseUrl.replace(/^http/, "ws") + "/monitor/ws";

            try {
                socket = new WebSocket(wsUrl);

                socket.onopen = () => {
                    setWsStatus("connected");
                    setLoading(false);
                };

                socket.onmessage = (event) => {
                    try {
                        const data: CrawlMonitorWSMessage = JSON.parse(event.data);
                        if (data.health) setHealthData(data.health);
                        if (data.requests) {
                            setActiveTasks(Array.isArray(data.requests.active) ? data.requests.active : []);
                            setCompletedTasks(Array.isArray(data.requests.completed) ? data.requests.completed : []);
                        }
                        if (data.browsers && Array.isArray(data.browsers)) setBrowsers(data.browsers);
                        if (data.timeline) setTimelineData(data.timeline);
                        if (data.janitor && Array.isArray(data.janitor)) setJanitorLogs(data.janitor);
                        if (data.errors && Array.isArray(data.errors)) setErrorLogs(data.errors);

                        // Capture generic logs or messages if they arrive in non-standard fields
                        if ((data as any).logs && Array.isArray((data as any).logs)) {
                            setJanitorLogs(prev => [...(data as any).logs, ...prev].slice(0, 50));
                        }
                        if ((data as any).messages && Array.isArray((data as any).messages)) {
                            setJanitorLogs(prev => [...(data as any).messages, ...prev].slice(0, 50));
                        }

                        setError(null);
                        setLoading(false);
                    } catch (e) {
                        console.error("Failed to parse WS message:", e);
                    }
                };

                socket.onclose = () => {
                    setWsStatus("disconnected");
                    reconnectTimeout = setTimeout(connect, 5000);
                };

                socket.onerror = (err) => {
                    console.warn("WebSocket error:", err);
                    setWsStatus("disconnected");
                };
            } catch (err) {
                console.error("WebSocket connection failure:", err);
                setWsStatus("disconnected");
                reconnectTimeout = setTimeout(connect, 5000);
            }
        };

        connect();

        return () => {
            if (socket) socket.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, []);

    const handleCleanup = async () => {
        try {
            await forceMonitorCleanup();
            toast.success("Cleanup triggered successfully");
        } catch (err: any) {
            toast.error(`Cleanup failed: ${err.message}`);
        }
    };

    const handleRestartPermanent = async () => {
        try {
            const permBrowser = browsers.find(b => b.type === 'permanent');
            if (permBrowser) {
                await restartBrowser(permBrowser.sig);
                toast.success("Permanent browser restart triggered");
            } else {
                toast.error("No permanent browser found to restart");
            }
        } catch (err: any) {
            toast.error(`Restart failed: ${err.message}`);
        }
    };

    const handleResetStats = async () => {
        try {
            await resetMonitorStats();
            toast.success("Monitor stats reset");
        } catch (err: any) {
            toast.error(`Reset failed: ${err.message}`);
        }
    };

    // Effect to notify on task completion
    useEffect(() => {
        if (completedTasks.length > prevCompletedCount) {
            const newTasks = completedTasks.slice(0, completedTasks.length - prevCompletedCount);
            newTasks.forEach(task => {
                const taskId = (task.task_id || (task as any).id || (task as any).taskId)?.slice(0, 8) || 'Unknown';
                if (task.status === 'completed' || (!task.error && task.result)) {
                    toast.success(`Task ${taskId} completed successfully!`, {
                        description: task.url
                    });
                } else if (task.error) {
                    toast.error(`Task ${taskId} failed`, {
                        description: task.error
                    });
                }
            });
            setPrevCompletedCount(completedTasks.length);
        }
    }, [completedTasks, prevCompletedCount]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white space-y-4">
                <RefreshCw className="w-12 h-12 animate-spin text-cyan-500" />
                <p className="text-cyan-500 font-mono tracking-widest uppercase animate-pulse">Initializing Monitor Systems...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#000000] text-[#00FFFF] font-mono p-4 selection:bg-cyan-500 selection:text-black">
            {/* System Health Bar */}
            <div className="mb-6 bg-black/40 border-b border-cyan-900/30 pb-4 px-1 font-mono text-[10px] uppercase tracking-wider">
                <div className="text-cyan-400 font-bold mb-3 flex items-center gap-2 text-[12px]">
                    System Health
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-center">
                    {/* CPU */}
                    <div className="space-y-1.5 flex flex-col">
                        <div className="flex justify-between items-center text-gray-500">
                            <span>CPU</span>
                            <span className="text-cyan-400 font-bold">{healthData?.container.cpu_percent.toFixed(1) || "0.0"}%</span>
                        </div>
                        <div className="h-1 bg-gray-900/50 rounded-full overflow-hidden border border-gray-800/50 flex-1">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${healthData?.container.cpu_percent || 0}%` }}
                                className="h-full bg-cyan-600/80 shadow-[0_0_8px_rgba(0,255,255,0.3)]"
                            />
                        </div>
                    </div>

                    {/* Memory */}
                    <div className="space-y-1.5 flex flex-col">
                        <div className="flex justify-between items-center text-gray-500">
                            <span>Memory</span>
                            <span className="text-cyan-400 font-bold">{healthData?.container.memory_percent.toFixed(1) || "0.0"}%</span>
                        </div>
                        <div className="h-1 bg-gray-900/50 rounded-full relative border border-gray-800/50 flex-1">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${healthData?.container.memory_percent || 0}%` }}
                                className="h-full bg-gray-700/50"
                            />
                            <motion.div
                                animate={{ left: `${healthData?.container.memory_percent || 0}%` }}
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_8px_#FF00FF] -translate-x-1/2 cursor-default"
                            />
                        </div>
                    </div>

                    {/* Network */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-gray-500">Network</span>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-gray-300">
                                <span className="text-cyan-500">↑</span>
                                <span className="font-bold">{healthData?.container.network_sent_mb.toFixed(1) || "0.0"} MB</span>
                            </div>
                            <span className="text-cyan-900">/</span>
                            <div className="flex items-center gap-1 text-gray-300">
                                <span className="text-cyan-500">↓</span>
                                <span className="font-bold">{healthData?.container.network_recv_mb.toFixed(1) || "0.0"} MB</span>
                            </div>
                        </div>
                    </div>

                    {/* Uptime */}
                    <div className="flex flex-col gap-1.5">
                        <span className="text-gray-500">Uptime</span>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-200 font-bold">{formatUptimeValue(healthData?.container.uptime_seconds || 0)}</span>
                        </div>
                    </div>

                    {/* Live Clock */}
                    <div className="flex flex-col gap-1.5 items-end ml-auto">
                        <span className="text-gray-500">Live Status</span>
                        <div className="flex items-center gap-2 bg-cyan-950/20 px-2 py-0.5 border border-cyan-900/30">
                            <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-cyan-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-cyan-400 font-bold tabular-nums">
                                {new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Previous Top Bar Stats (Integrated or Removed) */}
            <div className="flex flex-wrap items-center gap-6 mb-6 pb-2 border-b border-cyan-900/10 text-[10px] uppercase tracking-tighter">
                <div className="flex items-center gap-2">
                    <Zap className={`w-3 h-3 ${healthData?.pool.permanent.active ? "text-orange-500 fill-orange-500" : "text-gray-600"}`} />
                    <span className="text-gray-500">Pool Storage:</span>
                    <span className={healthData?.pool.permanent.active ? "text-cyan-400" : "text-gray-600"}>
                        {healthData?.pool.permanent.active ? "PERMANENT" : "OFFLINE"} ({healthData?.pool.permanent.memory_mb}MB)
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-pink-500" />
                    <span className="text-gray-500">Capacity:</span>
                    <span className="text-pink-400">HOT: {healthData?.pool.hot.count} | COLD: {healthData?.pool.cold.count}</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-600">Janitor:</span>
                        <span className="text-green-600 font-bold">{healthData?.janitor.next_cleanup_estimate}</span>
                    </div>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Quadrant 1: Requests */}
                <QuadrantCard title="Requests" count={activeTasks.length} icon={<Clock className="w-4 h-4" color="#00FFFF" />} accentColor="cyan">
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="p-3 border-b border-cyan-900/40 bg-cyan-950/20 flex justify-between items-center">
                            <span className="text-[10px] text-cyan-500/70 uppercase">Active Monitoring</span>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] border border-cyan-800 text-cyan-500 hover:bg-cyan-950/50 hover:text-cyan-400 flex gap-1 items-center uppercase font-bold">
                                        {statusFilter}
                                        <ChevronDown className="w-3 h-3 text-cyan-700" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0A0A0A] border border-cyan-900/50 text-cyan-400 font-mono text-[10px]">
                                    <DropdownMenuItem onClick={() => setStatusFilter("all")} className="hover:bg-cyan-950/50 focus:bg-cyan-950/50 cursor-pointer">
                                        ALL REQUESTS
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("success")} className="hover:bg-cyan-950/50 focus:bg-cyan-950/50 cursor-pointer text-green-500">
                                        SUCCESS ONLY
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("errors")} className="hover:bg-cyan-950/50 focus:bg-cyan-950/50 cursor-pointer text-red-500">
                                        ERRORS ONLY
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <ScrollArea className="flex-1">
                            {activeTasks.length === 0 && completedTasks.length === 0 ? (
                                <div className="p-12 text-center text-cyan-900 italic text-sm">No active or recent requests</div>
                            ) : (
                                <div className="p-0">
                                    {(statusFilter === 'all') && activeTasks.length > 0 && (
                                        <div className="space-y-0 text-[11px]">
                                            {activeTasks.map((t, i) => (
                                                <div key={t.task_id + i} className="p-2 border-b border-cyan-900/20 hover:bg-cyan-950/30 flex items-center gap-3 group">
                                                    <span className="text-cyan-400 font-bold animate-pulse">●</span>
                                                    <span className="text-cyan-600 truncate flex-1">{t.url}</span>
                                                    <span className="text-cyan-800 font-mono text-[9px] group-hover:text-cyan-400">{(t.task_id || (t as any).id || (t as any).taskId)?.slice(0, 8) || "N/A"}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(statusFilter === 'all' || statusFilter === 'success' || statusFilter === 'errors') && (
                                        <>
                                            <div className="bg-cyan-950/10 p-2 text-[10px] text-cyan-800 uppercase border-b border-cyan-900/30 mt-4 flex justify-between">
                                                <span>Task History</span>
                                                <span className="text-[9px] opacity-50">{statusFilter === 'all' ? 'RECENT' : (statusFilter?.toUpperCase() || 'HISTORY')}</span>
                                            </div>
                                            <div className="space-y-0 text-[11px]">
                                                {completedTasks
                                                    .filter(t => {
                                                        if (statusFilter === 'all') return true;
                                                        if (statusFilter === 'success') return t.status === 'completed' || !t.error;
                                                        if (statusFilter === 'errors') return t.status === 'failed' || !!t.error;
                                                        return true;
                                                    })
                                                    .slice(0, 20)
                                                    .map((t, i) => {
                                                        const isError = t.status === 'failed' || !!t.error;
                                                        return (
                                                            <div key={t.task_id + i} className="p-2 border-b border-cyan-900/10 hover:bg-white/5 flex items-center gap-3 group cursor-pointer" onClick={() => setSelectedTask(t)}>
                                                                {isError ? (
                                                                    <XCircle className="w-3 h-3 text-red-600" />
                                                                ) : (
                                                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                                                )}
                                                                <div className="flex-1 flex flex-col min-w-0">
                                                                    <span className={`truncate ${isError ? 'text-red-900/60' : 'text-gray-500'}`}>{t.url}</span>
                                                                    <span className="text-[8px] text-gray-700 font-mono">{t.task_id || (t as any).id || (t as any).taskId}</span>
                                                                </div>
                                                                {isError && (
                                                                    <span className="text-[9px] text-red-500/50 italic truncate max-w-[80px]" title={t.error}>
                                                                        {t.error}
                                                                    </span>
                                                                )}
                                                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    View
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </QuadrantCard>

                {/* Quadrant 2: Browsers */}
                <QuadrantCard title="Browsers" count={browsers.length} subtext={`${healthData?.pool.total_memory_mb}MB`} icon={<Globe className="w-4 h-4 text-cyan-400" />} accentColor="cyan">
                    <Table className="text-[11px]">
                        <TableHeader className="bg-cyan-950/20">
                            <TableRow className="border-cyan-900/30 hover:bg-transparent">
                                <TableHead className="text-cyan-600 h-8">Type</TableHead>
                                <TableHead className="text-cyan-600 h-8">Sig</TableHead>
                                <TableHead className="text-cyan-600 h-8 text-right">Age</TableHead>
                                <TableHead className="text-cyan-600 h-8 text-right">Used</TableHead>
                                <TableHead className="text-cyan-600 h-8 text-right">Hits</TableHead>
                                <TableHead className="text-cyan-600 h-8 text-right">Act</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {browsers.map((b, i) => (
                                <TableRow key={b.sig + i} className="border-cyan-900/20 hover:bg-cyan-950/20">
                                    <TableCell className="py-2 capitalize flex items-center gap-1">
                                        <Zap className={`w-2 h-2 ${b.type === 'permanent' ? 'text-orange-500 animate-pulse' : 'text-blue-400'}`} />
                                        {b.type}
                                    </TableCell>
                                    <TableCell className="py-2 text-cyan-400 font-mono">{b.sig}</TableCell>
                                    <TableCell className="py-2 text-right text-gray-400">{Math.floor(b.age_seconds / 60)}m {b.age_seconds % 60}s</TableCell>
                                    <TableCell className="py-2 text-right text-gray-400">{Math.floor(b.last_used_seconds / 60)}m {b.last_used_seconds % 60}s</TableCell>
                                    <TableCell className="py-2 text-right font-bold text-cyan-500">{b.hits}</TableCell>
                                    <TableCell className="py-2 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-5 w-5 text-cyan-900 hover:text-cyan-400" onClick={() => restartBrowser(b.sig)}>
                                                <RefreshCw className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-auto p-2 border-t border-cyan-900/20 text-[10px] text-right text-cyan-900">
                        Reuse: <span className="text-cyan-600 font-bold">---%</span>
                    </div>
                </QuadrantCard>

                {/* Quadrant 3: Janitor Events */}
                <QuadrantCard title="Janitor Events" icon={<ShieldCheck className="w-4 h-4 text-orange-500" />} accentColor="orange">
                    <ScrollArea className="flex-1">
                        {Array.isArray(janitorLogs) && janitorLogs.length === 0 ? (
                            <div className="p-12 text-center text-orange-950 italic text-sm">No events yet</div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {Array.isArray(janitorLogs) && janitorLogs.map((log, i) => {
                                    const message = typeof log === 'string' ? log : (log.message || log.msg || log.detail || log.error || "System event");
                                    const timestamp = typeof log === 'object' ? log.timestamp : Date.now();
                                    return (
                                        <div key={i} className="text-[10px] flex gap-2 border-l border-orange-900/30 pl-2">
                                            <span className="text-orange-900/50">[{safeFormatTime(timestamp)}]</span>
                                            <span className="text-orange-400/80">{message}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </QuadrantCard>

                {/* Quadrant 4: Errors */}
                <QuadrantCard title="Errors" icon={<XCircle className="w-4 h-4 text-red-500" />} accentColor="red">
                    <ScrollArea className="flex-1">
                        {Array.isArray(errorLogs) && errorLogs.length === 0 ? (
                            <div className="p-12 text-center text-red-950 italic text-sm">No errors</div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {Array.isArray(errorLogs) && errorLogs.map((log, i) => {
                                    const message = typeof log === 'string' ? log : (log.message || log.error || log.detail || log.msg || "Unknown error occurred");
                                    const timestamp = typeof log === 'object' ? log.timestamp : Date.now();
                                    return (
                                        <div key={i} className="text-[10px] flex gap-2 border-l border-red-900/30 pl-2">
                                            <span className="text-red-900/50">[{safeFormatTime(timestamp)}]</span>
                                            <span className="text-red-400/80">{message}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </QuadrantCard>


                {/* Bottom Quadrant 2: Resource Timeline */}
                <QuadrantCard title={`Resource Timeline (5min)`} icon={<Timer className="w-4 h-4 text-green-500" />} accentColor="green">
                    <div className="flex-1 flex flex-col p-2 space-y-2">
                        <div className="flex justify-between items-center bg-black/40 border border-green-900/30 p-1 px-2">
                            <span className="text-[10px] text-green-700 font-bold">METRIC STREAM</span>
                            <select
                                value={timelineMetric}
                                onChange={(e) => setTimelineMetric(e.target.value as any)}
                                className="bg-transparent text-[10px] text-green-400 outline-none border-none cursor-pointer hover:text-green-300"
                            >
                                <option value="memory" className="bg-[#0A0A0A]">Memory %</option>
                                <option value="requests" className="bg-[#0A0A0A]">Active Jobs</option>
                                <option value="browsers" className="bg-[#0A0A0A]">Pool Size</option>
                            </select>
                        </div>
                        <div className="flex-1 bg-green-950/5 relative overflow-hidden border border-green-950/20 group">
                            {timelineData ? (
                                <SimpleChart data={timelineData[timelineMetric]} metric={timelineMetric} />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-green-900 text-xs animate-pulse">
                                    Loading...
                                </div>
                            )}
                            {/* Grid lines */}
                            <div className="absolute inset-0 pointer-events-none opacity-20">
                                <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #00FF00 1px, transparent 1px), linear-gradient(to bottom, #00FF00 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                            </div>
                        </div>
                    </div>
                </QuadrantCard>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-6 flex flex-wrap items-center gap-3 p-3 bg-[#0A0A0A] border border-[#FF00FF]/30 shadow-[0_0_15px_-5px_rgba(255,0,255,0.2)]">
                <span className="text-[#FF00FF] uppercase text-[10px] font-bold mr-2">Control Actions</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCleanup}
                    className="bg-[#FF00FF]/10 text-[#FF00FF] border border-[#FF00FF]/40 text-[9px] h-7 hover:bg-[#FF00FF]/20 px-3 flex gap-2 items-center"
                >
                    <Trash2 className="w-3 h-3" /> Force Cleanup
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRestartPermanent}
                    className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 text-[9px] h-7 hover:bg-cyan-500/20 px-3 flex gap-2 items-center font-bold"
                >
                    <RotateCcw className="w-3 h-3 text-cyan-500" /> Restart Permanent
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetStats}
                    className="bg-white/5 text-gray-300 border border-white/10 text-[9px] h-7 hover:bg-white/10 px-3 flex gap-2 items-center"
                >
                    <Terminal className="w-3 h-3 text-gray-500" />
                    Reset Stats
                </Button>

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 uppercase">SYS_LOG_LVL:</span>
                    <span className="text-[10px] text-green-900 font-bold bg-green-900/10 px-1">DEBUG</span>
                </div>
            </div>

            {/* Connection Status Floor */}
            <div className="fixed bottom-0 left-0 right-0 h-1 flex">
                <div className={`flex-1 transition-all duration-1000 ${wsStatus === 'connected' ? 'bg-cyan-500 shadow-[0_0_10px_#00FFFF]' : wsStatus === 'connecting' ? 'bg-yellow-500 shadow-[0_0_10px_#FFFF00]' : 'bg-red-500 shadow-[0_0_10px_#FF0000]'}`} />
                <div className="bg-black px-2 text-[8px] flex items-center gap-1 border-l border-t border-cyan-900 text-cyan-900 font-mono">
                    {wsStatus === 'connected' ? <Zap className="w-2 h-2 fill-cyan-500 text-cyan-500" /> : <ZapOff className="w-2 h-2" />}
                    {wsStatus?.toUpperCase() || 'OFFLINE'} @ {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Task Result Modal */}
            <AnimatePresence>
                {selectedTask && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedTask(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-4xl max-h-[80vh] bg-[#0A0A0A] border border-cyan-900/50 flex flex-col shadow-[0_0_50px_-12px_rgba(0,255,255,0.25)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-cyan-900/30 flex justify-between items-center bg-cyan-950/20">
                                <div className="flex flex-col">
                                    <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                        <Terminal className="w-4 h-4" />
                                        Task Result: {(selectedTask.task_id || (selectedTask as any).id || (selectedTask as any).taskId)?.slice(0, 8) || 'Unknown'}
                                    </h3>
                                    <span className="text-[10px] text-cyan-800 truncate max-w-md">
                                        {(() => {
                                            try {
                                                const parsed = JSON.parse(selectedTask.url);
                                                return Array.isArray(parsed) ? parsed.join(', ') : selectedTask.url;
                                            } catch (e) {
                                                return selectedTask.url;
                                            }
                                        })()}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedTask(null)}
                                    className="h-8 w-8 p-0 text-cyan-900 hover:text-cyan-400 hover:bg-cyan-950/50"
                                >
                                    <XCircle className="w-5 h-5" />
                                </Button>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                <pre className="text-xs font-mono text-cyan-300 whitespace-pre-wrap break-all">
                                    {JSON.stringify(selectedTask.result || { status: selectedTask.status, error: selectedTask.error }, null, 2)}
                                </pre>
                            </ScrollArea>
                            <div className="p-3 border-t border-cyan-900/20 bg-black/40 flex justify-between items-center">
                                <span className="text-[9px] text-cyan-900 uppercase">
                                    Status: <span className={selectedTask.error || (selectedTask.status === 'failed') ? "text-red-500" : "text-green-500"}>{(selectedTask.status || (selectedTask as any).state || 'unknown')?.toUpperCase()}</span>
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[10px] border-cyan-900 text-cyan-500 hover:bg-cyan-950/50"
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(selectedTask.result || selectedTask, null, 2));
                                        toast.success("Result copied to clipboard");
                                    }}
                                >
                                    Copy Result
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function QuadrantCard({ title, children, icon, count, subtext, accentColor = 'cyan' }: {
    title: string,
    children: React.ReactNode,
    icon?: React.ReactNode,
    count?: number,
    subtext?: string,
    accentColor?: string
}) {
    const accents: any = {
        cyan: 'border-cyan-900/50 shadow-cyan-900/10 text-cyan-500 bg-cyan-950/5',
        orange: 'border-orange-900/50 shadow-orange-900/10 text-orange-500 bg-orange-950/5',
        magenta: 'border-magenta-900/50 shadow-magenta-900/10 text-magenta-500 bg-magenta-950/5',
        red: 'border-red-900/50 shadow-red-900/10 text-red-500 bg-red-950/5',
        green: 'border-green-900/50 shadow-green-900/10 text-green-500 bg-green-950/5'
    };

    const headerAccents: any = {
        cyan: 'text-[#00FFFF] border-[#00FFFF]/20',
        orange: 'text-orange-400 border-orange-400/20',
        magenta: 'text-magenta-400 border-magenta-400/20',
        red: 'text-red-400 border-red-400/20',
        green: 'text-green-400 border-green-400/20'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col h-[280px] border ${accents[accentColor]} overflow-hidden`}
        >
            <div className={`flex items-center gap-2 p-2 border-b bg-black/40 ${headerAccents[accentColor]}`}>
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
                {count !== undefined && <span className="text-[10px] text-white/40 ml-1">({count}{subtext ? `, ${subtext}` : ''})</span>}
            </div>
            <div className="flex-1 overflow-hidden flex flex-col relative">
                {children}
            </div>
        </motion.div>
    );
}

function SimpleChart({ data, metric }: { data: any, metric: string }) {
    const rawValues = data?.values || [];

    if (rawValues.length < 2) {
        return (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-green-900/30 uppercase tracking-widest">
                Waiting for data stream...
            </div>
        );
    }

    const max = Math.max(...(metric === 'memory' ? [100] : rawValues.length ? rawValues.map((v: any) => typeof v === 'object' ? (v.permanent + v.hot + v.cold) : v) : [10]));

    // Normalize values to 0-100 for SVG coordinate space
    const points = rawValues.map((v: any, i: number) => {
        const val = typeof v === 'object' ? (v.permanent + v.hot + v.cold) : v;
        const x = (i / (rawValues.length - 1)) * 100;
        const y = 100 - (val / (max || 1)) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full p-2">
            <polyline
                fill="none"
                stroke="#00FF00"
                strokeWidth="1.5"
                points={points}
                className="transition-all duration-500"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {/* Gradient fill */}
            <path
                d={`L 100,100 L 0,100 Z`}
                fill="url(#chartGradient)"
                opacity="0.1"
            />
            <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#00FF00" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
        </svg>
    );
}
