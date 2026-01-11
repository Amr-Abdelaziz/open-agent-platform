"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRagContext } from "../providers/RAG";
import { CrawledPage } from "../hooks/use-rag";
import {
    FileText,
    ExternalLink,
    ChevronRight,
    Search,
    RefreshCw,
    Eye,
    Calendar,
    Layers,
    FileBox,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

export function CrawledPagesList() {
    const { selectedCollection, listPages, getPageContent, deletePage } = useRagContext();
    const [pages, setPages] = useState<CrawledPage[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPage, setSelectedPage] = useState<CrawledPage | null>(null);
    const [pageContentLoading, setPageContentLoading] = useState(false);

    const fetchPages = useCallback(async () => {
        if (!selectedCollection) return;
        setLoading(true);
        try {
            const data = await listPages(selectedCollection.uuid);
            setPages(data);
        } catch (error) {
            console.error("Failed to fetch pages:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedCollection, listPages]);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);

    const handlePreviewPage = async (page: CrawledPage) => {
        setPageContentLoading(true);
        setSelectedPage(page);
        try {
            const fullPage = await getPageContent(page.id);
            setSelectedPage(fullPage);
        } catch (error) {
            console.error("Failed to fetch page content:", error);
        } finally {
            setPageContentLoading(false);
        }
    };

    const handleDeletePage = async (page: CrawledPage, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this crawled page? This will also remove its associated chunks and embeddings.")) return;

        try {
            await deletePage(page.id);
            toast.success("Page deleted successfully");
            setPages(prev => prev.filter(p => p.id !== page.id));
        } catch (error) {
            console.error("Failed to delete page:", error);
            toast.error("Failed to delete page");
        }
    };

    const filteredPages = pages.filter(page =>
        page.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (page.section_title && page.section_title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!selectedCollection) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
                <FileBox className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/40">Select a collection to view crawled pages</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                        placeholder="Search crawled pages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border-white/10 pl-10 h-10 ring-offset-violet-500 focus-visible:ring-violet-500/50"
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchPages}
                    disabled={loading}
                    className="bg-white/5 border-white/10 hover:bg-white/10 h-10 w-10 shrink-0"
                >
                    <RefreshCw className={`w-4 h-4 text-white/60 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <div className="grid gap-2">
                {loading && pages.length === 0 ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
                    ))
                ) : filteredPages.length === 0 ? (
                    <div className="p-8 text-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                        <p className="text-white/40">No pages found</p>
                    </div>
                ) : (
                    filteredPages.map((page) => (
                        <div
                            key={page.id}
                            className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-violet-500/10 cursor-pointer"
                            onClick={() => handlePreviewPage(page)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-500/30 group-hover:bg-violet-500/30 transition-colors">
                                        <FileText className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-white font-medium truncate group-hover:text-violet-300 transition-colors">
                                            {page.section_title || page.url.split("/").pop() || "Untitled Page"}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1 underline-none">
                                            <a
                                                href={page.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-white/40 hover:text-white/60 flex items-center gap-1 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {new URL(page.url).hostname}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <span className="text-white/20 text-xs">•</span>
                                            <span className="text-xs text-white/40 flex items-center gap-1">
                                                <Layers className="w-3 h-3" />
                                                {page.word_count} words
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-white/5 border-white/10 text-white/60 text-[10px] uppercase tracking-wider font-semibold px-2 py-0">
                                            {page.metadata.crawl_type || "crawled"}
                                        </Badge>
                                    </div>
                                    <span className="text-[10px] text-white/20 whitespace-nowrap">
                                        {formatDistanceToNow(new Date(page.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>

                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => handleDeletePage(page, e)}
                                    className="h-8 w-8 text-white/20 hover:text-red-400 hover:bg-red-400/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                <ChevronRight className="w-5 h-5 text-white/40" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={!!selectedPage} onOpenChange={(open) => !open && setSelectedPage(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] bg-neutral-950/95 backdrop-blur-2xl border-white/10 overflow-hidden flex flex-col p-0 gap-0 shadow-2xl shadow-violet-500/20">
                    <DialogHeader className="p-6 border-b border-white/10 bg-white/5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent truncate leading-relaxed">
                                    {selectedPage?.section_title || "Page Preview"}
                                </DialogTitle>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={selectedPage?.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors hover:underline"
                                    >
                                        {selectedPage?.url}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <div className="text-xs text-white/40 uppercase tracking-widest font-bold">Word Count</div>
                                    <div className="text-lg font-mono text-white/80">{selectedPage?.word_count}</div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="text-right">
                                    <div className="text-xs text-white/40 uppercase tracking-widest font-bold">Created</div>
                                    <div className="text-sm text-white/80">
                                        {selectedPage && formatDistanceToNow(new Date(selectedPage.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        {pageContentLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Eye className="w-6 h-6 text-violet-500" />
                                    </div>
                                </div>
                                <p className="text-white/60 animate-pulse font-medium tracking-wide">Decompressing page content...</p>
                            </div>
                        ) : (
                            <div className="prose prose-invert max-w-none prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-headings:text-white prose-p:text-white/80 prose-li:text-white/80">
                                <ReactMarkdown>{selectedPage?.full_content || ""}</ReactMarkdown>
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-white/40">
                                ID: <span className="font-mono text-[10px]">{selectedPage?.id}</span>
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedPage(null)}
                            className="bg-white/5 border-white/10 hover:bg-white/10"
                        >
                            Close Preview
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
