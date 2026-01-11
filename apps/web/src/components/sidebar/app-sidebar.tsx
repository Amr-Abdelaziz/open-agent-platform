"use client";

import * as React from "react";
import { Wrench, Bot, MessageCircle, Brain, Shield, Network } from "lucide-react";

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
import { useAuthContext } from "@/providers/Auth";

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
    {
      title: "organization",
      url: "/organization",
      icon: Network,
    },
    {
      title: "admin",
      url: "/admin",
      icon: Shield,
      isAdminOnly: true
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthContext();
  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-transparent"
      {...props}
    >
      <div className="absolute inset-0 bg-background/50 backdrop-blur-xl -z-10" />
      <SiteHeader />
      <SidebarContent>
        <NavMain items={data.navMain.filter(item => {
          if (!item.isAdminOnly) return true;
          // Check if user email is amr2@dr-ai.tech or amr2@admin for manual bypass
          // or if the profile is synced (best to check user metadata)
          const adminEmails = ["amr2@dr-ai.tech", "amr2@admin"];
          return adminEmails.includes(user?.email || "");
        })} />
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
