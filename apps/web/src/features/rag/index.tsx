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

export default function RAGInterface() {
  const {
    selectedCollection,
    setSelectedCollection,
    collections,
    initialSearchExecuted,
  } = useRagContext();
  const [currentPage, setCurrentPage] = useState(1);

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
        {/* Collections Section */}
        <div className="md:col-span-1">
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
        </div>

        {/* Documents Section */}
        <div className="md:col-span-2">
          {initialSearchExecuted ? (
            <DocumentsCard
              selectedCollection={selectedCollection}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          ) : (
            <DocumentsCardLoading />
          )}
        </div>
      </div>
    </div>
  );
}
