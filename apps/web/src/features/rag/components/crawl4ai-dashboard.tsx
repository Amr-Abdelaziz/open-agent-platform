"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Globe, Play, Loader2, Code, Settings, Webhook, Info, Activity, Save } from "lucide-react";
import { useLanguage } from "@/providers/Language";
import { useRagContext } from "../providers/RAG";
import { toast } from "sonner";
import { CrawlMonitor } from "./crawl-monitor";
import { useEffect, useCallback } from "react";
import { useOllama } from "@/hooks/use-ollama";
import { OllamaModelInfo } from "@/types/ollama";

export function Crawl4AiDashboard() {
    const { t } = useLanguage();
    const { selectedCollection, startCrawlJob } = useRagContext();
    const [loading, setLoading] = useState(false);
    const [urls, setUrls] = useState("");

    // Browser Config States
    const [browserMode, setBrowserMode] = useState<"visual" | "advanced">("visual");
    const [headless, setHeadless] = useState(true);
    const [userAgent, setUserAgent] = useState("Crawl4AI Bot");
    const [viewportWidth, setViewportWidth] = useState(1280);
    const [viewportHeight, setViewportHeight] = useState(720);
    const [proxy, setProxy] = useState("");
    const [acceptDownloads, setAcceptDownloads] = useState(false);
    const [downloadsPath, setDownloadsPath] = useState("");
    const [browserConfig, setBrowserConfig] = useState(JSON.stringify({
        "headless": true,
        "user_agent": "Crawl4AI Bot"
    }, null, 2));

    // Crawler Config States
    const [crawlerMode, setCrawlerMode] = useState<"visual" | "advanced">("visual");
    const [maxPages, setMaxPages] = useState(100);
    const [maxDepth, setMaxDepth] = useState(3);
    const [semaphoreCount, setSemaphoreCount] = useState(3);
    const [wordCountThreshold, setWordCountThreshold] = useState(10);
    const [extractionStrategy, setExtractionStrategy] = useState("markdown");
    const [bypassCache, setBypassCache] = useState(true);
    const [waitUntil, setWaitUntil] = useState("networkidle");
    const [pageTimeout, setPageTimeout] = useState(60000);
    const [screenshot, setScreenshot] = useState(false);
    const [pdf, setPdf] = useState(false);
    const [extractionQuery, setExtractionQuery] = useState("");
    const [llmProvider, setLlmProvider] = useState("openai/gpt-4o-mini");
    const [extractionType, setExtractionType] = useState<"block" | "schema">("block");
    const [chunkTokenThreshold, setChunkTokenThreshold] = useState(4000);
    const [overlapRate, setOverlapRate] = useState(0.1);
    const [applyChunking, setApplyChunking] = useState(true);
    const [enableStealth, setEnableStealth] = useState(true);
    const [extractionResult, setExtractionResult] = useState<any>(null);
    const [crawlerConfig, setCrawlerConfig] = useState(JSON.stringify({
        "word_count_threshold": 10,
        "extraction_strategy": "markdown",
        "cache_mode": "bypass"
    }, null, 2));

    const { discoverModels } = useOllama();
    const [ollamaModels, setOllamaModels] = useState<OllamaModelInfo[]>([]);

    const { getCrawl4AiSettings, updateCrawl4AiSettings } = useRagContext();

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getCrawl4AiSettings();
            if (settings) {
                if (settings.browser_config) {
                    setBrowserConfig(JSON.stringify(settings.browser_config, null, 2));
                    // Update visual states from loaded config
                    const bc = settings.browser_config;
                    if (bc.headless !== undefined) setHeadless(bc.headless);
                    if (bc.user_agent !== undefined) setUserAgent(bc.user_agent);
                    if (bc.viewport_width !== undefined) setViewportWidth(bc.viewport_width);
                    if (bc.viewport_height !== undefined) setViewportHeight(bc.viewport_height);
                    if (bc.proxy !== undefined) setProxy(bc.proxy);
                    if (bc.proxy_config?.server !== undefined) setProxy(bc.proxy_config.server);
                    if (bc.enable_stealth !== undefined) setEnableStealth(bc.enable_stealth);
                    if (bc.accept_downloads !== undefined) setAcceptDownloads(bc.accept_downloads);
                    if (bc.downloads_path !== undefined) setDownloadsPath(bc.downloads_path);
                }
                if (settings.crawler_config) {
                    setCrawlerConfig(JSON.stringify(settings.crawler_config, null, 2));
                    // Update visual states from loaded config
                    let cc = settings.crawler_config;
                    if (cc.type === "CrawlerRunConfig" && cc.params) {
                        cc = cc.params;
                    }

                    if (cc.word_count_threshold !== undefined) setWordCountThreshold(cc.word_count_threshold);

                    if (cc.extraction_strategy !== undefined) {
                        const es = cc.extraction_strategy;
                        const esType = typeof es === 'string' ? es : (es.type || "");
                        const esParams = (typeof es === 'object' && es.params) ? es.params : {};

                        if (esType === "LLMExtractionStrategy") {
                            setExtractionStrategy("llm");
                            const provider = esParams.llm_config?.provider || esParams.provider;
                            if (provider !== undefined) setLlmProvider(provider);
                            if (esParams.extraction_type !== undefined) setExtractionType(esParams.extraction_type);
                            if (esParams.chunk_token_threshold !== undefined) setChunkTokenThreshold(esParams.chunk_token_threshold);
                            if (esParams.overlap_rate !== undefined) setOverlapRate(esParams.overlap_rate);
                            if (esParams.apply_chunking !== undefined) setApplyChunking(esParams.apply_chunking);
                            if (esParams.instruction !== undefined) setExtractionQuery(esParams.instruction);
                        }
                        else if (esType === "JsonCssExtractionStrategy") setExtractionStrategy("json_css");
                        else setExtractionStrategy(esType);
                    } else {
                        setExtractionStrategy("markdown");
                    }

                    if (cc.bypass_cache !== undefined) setBypassCache(cc.bypass_cache);
                    if (cc.cache_mode !== undefined) setBypassCache(cc.cache_mode === "bypass");
                    if (cc.wait_until !== undefined) setWaitUntil(cc.wait_until);
                    if (cc.page_timeout !== undefined) setPageTimeout(cc.page_timeout);
                    if (cc.screenshot !== undefined) setScreenshot(cc.screenshot);
                    if (cc.pdf !== undefined) setPdf(cc.pdf);
                }
            }
        };
        loadSettings();
    }, [getCrawl4AiSettings]);

    // Fetch Ollama models on mount
    useEffect(() => {
        const fetchModels = async () => {
            const data = await discoverModels();
            if (data?.models) {
                setOllamaModels(data.models);
            }
        };
        fetchModels();
    }, [discoverModels]);

    // Synchronize Visual -> Advanced (Browser)
    useEffect(() => {
        if (browserMode === "visual") {
            const config = {
                headless,
                user_agent: userAgent,
                viewport_width: viewportWidth,
                viewport_height: viewportHeight,
                proxy_config: proxy ? { server: proxy } : undefined,
                enable_stealth: enableStealth,
                accept_downloads: acceptDownloads,
                downloads_path: downloadsPath || undefined
            };
            setBrowserConfig(JSON.stringify(config, null, 2));
        }
    }, [headless, userAgent, viewportWidth, viewportHeight, proxy, enableStealth, acceptDownloads, downloadsPath, browserMode]);

    // Synchronize Visual -> Advanced (Crawler)
    useEffect(() => {
        if (crawlerMode === "visual") {
            const params: any = {
                max_pages: maxPages,
                max_depth: maxDepth,
                semaphore_count: semaphoreCount,
                word_count_threshold: wordCountThreshold,
                cache_mode: bypassCache ? "bypass" : "enabled",
                wait_until: waitUntil,
                page_timeout: pageTimeout,
                screenshot: screenshot,
                pdf: pdf,
                scraping_strategy: {
                    type: "LXMLWebScrapingStrategy",
                    params: {}
                },
                table_extraction: {
                    type: "DefaultTableExtraction",
                    params: {}
                },
                exclude_social_media_domains: [
                    "facebook.com", "twitter.com", "x.com", "linkedin.com", "instagram.com",
                    "pinterest.com", "tiktok.com", "snapchat.com", "reddit.com"
                ],
                stream: true
            };

            // Map and set extraction_strategy using the type/params pattern
            if (extractionStrategy === "llm") {
                params.extraction_strategy = {
                    type: "LLMExtractionStrategy",
                    params: {
                        llm_config: {
                            provider: llmProvider,
                            base_url: llmProvider.startsWith("ollama/")
                                ? (ollamaModels.find(m => `ollama/${m.name}` === llmProvider)?.instance_url || "http://ollama:11434")
                                : undefined
                        },
                        extraction_type: extractionType,
                        input_format: "markdown",
                        chunk_token_threshold: chunkTokenThreshold,
                        overlap_rate: overlapRate,
                        apply_chunking: applyChunking,
                        instruction: extractionQuery
                    }
                };
            } else if (extractionStrategy === "json_css") {
                params.extraction_strategy = {
                    type: "JsonCssExtractionStrategy",
                    params: {} // Needs schema in advanced mode
                };
            }

            const config = {
                type: "CrawlerRunConfig",
                params: params
            };

            setCrawlerConfig(JSON.stringify(config, null, 2));
        }
    }, [maxPages, maxDepth, semaphoreCount, wordCountThreshold, extractionStrategy, bypassCache, waitUntil, pageTimeout, screenshot, pdf, extractionQuery, llmProvider, extractionType, chunkTokenThreshold, overlapRate, applyChunking, crawlerMode]);

    // Handle switching from Advanced -> Visual
    const handleBrowserModeChange = (mode: string) => {
        if (mode === "visual") {
            try {
                const bc = JSON.parse(browserConfig);
                if (bc.headless !== undefined) setHeadless(bc.headless);
                if (bc.user_agent !== undefined) setUserAgent(bc.user_agent);
                if (bc.viewport_width !== undefined) setViewportWidth(bc.viewport_width);
                if (bc.viewport_height !== undefined) setViewportHeight(bc.viewport_height);
                if (bc.proxy_config?.server !== undefined) setProxy(bc.proxy_config.server);
                else if (bc.proxy !== undefined) setProxy(bc.proxy || "");
                if (bc.enable_stealth !== undefined) setEnableStealth(bc.enable_stealth);
                if (bc.accept_downloads !== undefined) setAcceptDownloads(bc.accept_downloads);
                if (bc.downloads_path !== undefined) setDownloadsPath(bc.downloads_path || "");
            } catch (e) {
                // If invalid JSON, just stay with current visual states
            }
        }
        setBrowserMode(mode as any);
    };

    const handleCrawlerModeChange = (mode: string) => {
        if (mode === "visual") {
            try {
                let cc = JSON.parse(crawlerConfig);
                if (cc.type === "CrawlerRunConfig" && cc.params) {
                    cc = cc.params;
                }

                if (cc.max_pages !== undefined) setMaxPages(cc.max_pages);
                if (cc.max_depth !== undefined) setMaxDepth(cc.max_depth);
                if (cc.semaphore_count !== undefined) setSemaphoreCount(cc.semaphore_count);
                if (cc.word_count_threshold !== undefined) setWordCountThreshold(cc.word_count_threshold);
                if (cc.extraction_strategy !== undefined) {
                    const es = cc.extraction_strategy;
                    const esType = typeof es === 'string' ? es : (es.type || "");
                    const esParams = (typeof es === 'object' && es.params) ? es.params : {};

                    if (esType === "LLMExtractionStrategy") {
                        setExtractionStrategy("llm");
                        const provider = esParams.llm_config?.provider || esParams.provider;
                        if (provider !== undefined) setLlmProvider(provider);
                        if (esParams.extraction_type !== undefined) setExtractionType(esParams.extraction_type);
                        if (esParams.chunk_token_threshold !== undefined) setChunkTokenThreshold(esParams.chunk_token_threshold);
                        if (esParams.overlap_rate !== undefined) setOverlapRate(esParams.overlap_rate);
                        if (esParams.apply_chunking !== undefined) setApplyChunking(esParams.apply_chunking);
                        if (esParams.instruction !== undefined) setExtractionQuery(esParams.instruction);
                    }
                    else if (esType === "JsonCssExtractionStrategy") setExtractionStrategy("json_css");
                    else setExtractionStrategy(esType);
                } else {
                    setExtractionStrategy("markdown");
                }

                if (cc.bypass_cache !== undefined) setBypassCache(cc.bypass_cache);
                if (cc.cache_mode !== undefined) setBypassCache(cc.cache_mode === "bypass");
                if (cc.wait_until !== undefined) setWaitUntil(cc.wait_until);
                if (cc.page_timeout !== undefined) setPageTimeout(cc.page_timeout);
                if (cc.screenshot !== undefined) setScreenshot(cc.screenshot);
                if (cc.pdf !== undefined) setPdf(cc.pdf);
            } catch (e) {
                // If invalid JSON, just stay with current visual states
            }
        }
        setCrawlerMode(mode as any);
    };

    const handleSaveSettings = async () => {
        let bConfig = {};
        let cConfig = {};

        try {
            bConfig = JSON.parse(browserConfig);
        } catch (e) {
            toast.error("Invalid Browser Config JSON");
            return;
        }

        try {
            cConfig = JSON.parse(crawlerConfig);
        } catch (e) {
            toast.error("Invalid Crawler Config JSON");
            return;
        }

        const saveToast = toast.loading("Saving settings...");
        try {
            await updateCrawl4AiSettings({
                browser_config: bConfig,
                crawler_config: cConfig
            });
            toast.success("Settings saved successfully!");
        } catch (error: any) {
            toast.error("Failed to save settings");
        } finally {
            toast.dismiss(saveToast);
        }
    };

    const handleStartCrawl = async () => {
        if (!urls.trim()) {
            toast.error(t('enter_url'));
            return;
        }

        let finalBrowserConfig = {};
        let finalCrawlerConfig = {};

        try {
            if (browserMode === "advanced") {
                finalBrowserConfig = JSON.parse(browserConfig);
            } else {
                finalBrowserConfig = {
                    headless,
                    user_agent: userAgent,
                    viewport_width: viewportWidth,
                    viewport_height: viewportHeight,
                    proxy: proxy || undefined,
                    accept_downloads: acceptDownloads,
                    downloads_path: downloadsPath || undefined
                };
            }
        } catch (e) {
            toast.error("Invalid Browser Config JSON");
            return;
        }

        try {
            // Always parse from crawlerConfig to ensure consistency (it syncs from visual mode anyway)
            finalCrawlerConfig = JSON.parse(crawlerConfig);
        } catch (e) {
            toast.error("Invalid Crawler Config JSON");
            return;
        }

        const payload = {
            urls: urls.split('\n').filter(u => u.trim()),
            browser_config: finalBrowserConfig,
            crawler_config: finalCrawlerConfig,
            collection_id: selectedCollection?.uuid
        };

        setLoading(true);
        try {
            const result = await startCrawlJob(payload);
            const taskId = result.task_id || (result as any).id || (result as any).taskId || 'Unknown';
            toast.success(`Crawl job ${taskId.slice(0, 8)} initiated successfully!`);
        } catch (error: any) {
            toast.error(error.message || "Failed to start crawl job");
        } finally {
            setLoading(false);
        }
    };

    const { llmExtract } = useRagContext();

    const handleQuickLlmExtract = async () => {
        if (!urls.trim()) {
            toast.error(t('enter_url'));
            return;
        }
        if (!extractionQuery.trim()) {
            toast.error(t('crawler_extraction_query_label'));
            return;
        }

        setLoading(true);
        try {
            const firstUrl = urls.split('\n')[0].trim();
            const result = await llmExtract({
                url: firstUrl,
                q: extractionQuery,
                llm_config: {
                    provider: llmProvider,
                    base_url: llmProvider.startsWith("ollama/")
                        ? (ollamaModels.find(m => `ollama/${m.name}` === llmProvider)?.instance_url || "http://ollama:11434")
                        : undefined
                }
            });
            setExtractionResult(result);
            toast.success(t('conversion_successful'));
        } catch (error: any) {
            toast.error(error.message || "Failed to extract with LLM");
        } finally {
            setLoading(false);
        }
    };

    const ConfigField = ({ label, description, children, isSwitch = false }: { label: string, description: string, children: React.ReactNode, isSwitch?: boolean }) => (
        <div className={`flex ${isSwitch ? 'flex-row items-center justify-between' : 'flex-col'} gap-2 p-3 rounded-lg bg-background/30 border border-white/5`}>
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{label}</Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="size-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                            <p className="max-w-xs">{description}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            {children}
        </div>
    );

    return (
        <div className="space-y-6">
            <Card className="glass-card neon-border-purple border-none">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Globe className="size-5" />
                        </div>
                        <div>
                            <CardTitle>Crawl4AI</CardTitle>
                            <CardDescription>
                                Advanced web crawling and extraction powered by Crawl4AI.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="urls">Target URLs (one per line)</Label>
                        <Textarea
                            id="urls"
                            placeholder="https://example.com"
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            className="min-h-[100px] bg-background/50"
                        />
                    </div>

                    <Tabs defaultValue="browser" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-background/20">
                            <TabsTrigger value="browser" className="gap-2">
                                <Settings className="size-4" />
                                Browser
                            </TabsTrigger>
                            <TabsTrigger value="crawler" className="gap-2">
                                <Code className="size-4" />
                                Crawler
                            </TabsTrigger>
                            <TabsTrigger value="webhook" className="gap-2">
                                <Webhook className="size-4" />
                                Webhook
                            </TabsTrigger>
                            <TabsTrigger value="monitor" className="gap-2">
                                <Activity className="size-4" />
                                {t('monitor')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="browser" className="space-y-4 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSaveSettings}
                                    className="h-8 gap-2 border-white/10 hover:bg-white/5"
                                >
                                    <Save className="size-3.5" />
                                    {t('settings_save')}
                                </Button>
                                <Tabs value={browserMode} onValueChange={handleBrowserModeChange} className="w-auto">
                                    <TabsList className="bg-background/20 h-8">
                                        <TabsTrigger value="visual" className="text-xs">{t('settings_visual')}</TabsTrigger>
                                        <TabsTrigger value="advanced" className="text-xs">{t('settings_advanced')}</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {browserMode === "visual" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ConfigField label={t('browser_headless_label')} description={t('browser_headless_desc')} isSwitch>
                                        <Switch checked={headless} onCheckedChange={setHeadless} />
                                    </ConfigField>
                                    <ConfigField label={t('browser_user_agent_label')} description={t('browser_user_agent_desc')}>
                                        <Input value={userAgent} onChange={(e) => setUserAgent(e.target.value)} className="bg-background/50 h-8" />
                                    </ConfigField>
                                    <ConfigField label={t('browser_viewport_width_label')} description={t('browser_viewport_width_desc')}>
                                        <Input type="number" value={viewportWidth} onChange={(e) => setViewportWidth(parseInt(e.target.value))} className="bg-background/50 h-8" />
                                    </ConfigField>
                                    <ConfigField label={t('browser_viewport_height_label')} description={t('browser_viewport_height_desc')}>
                                        <Input type="number" value={viewportHeight} onChange={(e) => setViewportHeight(parseInt(e.target.value))} className="bg-background/50 h-8" />
                                    </ConfigField>
                                    <ConfigField label={t('browser_proxy_label')} description={t('browser_proxy_desc')}>
                                        <Input value={proxy} onChange={(e) => setProxy(e.target.value)} placeholder="http://proxy:port" className="bg-background/50 h-8" />
                                    </ConfigField>
                                    <ConfigField label={t('browser_accept_downloads_label')} description={t('browser_accept_downloads_desc')} isSwitch>
                                        <Switch checked={acceptDownloads} onCheckedChange={setAcceptDownloads} />
                                    </ConfigField>
                                    <ConfigField label={t('browser_downloads_path_label')} description={t('browser_downloads_path_desc')}>
                                        <Input value={downloadsPath} onChange={(e) => setDownloadsPath(e.target.value)} placeholder="/path/to/downloads" className="bg-background/50 h-8" />
                                    </ConfigField>
                                    <ConfigField label={t('browser_stealth_label')} description={t('browser_stealth_desc')} isSwitch>
                                        <Switch checked={enableStealth} onCheckedChange={setEnableStealth} />
                                    </ConfigField>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Browser Configuration (JSON)</Label>
                                    <Textarea
                                        value={browserConfig}
                                        onChange={(e) => setBrowserConfig(e.target.value)}
                                        className="font-mono text-sm min-h-[200px] bg-background/50"
                                    />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="crawler" className="space-y-4 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSaveSettings}
                                    className="h-8 gap-2 border-white/10 hover:bg-white/5"
                                >
                                    <Save className="size-3.5" />
                                    {t('settings_save')}
                                </Button>
                                <Tabs value={crawlerMode} onValueChange={handleCrawlerModeChange} className="w-auto">
                                    <TabsList className="bg-background/20 h-8">
                                        <TabsTrigger value="visual" className="text-xs">{t('settings_visual')}</TabsTrigger>
                                        <TabsTrigger value="advanced" className="text-xs">{t('settings_advanced')}</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {crawlerMode === "visual" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ConfigField label="Max Pages" description="Maximum number of pages to crawl.">
                                        <Input type="number" value={maxPages} onChange={(e) => setMaxPages(parseInt(e.target.value) || 100)} className="bg-background/50 h-8" />
                                    </ConfigField>
                                    <ConfigField label="Max Depth" description="Maximum depth of link traversal.">
                                        <Input type="number" value={maxDepth} onChange={(e) => setMaxDepth(parseInt(e.target.value) || 3)} className="bg-background/50 h-8" />
                                    </ConfigField>
                                    <ConfigField label="Concurrent Requests" description="Number of concurrent pages to crawl.">
                                        <Input type="number" value={semaphoreCount} onChange={(e) => setSemaphoreCount(parseInt(e.target.value) || 3)} className="bg-background/50 h-8" />
                                    </ConfigField>
                                    <ConfigField label={t('crawler_bypass_cache_label')} description={t('crawler_bypass_cache_desc')} isSwitch>
                                        <Switch checked={bypassCache} onCheckedChange={setBypassCache} />
                                    </ConfigField>
                                    <ConfigField label={t('crawler_screenshot_label')} description={t('crawler_screenshot_desc')} isSwitch>
                                        <Switch checked={screenshot} onCheckedChange={setScreenshot} />
                                    </ConfigField>
                                    <ConfigField label={t('crawler_pdf_label')} description={t('crawler_pdf_desc')} isSwitch>
                                        <Switch checked={pdf} onCheckedChange={setPdf} />
                                    </ConfigField>
                                    <ConfigField label={t('crawler_word_count_threshold_label')} description={t('crawler_word_count_threshold_desc')}>
                                        <Input type="number" value={wordCountThreshold} onChange={(e) => setWordCountThreshold(parseInt(e.target.value))} className="bg-background/50 h-8" />
                                    </ConfigField>
                                    <ConfigField label={t('crawler_extraction_strategy_label')} description={t('crawler_extraction_strategy_desc')}>
                                        <Select value={extractionStrategy} onValueChange={setExtractionStrategy}>
                                            <SelectTrigger className="bg-background/50 h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="markdown">Markdown</SelectItem>
                                                <SelectItem value="json_css">JSON CSS</SelectItem>
                                                <SelectItem value="llm">LLM</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </ConfigField>

                                    {extractionStrategy === 'llm' && (
                                        <>
                                            <ConfigField label={t('crawler_llm_provider_label')} description={t('crawler_llm_provider_desc')}>
                                                <Select
                                                    value={llmProvider}
                                                    onValueChange={setLlmProvider}
                                                >
                                                    <SelectTrigger className="bg-background/50 h-8">
                                                        <SelectValue placeholder="Select a model" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ollamaModels.map((model) => (
                                                            <SelectItem key={model.name} value={`ollama/${model.name}`}>
                                                                {model.name}
                                                            </SelectItem>
                                                        ))}
                                                        {ollamaModels.length === 0 && (
                                                            <SelectItem value="ollama/llama3" disabled>
                                                                No models found (default: llama3)
                                                            </SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </ConfigField>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <ConfigField label={t('crawler_extraction_type_label')} description={t('crawler_extraction_type_desc')}>
                                                    <Select value={extractionType} onValueChange={(v: any) => setExtractionType(v)}>
                                                        <SelectTrigger className="bg-background/50 h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="block">Block (Best for articles)</SelectItem>
                                                            <SelectItem value="schema">Schema (Best for data)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </ConfigField>
                                                <div className="flex items-center justify-between h-full pt-6">
                                                    <ConfigField label={t('crawler_apply_chunking_label')} description={t('crawler_apply_chunking_desc')} isSwitch>
                                                        <Switch checked={applyChunking} onCheckedChange={setApplyChunking} />
                                                    </ConfigField>
                                                </div>
                                            </div>

                                            {applyChunking && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <ConfigField label={t('crawler_chunk_token_threshold_label')} description={t('crawler_chunk_token_threshold_desc')}>
                                                        <Input type="number" value={chunkTokenThreshold} onChange={(e) => setChunkTokenThreshold(parseInt(e.target.value))} className="bg-background/50 h-8" />
                                                    </ConfigField>
                                                    <ConfigField label={t('crawler_overlap_rate_label')} description={t('crawler_overlap_rate_desc')}>
                                                        <Input type="number" step="0.01" value={overlapRate} onChange={(e) => setOverlapRate(parseFloat(e.target.value))} className="bg-background/50 h-8" />
                                                    </ConfigField>
                                                </div>
                                            )}

                                            <ConfigField label={t('crawler_extraction_query_label')} description={t('crawler_extraction_query_desc')}>
                                                <Textarea value={extractionQuery} onChange={(e) => setExtractionQuery(e.target.value)} className="bg-background/50 min-h-[80px]" placeholder="Extract the main points and summary..." />
                                            </ConfigField>
                                        </>
                                    )}
                                    <ConfigField label={t('crawler_wait_until_label')} description={t('crawler_wait_until_desc')}>
                                        <Select value={waitUntil} onValueChange={setWaitUntil}>
                                            <SelectTrigger className="bg-background/50 h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="domcontentloaded">DOM Content Loaded</SelectItem>
                                                <SelectItem value="load">Load</SelectItem>
                                                <SelectItem value="networkidle">Network Idle</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </ConfigField>
                                    <ConfigField label={t('crawler_page_timeout_label')} description={t('crawler_page_timeout_desc')}>
                                        <Input type="number" value={pageTimeout} onChange={(e) => setPageTimeout(parseInt(e.target.value))} className="bg-background/50 h-8" />
                                    </ConfigField>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Crawler Configuration (JSON)</Label>
                                    <Textarea
                                        value={crawlerConfig}
                                        onChange={(e) => setCrawlerConfig(e.target.value)}
                                        className="font-mono text-sm min-h-[200px] bg-background/50"
                                    />
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="webhook" className="space-y-4 pt-4">
                            <div className="p-8 border-2 border-dashed rounded-xl text-center text-muted-foreground">
                                Webhook configuration coming soon...
                            </div>
                        </TabsContent>

                        <TabsContent value="monitor" className="pt-4">
                            <CrawlMonitor />
                        </TabsContent>
                    </Tabs>

                    <div className="flex gap-2">
                        <Button
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                            onClick={handleStartCrawl}
                            disabled={loading || !urls.trim()}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Initiating...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Run Crawl Job
                                </>
                            )}
                        </Button>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={handleQuickLlmExtract}
                                        disabled={loading || !urls.trim() || !extractionQuery.trim()}
                                        className="border-primary/20 hover:bg-primary/10"
                                    >
                                        <Code className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('quick_llm_extract')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {extractionResult && (
                        <Card className="mt-4 border-primary/20 bg-primary/5">
                            <CardHeader className="py-2">
                                <CardTitle className="text-sm flex items-center justify-between">
                                    <span>{t('llm_extraction_result')}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setExtractionResult(null)} h-6 w-6 p-0>
                                        <Info className="h-3 w-3" />
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2 overflow-auto max-h-[200px]">
                                <pre className="text-xs font-mono">{JSON.stringify(extractionResult, null, 2)}</pre>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
