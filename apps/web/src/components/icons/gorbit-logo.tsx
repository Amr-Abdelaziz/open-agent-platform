"use client";

import React from "react";
import { Orbit, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export function GorbitLogo({ className, ...props }: LucideProps) {
    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <Orbit
                className="size-full text-primary animate-[spin_10s_linear_infinite]"
                {...props}
            />
            <div className="absolute size-[40%] bg-primary/20 rounded-full blur-sm animate-pulse" />
            <div className="absolute size-[20%] bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
        </div>
    );
}
