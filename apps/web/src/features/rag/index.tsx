"use client";

import type React from "react";
import { useState } from "react";
import {
  DocumentsCard,
  DocumentsCardLoading,
} from "./components/documents-card";
import {
  CollectionsCard,
  CollectionsCardLoading,
} from "./components/collections-card";
import { useRagContext } from "./providers/RAG";
import EmptyCollectionsState from "./components/empty-collections";
import { OllamaHealthStatus } from "./components/ollama-health-status";
import { ActiveEmbeddingModel } from "./components/active-embedding-model";
import { StorageBrowser } from "./components/storage-browser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { DocumentConverter } from "./components/document-converter";
import { PdfToMarkdown } from "./components/pdf-to-markdown";
import { HybridChunkingStatusList } from "./components/hybrid-chunking-status-list";
import { LayoutGrid, HardDrive, Activity, FileScan, FileText } from "lucide-react";

export default function RAGInterface() {
  const {
    selectedCollection,
    setSelectedCollection,
    collections,
    initialSearchExecuted,
  } = useRagContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("collections");

  if (initialSearchExecuted && !collections.length) {
    return <EmptyCollectionsState />;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center glass-card p-4 rounded-xl neon-border-purple relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent drop-shadow-sm">
          Gorbit Knowledge Base
        </h1>
        <div className="flex items-center gap-3">
          <ActiveEmbeddingModel />
          <OllamaHealthStatus />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Sidebar Section */}
        <div className={`${(activeTab === 'storage' || activeTab === 'tasks' || activeTab === 'converter' || activeTab === 'pdf-to-md') ? 'md:col-span-3' : 'md:col-span-1'} space-y-6 transition-all duration-300`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-5 bg-background/20 backdrop-blur-md border border-white/5 p-1 h-11 mb-4 rounded-xl ${(activeTab === 'storage' || activeTab === 'tasks' || activeTab === 'converter' || activeTab === 'pdf-to-md') ? 'w-full max-w-4xl mx-auto' : 'w-full'}`}>
              <TabsTrigger value="collections" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg transition-all">
                <LayoutGrid className="size-4" />
                Collections
              </TabsTrigger>
              <TabsTrigger value="storage" className="gap-2 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500 rounded-lg transition-all">
                <HardDrive className="size-4" />
                Storage
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-500 rounded-lg transition-all">
                <Activity className="size-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="converter" className="gap-2 data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-500 rounded-lg transition-all">
                <FileScan className="size-4" />
                Converter
              </TabsTrigger>
              <TabsTrigger value="pdf-to-md" className="gap-2 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500 rounded-lg transition-all">
                <FileText className="size-4" />
                PDF to MD
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collections" className="space-y-6 mt-0 focus-visible:outline-none">
              {initialSearchExecuted ? (
                <CollectionsCard
                  collections={collections}
                  selectedCollection={selectedCollection}
                  setSelectedCollection={setSelectedCollection}
                  setCurrentPage={setCurrentPage}
                />
              ) : (
                <CollectionsCardLoading />
              )}
            </TabsContent>

            <TabsContent value="storage" className="mt-0 focus-visible:outline-none">
              <div className={activeTab === 'storage' ? 'max-w-4xl mx-auto' : ''}>
                <StorageBrowser />
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-0 focus-visible:outline-none">
              <div className={activeTab === 'tasks' ? 'max-w-5xl mx-auto' : ''}>
                <Card className="glass-card neon-border-amber border-none p-6">
                  {selectedCollection ? (
                    <HybridChunkingStatusList collectionId={selectedCollection.uuid} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Please select a collection to view tasks
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="converter" className="mt-0 focus-visible:outline-none">
              <div className={activeTab === 'converter' ? 'max-w-4xl mx-auto' : ''}>
                <DocumentConverter />
              </div>
            </TabsContent>

            <TabsContent value="pdf-to-md" className="mt-0 focus-visible:outline-none">
              <div className={activeTab === 'pdf-to-md' ? 'max-w-6xl mx-auto' : ''}>
                <PdfToMarkdown />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Documents Section */}
        {activeTab === 'collections' && (
          <div className="md:col-span-2 anime-fade-in space-y-6">
            {initialSearchExecuted ? (
              <>
                <DocumentsCard
                  selectedCollection={selectedCollection}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                />
                {selectedCollection && (
                  <Card className="glass-card neon-border-blue border-none p-6">
                    <HybridChunkingStatusList collectionId={selectedCollection.uuid} />
                  </Card>
                )}
              </>
            ) : (
              <DocumentsCardLoading />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
