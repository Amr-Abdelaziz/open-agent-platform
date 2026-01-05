"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { GorbitLogo } from "../icons/gorbit-logo";
import NextLink from "next/link";

export function SiteHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            asChild
            className="flex items-center justify-center gap-2 hover:bg-transparent"
          >
            <NextLink href="/" className="flex items-center gap-3">
              <GorbitLogo className="size-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <div className="grid flex-1 text-left text-sm leading-tight transition-all group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Gorbit
                </span>
              </div>
            </NextLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}

