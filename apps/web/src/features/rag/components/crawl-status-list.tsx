"use client";

import React, { useEffect, useState } from "react";
import { useRagContext } from "../providers/RAG";
import { CrawlTask } from "../hooks/use-rag";
import { useLanguage } from "@/providers/Language";
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
import { RefreshCcw, XCircle, Search, ExternalLink, Trash2, Database } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CrawlStatusListProps {
    collectionId: string;
}

export function CrawlStatusList({ collectionId }: CrawlStatusListProps) {
    const { t } = useLanguage();
    const { listCrawls, cancelCrawl, deleteCrawl, deleteSource } = useRagContext();
    const [crawls, setCrawls] = useState<CrawlTask[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchCrawls = async () => {
        if (!collectionId) return;
        setLoading(true);
        try {
            const data = await listCrawls(collectionId);
            // Sort by created_at descending if available
            const sorted = [...data].sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setCrawls(sorted);
        } catch (error) {
            console.error("Failed to fetch crawls:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCrawls();
        // Smarter polling: 5s if active tasks, 30s otherwise
        const interval = setInterval(() => {
            const activeStates = ["pending", "crawling", "processing", "starting"];
            const hasActive = crawls.some(c => activeStates.includes(c.status?.toLowerCase()));

            // If we have active tasks, poll more frequently
            // If not, we still poll occasionally to see new tasks from other sessions
            fetchCrawls();
        }, crawls.some(c => ["pending", "crawling", "processing", "starting"].includes(c.status?.toLowerCase())) ? 5000 : 30000);

        return () => clearInterval(interval);
    }, [collectionId, crawls.map(c => c.status).join(',')]); // Trigger effect if any task status changes or length changes

    const handleCancel = async (taskId: string) => {
        const loadingToast = toast.loading(t('abort_mission'));
        try {
            await cancelCrawl(taskId);
            toast.success(t('crawl_cancel_requested'), { id: loadingToast });
            fetchCrawls();
        } catch (error: any) {
            toast.error(t('failed_cancel_crawl'), { id: loadingToast, description: error.message });
        }
    };

    const handleDelete = async (taskId: string) => {
        const loadingToast = toast.loading(t('defragmenting_mission'));
        try {
            await deleteCrawl(taskId);
            toast.success(t('mission_record_purged'), { id: loadingToast });
            fetchCrawls();
        } catch (error: any) {
            toast.error(t('failed_delete_mission'), { id: loadingToast, description: error.message });
        }
    };

    const handleDeleteSource = async (crawl: CrawlTask) => {
        const sourceId = crawl.source_id || crawl.metadata?.source_id;

        if (!sourceId) {
            toast.error(t('source_id_not_found'));
            return;
        }

        if (!confirm(t('purge_website_confirm').replace('{name}', new URL(crawl.url).hostname).replace('{count}', "all"))) return;

        const loadingToast = toast.loading(t('purging_orbital').replace('{name}', new URL(crawl.url).hostname));
        try {
            await deleteSource(sourceId);
            toast.success(t('website_purged_success'), { id: loadingToast });
            fetchCrawls();
        } catch (error: any) {
            toast.error(t('failed_purge_website'), { id: loadingToast, description: error.message });
        }
    };

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === "completed") return <Badge className="bg-green-500/20 text-green-500 border-green-500/20">{t('completed')}</Badge>;
        if (s === "failed") return <Badge variant="destructive">{t('failed')}</Badge>;
        if (s === "crawling" || s === "processing") return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20 animate-pulse">{t('in_progress')}</Badge>;
        if (s === "cancelled") return <Badge variant="secondary">{t('cancelled')}</Badge>;
        return <Badge variant="outline">{status}</Badge>;
    };

    if (!collectionId) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Search className="size-4 text-secondary" />
                    {t('recent_tasks')}
                </h4>
                <Button variant="ghost" size="sm" onClick={fetchCrawls} disabled={loading}>
                    <RefreshCcw className={`size-3.5 me-1 ${loading ? 'animate-spin' : ''}`} />
                    {t('sync')}
                </Button>
            </div>

            <ScrollArea className="h-[300px] -ms-4 -me-4 ps-4 pe-4">
                <div className="rounded-md border bg-card/50">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-secondary/10">
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-foreground/40">{t('target')}</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-foreground/40">{t('status')}</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-foreground/40 text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {crawls.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-sm">
                                        {t('no_crawled_websites')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                crawls.map((crawl) => (
                                    <TableRow key={crawl.task_id} className="border-secondary/5 hover:bg-secondary/5 transition-colors">
                                        <TableCell className="max-w-[200px]">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-medium truncate">{new URL(crawl.url).hostname}</span>
                                                <span className="text-[10px] text-muted-foreground truncate opacity-60">
                                                    {new Date(crawl.created_at).toLocaleString()}
                                                </span>
                                                {["pending", "crawling", "processing", "starting"].includes(crawl.status.toLowerCase()) && (
                                                    <div className="mt-2 w-full">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] text-white/40 uppercase tracking-tighter">{t('progress')}</span>
                                                            <span className="text-[9px] font-mono text-violet-400">
                                                                {crawl.metadata?.pages_crawled || crawl.pages_crawled || 0} / {crawl.metadata?.max_pages || crawl.max_pages || 100}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500 ease-in-out shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                                                                style={{
                                                                    width: `${Math.min(100, Math.max(5, ((crawl.metadata?.pages_crawled || crawl.pages_crawled || 0) / (crawl.metadata?.max_pages || crawl.max_pages || 100)) * 100))}%`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(crawl.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="size-7" asChild title={t('view_source') || 'View Source'}>
                                                    <a href={crawl.url} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="size-3.5" />
                                                    </a>
                                                </Button>
                                                {["pending", "crawling", "processing", "starting"].includes(crawl.status.toLowerCase()) ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleCancel(crawl.task_id)}
                                                        title={t('abort_mission') || 'Abort Mission'}
                                                    >
                                                        <XCircle className="size-3.5" />
                                                    </Button>
                                                ) : (
                                                    <>
                                                        {(crawl.source_id || crawl.metadata?.source_id) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-7 text-white/20 hover:text-red-500 hover:bg-red-500/10"
                                                                onClick={() => handleDeleteSource(crawl)}
                                                                title={t('purge_all_data') || 'Purge Website Data'}
                                                            >
                                                                <Database className="size-3.5" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 text-white/20 hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDelete(crawl.task_id)}
                                                            title={t('delete') || 'Delete Record'}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </>
                                                )}
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
