"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Globe, Loader2, Play } from "lucide-react";
import { useRagContext } from "../providers/RAG";
import { toast } from "sonner";
import { CrawlRequest } from "../hooks/use-rag";

interface CrawlFormProps {
    collectionId: string;
}

export function CrawlForm({ collectionId }: CrawlFormProps) {
    const { startCrawl } = useRagContext();
    const [isCrawling, setIsCrawling] = useState(false);
    const [formData, setFormData] = useState<CrawlRequest>({
        url: "",
        crawl_type: "website",
        max_pages: 100,
        max_depth: 2,
        extract_code_examples: false,
        max_concurrent: 5,
        skip_discovery: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.url) {
            toast.error("Please enter a URL to crawl");
            return;
        }

        setIsCrawling(true);
        const loadingToast = toast.loading("Starting crawl operation...");

        try {
            const response = await startCrawl(collectionId, formData);
            toast.success("Crawl started successfully!", {
                description: `Task ID: ${response.task_id}`,
            });
            // Optionally reset form or redirect to a status view
        } catch (error: any) {
            toast.error("Failed to start crawl", {
                description: error.message,
            });
        } finally {
            setIsCrawling(false);
            toast.dismiss(loadingToast);
        }
    };

    const handleChange = (field: keyof CrawlRequest, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6 py-4">
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="url">Seed URL</Label>
                    <div className="flex gap-2">
                        <Input
                            id="url"
                            placeholder="https://docs.example.com"
                            value={formData.url}
                            onChange={(e) => handleChange("url", e.target.value)}
                            className="flex-1"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        The starting point for the orbital scout.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="crawl_type">Crawl Type</Label>
                        <Select
                            value={formData.crawl_type}
                            onValueChange={(value) => handleChange("crawl_type", value)}
                        >
                            <SelectTrigger id="crawl_type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="website">Website</SelectItem>
                                <SelectItem value="sitemap">Sitemap</SelectItem>
                                <SelectItem value="docs">Documentation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="max_pages">Max Pages</Label>
                        <Input
                            id="max_pages"
                            type="number"
                            value={formData.max_pages}
                            onChange={(e) => handleChange("max_pages", parseInt(e.target.value))}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="max_depth">Max Depth</Label>
                        <Input
                            id="max_depth"
                            type="number"
                            value={formData.max_depth}
                            onChange={(e) => handleChange("max_depth", parseInt(e.target.value))}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="max_concurrent">Concurrent Requests</Label>
                        <Input
                            id="max_concurrent"
                            type="number"
                            value={formData.max_concurrent}
                            onChange={(e) => handleChange("max_concurrent", parseInt(e.target.value))}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                    <div className="space-y-0.5">
                        <Label htmlFor="extract_code">Extract Code Examples</Label>
                        <p className="text-xs text-muted-foreground">
                            Identify and extract code blocks from pages.
                        </p>
                    </div>
                    <Switch
                        id="extract_code"
                        checked={formData.extract_code_examples}
                        onCheckedChange={(checked) => handleChange("extract_code_examples", checked)}
                    />
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                    <div className="space-y-0.5">
                        <Label htmlFor="skip_discovery">Skip Discovery</Label>
                        <p className="text-xs text-muted-foreground">
                            Only crawl the provided URL(s) without finding new ones.
                        </p>
                    </div>
                    <Switch
                        id="skip_discovery"
                        checked={formData.skip_discovery}
                        onCheckedChange={(checked) => handleChange("skip_discovery", checked)}
                    />
                </div>
            </div>

            <Button
                className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold shadow-[0_0_15px_rgba(var(--secondary),0.3)]"
                onClick={handleSubmit}
                disabled={isCrawling || !formData.url}
            >
                {isCrawling ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Engaging Orbital Scout...
                    </>
                ) : (
                    <>
                        <Play className="mr-2 h-4 w-4" />
                        Start Crawl
                    </>
                )}
            </Button>
        </div>
    );
}
