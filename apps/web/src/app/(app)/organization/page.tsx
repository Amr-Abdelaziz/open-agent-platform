import { Suspense } from "react";
import { HierarchyView } from "@/features/organization/HierarchyView";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function OrganizationPage() {
    return (
        <div className="flex flex-col h-full bg-background/50">
            <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b border-white/5 backdrop-blur-md sticky top-0 z-30">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/">Gorbit</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Organization</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <Suspense fallback={
                    <div className="flex items-center justify-center h-full">
                        <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                }>
                    <HierarchyView />
                </Suspense>
            </main>
        </div>
    );
}
