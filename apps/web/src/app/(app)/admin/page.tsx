"use client";

import AdminInterface from "@/features/admin";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { useAuthContext } from "@/providers/Auth";
import { redirect } from "next/navigation";

/**
 * The /admin page.
 * Accessible only via specific routes or admin status check.
 */
export default function AdminPage(): React.ReactNode {
    return (
        <React.Suspense fallback={<div>Loading Area...</div>}>
            <Toaster />
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="flex items-center gap-2">
                                    Admin Console
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <AdminInterface />
        </React.Suspense>
    );
}
