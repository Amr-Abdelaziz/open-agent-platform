"use client";

import * as React from "react";
import { Wrench, Bot, MessageCircle, Brain } from "lucide-react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { ModeToggle } from "../mode-toggle";
import { useLanguage } from "@/providers/Language";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SiteHeader } from "./sidebar-header";

// This is sample data.
const data = {
  navMain: [
    {
      title: "chat",
      url: "/",
      icon: MessageCircle,
    },
    {
      title: "agents",
      url: "/agents",
      icon: Bot,
    },
    {
      title: "tools",
      url: "/tools",
      icon: Wrench,
    },
    // {
    //   title: "Inbox",
    //   url: "/inbox",
    //   icon: Inbox,
    // },
    {
      title: "rag",
      url: "/rag",
      icon: Brain,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-transparent"
      {...props}
    >
      <div className="absolute inset-0 bg-background/50 backdrop-blur-xl -z-10" />
      <SiteHeader />
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="gap-2 p-2">
        <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:hidden">
          <ModeToggle />
        </div>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
