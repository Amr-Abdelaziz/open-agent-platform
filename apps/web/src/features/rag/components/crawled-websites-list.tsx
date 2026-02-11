"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRagContext } from "../providers/RAG";
import { CrawlTask, CrawledPage } from "../hooks/use-rag";
import {
    Globe,
    ExternalLink,
    RefreshCw,
    Database,
    Trash2,
    Calendar,
    Layers,
    Server,
    Search,
    ChevronRight,
    FileText,
    Eye,
    Loader2,
    Copy,
    Check
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MarkdownText } from "@/components/ui/markdown-text";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WebsiteSource {
    source_id: string;
    url: string;
    hostname: string;
    pageCount: number;
    lastCrawled: string;
    status: string;
    pages: CrawledPage[];
    progress?: {
        current: number;
        total: number;
    };
}

export function CrawledWebsitesList() {
    const { selectedCollection, listCrawls, listPages, deleteSource, getPageContent } = useRagContext();
    const [websites, setWebsites] = useState<WebsiteSource[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedWebsite, setSelectedWebsite] = useState<WebsiteSource | null>(null);
    const [selectedPage, setSelectedPage] = useState<CrawledPage | null>(null);
    const [pageLoading, setPageLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchWebsites = useCallback(async () => {
        if (!selectedCollection) return;
        setLoading(true);
        try {
            const [crawls, pages] = await Promise.all([
                listCrawls(selectedCollection.uuid),
                listPages(selectedCollection.uuid, 100)
            ]);

            const websiteMap = new Map<string, WebsiteSource>();

            // Process crawls to find unique sources
            crawls.forEach((crawl: CrawlTask) => {
                const sourceId = crawl.source_id || crawl.metadata?.source_id;
                if (!sourceId) return;

                const hostname = new URL(crawl.url).hostname;
                if (!websiteMap.has(sourceId)) {
                    websiteMap.set(sourceId, {
                        source_id: sourceId,
                        url: crawl.url,
                        hostname,
                        pageCount: 0,
                        lastCrawled: crawl.created_at,
                        status: crawl.status,
                        pages: [],
                        progress: ["pending", "crawling", "processing", "starting"].includes(crawl.status.toLowerCase()) ? {
                            current: crawl.metadata?.pages_crawled || crawl.pages_crawled || 0,
                            total: crawl.metadata?.max_pages || crawl.max_pages || 100
                        } : undefined
                    });
                } else {
                    const existing = websiteMap.get(sourceId)!;
                    if (new Date(crawl.created_at) > new Date(existing.lastCrawled)) {
                        existing.lastCrawled = crawl.created_at;
                        existing.status = crawl.status;
                        if (["pending", "crawling", "processing", "starting"].includes(crawl.status.toLowerCase())) {
                            existing.progress = {
                                current: crawl.metadata?.pages_crawled || crawl.pages_crawled || 0,
                                total: crawl.metadata?.max_pages || crawl.max_pages || 100
                            };
                        } else {
                            existing.progress = undefined;
                        }
                    }
                }
            });

            // Associate pages with sources
            pages.forEach((page: CrawledPage) => {
                const sourceId = page.metadata?.source_id;
                if (!sourceId) {
                    // fallback to hostname grouping if no source_id
                    const hostname = new URL(page.url).hostname;
                    // Find a source with this hostname if possible
                    const existingSource = Array.from(websiteMap.values()).find(s => s.hostname === hostname);
                    if (existingSource) {
                        existingSource.pageCount++;
                        existingSource.pages.push(page);
                    } else {
                        // Create a virtual source for this hostname
                        if (!websiteMap.has(hostname)) {
                            websiteMap.set(hostname, {
                                source_id: hostname, // Using hostname as id for virtual source
                                url: `https://${hostname}`,
                                hostname,
                                pageCount: 1,
                                lastCrawled: page.created_at,
                                status: "completed",
                                pages: [page]
                            });
                        } else {
                            const virtual = websiteMap.get(hostname)!;
                            virtual.pageCount++;
                            virtual.pages.push(page);
                            if (new Date(page.created_at) > new Date(virtual.lastCrawled)) {
                                virtual.lastCrawled = page.created_at;
                            }
                        }
                    }
                    return;
                }

                if (websiteMap.has(sourceId)) {
                    const source = websiteMap.get(sourceId)!;
                    source.pageCount++;
                    source.pages.push(page);
                } else {
                    // Page has source_id but no matching crawl found (maybe crawl record deleted)
                    const hostname = new URL(page.url).hostname;
                    websiteMap.set(sourceId, {
                        source_id: sourceId,
                        url: page.url,
                        hostname,
                        pageCount: 1,
                        lastCrawled: page.created_at,
                        status: "completed",
                        pages: [page]
                    });
                }
            });

            setWebsites(Array.from(websiteMap.values()).sort((a, b) =>
                new Date(b.lastCrawled).getTime() - new Date(a.lastCrawled).getTime()
            ));
        } catch (error) {
            console.error("Failed to fetch websites:", error);
            toast.error("Failed to sync orbital database");
        } finally {
            setLoading(false);
        }
    }, [selectedCollection, listCrawls, listPages]);

    useEffect(() => {
        fetchWebsites();
    }, [fetchWebsites]);

    const handleDeleteSource = async (website: WebsiteSource, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete all data for ${website.hostname}? This includes all ${website.pageCount} pages, chunks, and embeddings.`)) return;

        const loadingToast = toast.loading(`Purging ${website.hostname} from orbital banks...`);
        try {
            await deleteSource(website.source_id);
            toast.success("Website data purged successfully", { id: loadingToast });
            fetchWebsites();
            if (selectedWebsite?.source_id === website.source_id) {
                setSelectedWebsite(null);
            }
        } catch (error: any) {
            toast.error("Failed to purge website data", { id: loadingToast, description: error.message });
        }
    };

    const filteredWebsites = websites.filter(site =>
        site.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePageClick = async (page: CrawledPage) => {
        setPageLoading(true);
        try {
            const fullPage = await getPageContent(page.id);
            setSelectedPage(fullPage);
        } catch (error) {
            console.error("Failed to fetch page content:", error);
            toast.error("Failed to load orbital data");
        } finally {
            setPageLoading(false);
        }
    };

    const handleCopyPageContent = () => {
        if (!selectedPage?.full_content) return;
        navigator.clipboard.writeText(selectedPage.full_content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Page content copied to clipboard");
    };

    if (!selectedCollection) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
                <Server className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/40">Select a collection to view crawled websites</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                        placeholder="Search websites..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border-white/10 pl-10 h-10 ring-offset-violet-500 focus-visible:ring-violet-500/50"
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchWebsites}
                    disabled={loading}
                    className="bg-white/5 border-white/10 hover:bg-white/10 h-10 w-10 shrink-0"
                >
                    <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <ScrollArea className="h-[500px] pr-4 -mr-4">
                <div className="grid gap-4">
                    {loading && websites.length === 0 ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
                        ))
                    ) : filteredWebsites.length === 0 ? (
                        <div className="p-12 text-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                            <Globe className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40 font-medium tracking-wide">No crawl sources found in this sector</p>
                        </div>
                    ) : (
                        filteredWebsites.map((website) => (
                            <div
                                key={website.source_id}
                                className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-violet-500/10 cursor-pointer"
                                onClick={() => setSelectedWebsite(website)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-500/30 group-hover:bg-violet-500/30 transition-colors">
                                            <Database className="w-6 h-6 text-violet-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                                                {website.hostname}
                                            </h4>
                                            <p className="text-sm text-white/40 truncate max-w-md">{website.url}</p>

                                            {website.progress && (
                                                <div className="mt-3 w-64">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[10px] text-violet-300 font-bold uppercase tracking-wider">Crawl Progress</span>
                                                        <span className="text-[10px] text-white/40 font-mono">{website.progress.current} / {website.progress.total}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                                            style={{ width: `${Math.min(100, Math.max(2, (website.progress.current / website.progress.total) * 100))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs text-white/60">
                                                    <Layers className="w-3.5 h-3.5 text-violet-400/60" />
                                                    <span className="font-semibold">{website.pageCount}</span>
                                                    <span className="opacity-60">pages discovered</span>
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                                <div className="flex items-center gap-1.5 text-xs text-white/60">
                                                    <Calendar className="w-3.5 h-3.5 text-violet-400/60" />
                                                    <span className="opacity-60">Last sync:</span>
                                                    <span className="font-medium">{formatDistanceToNow(new Date(website.lastCrawled), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <Badge variant="secondary" className={`bg-violet-500/10 border-violet-500/20 text-violet-300 px-2 py-0.5 text-[10px] uppercase tracking-tighter font-black`}>
                                            {website.status}
                                        </Badge>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => handleDeleteSource(website, e)}
                                                className="h-9 w-9 text-white/20 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/20"
                                                title="Purge Website Data"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                <ChevronRight className="w-5 h-5 text-white/40" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <Dialog open={!!selectedWebsite} onOpenChange={(open) => !open && setSelectedWebsite(null)}>
                <DialogContent className="max-w-3xl h-[85vh] bg-neutral-950/98 backdrop-blur-2xl border-white/10 p-0 overflow-hidden flex flex-col shadow-2xl shadow-violet-500/20">
                    <DialogHeader className="p-6 border-b border-white/10 bg-white/5 flex-row items-center justify-between shrink-0 space-y-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                                <Globe className="w-5 h-5 text-violet-400" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-xl font-bold text-white leading-none">
                                    {selectedWebsite?.hostname}
                                </DialogTitle>
                                <p className="text-xs text-white/40 font-mono truncate max-w-md">{selectedWebsite?.url}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => selectedWebsite && handleDeleteSource(selectedWebsite, e as any)}
                                className="h-8 text-xs text-red-400 hover:text-red-300 border-red-400/20 bg-red-400/5 hover:bg-red-400/10 hover:border-red-400/40"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Purge All Data
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        <div className="px-6 py-4 border-b border-white/5 bg-white/5 shrink-0">
                            <h5 className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Layers className="w-3 h-3" />
                                Crawled Pages ({selectedWebsite?.pageCount})
                            </h5>
                        </div>
                        <div className="flex-1 overflow-hidden min-h-0">
                            <ScrollArea className="h-full w-full">
                                <div className="p-6 pt-2 space-y-3">
                                    <div className="grid gap-2 pb-24">
                                        {selectedWebsite?.pages.map((page: CrawledPage) => (
                                            <div
                                                key={page.id}
                                                className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-violet-500/30 transition-all group/page cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-violet-500/10"
                                                onClick={() => handlePageClick(page)}
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover/page:bg-violet-500/20 transition-all">
                                                        <FileText className="w-5 h-5 text-white/10 group-hover/page:text-violet-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-white group-hover/page:text-violet-200 transition-colors truncate">
                                                            {page.section_title || page.url.split('/').pop() || 'Untitled Page'}
                                                        </p>
                                                        <p className="text-[10px] text-white/20 truncate font-mono mt-0.5 group-hover/page:text-white/40">{page.url}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0">
                                                    <div className="hidden sm:flex flex-col items-end mr-2">
                                                        <span className="text-[10px] text-white/30 font-black tracking-widest uppercase">{page.word_count} words</span>
                                                        <span className="text-[9px] text-white/10 font-mono">NODE_{page.id.slice(0, 6)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg text-white/10 hover:text-violet-400 hover:bg-violet-500/10"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <a
                                                            href={page.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="h-8 w-8 flex items-center justify-center rounded-lg text-white/10 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedWebsite(null)}
                            className="bg-white/5 border-white/10 hover:bg-white/10"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Page Content Preview Dialog */}
            <Dialog open={!!selectedPage || pageLoading} onOpenChange={(open) => !open && setSelectedPage(null)}>
                <DialogContent className="max-w-4xl h-[90vh] bg-neutral-950 backdrop-blur-3xl border-white/10 p-0 flex flex-col shadow-2xl overflow-hidden ring-1 ring-violet-500/20">
                    <DialogHeader className="p-6 border-b border-white/10 flex-row items-center justify-between bg-white/5 shrink-0 space-y-0">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-500/30">
                                <FileText className="w-5 h-5 text-violet-400" />
                            </div>
                            <div className="min-w-0">
                                <DialogTitle className="text-xl font-black tracking-tight text-white truncate">
                                    {pageLoading ? "Decrypting Orbital Data..." : selectedPage?.section_title || "Page Preview"}
                                </DialogTitle>
                                <DialogDescription className="text-white/40 font-mono text-[10px] truncate max-w-lg">
                                    {selectedPage?.url}
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedPage?.full_content && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyPageContent}
                                    className="h-8 bg-white/5 border-white/10 hover:bg-white/10 gap-2 text-white/60"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied" : "Copy Content"}
                                </Button>
                            )}
                            <a
                                href={selectedPage?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 px-3 flex items-center gap-2 rounded-md bg-violet-500 text-white text-xs font-bold hover:bg-violet-600 transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Visit Original
                            </a>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden relative min-h-0">
                        {pageLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-50">
                                <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
                                <p className="text-violet-300 font-bold tracking-widest uppercase text-[10px] animate-pulse">Syncing with orbital banks...</p>
                            </div>
                        ) : null}

                        <ScrollArea className="h-full w-full">
                            <div className="p-8 pb-32">
                                {selectedPage?.full_content ? (
                                    <div className="max-w-3xl mx-auto">
                                        <div className="flex gap-6 mb-8 p-4 rounded-xl bg-white/5 border border-white/10 border-dashed">
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-black text-white/20 tracking-widest">Word Count</p>
                                                <p className="text-xl font-bold text-violet-400">{selectedPage.word_count}</p>
                                            </div>
                                            <div className="w-px h-10 bg-white/10" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-black text-white/20 tracking-widest">Character Count</p>
                                                <p className="text-xl font-bold text-fuchsia-400">{selectedPage.char_count || selectedPage.full_content.length}</p>
                                            </div>
                                            <div className="w-px h-10 bg-white/10" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] uppercase font-black text-white/20 tracking-widest">Discovery Date</p>
                                                <p className="text-sm font-bold text-white/60">{new Date(selectedPage.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <MarkdownText className="prose-invert prose-p:text-white/80 prose-headings:text-white prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10">
                                            {selectedPage.full_content}
                                        </MarkdownText>
                                    </div>
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                                        <FileText className="w-16 h-16 mb-4 stroke-[1]" />
                                        <p className="text-lg font-medium">No decrypted content available for this node</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedPage(null)}
                            className="bg-white/5 border-white/10 hover:bg-white/10 h-10 px-6 font-bold"
                        >
                            Return
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
