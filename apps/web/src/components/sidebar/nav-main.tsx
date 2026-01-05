"use client";

import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/providers/Language";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-foreground/40 font-black">Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => (
          <NextLink
            href={item.url}
            key={`${item.title}-${index}`}
          >
            <SidebarMenuItem
              className={cn(
                pathname === item.url &&
                "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <SidebarMenuButton tooltip={t(item.title)}>
                {item.icon && <item.icon />}
                <span className="font-medium">{t(item.title)}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </NextLink>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
