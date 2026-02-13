"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AgentsProvider } from "@/providers/Agents";
import { MCPProvider } from "@/providers/MCP";
import { RagProvider } from "@/features/rag/providers/RAG";

import { useLanguage } from "@/providers/Language";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { direction } = useLanguage();
  return (
    <SidebarProvider style={direction === 'rtl' ? { direction: 'rtl' } : {}}>
      <MCPProvider>
        <AgentsProvider>
          <RagProvider>
            <AppSidebar side={direction === 'rtl' ? 'right' : 'left'} />
            <SidebarInset>{children}</SidebarInset>
          </RagProvider>
        </AgentsProvider>
      </MCPProvider>
    </SidebarProvider>
  );
}
