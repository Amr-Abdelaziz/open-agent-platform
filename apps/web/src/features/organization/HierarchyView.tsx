"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/providers/Auth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    ChevronRight,
    ChevronDown,
    Building2,
    UserCircle,
    ShieldCheck,
    Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
    user_id: string;
    email: string;
    department: string;
    job_title: string;
    is_admin: boolean;
}

interface HierarchyData {
    [department: string]: {
        [jobTitle: string]: Profile[];
    };
}

export function HierarchyView() {
    const { session } = useAuthContext();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDeps, setExpandedDeps] = useState<Record<string, boolean>>({});

    const fetchProfiles = async () => {
        const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
        if (!ragApiUrl || !session?.accessToken) return;

        try {
            const response = await fetch(`${ragApiUrl}/api/profiles/hierarchy`, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProfiles(data);
                // Expand first department by default
                if (data.length > 0) {
                    const firstDep = data[0].department;
                    setExpandedDeps({ [firstDep]: true });
                }
            } else {
                toast.error("Failed to fetch organization data");
            }
        } catch (error) {
            console.error("Error fetching profiles:", error);
            toast.error("CORS or Connection Error. Make sure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, [session?.accessToken]);

    const toggleDep = (dep: string) => {
        setExpandedDeps(prev => ({ ...prev, [dep]: !prev[dep] }));
    };

    // Grouping logic
    const hierarchy: HierarchyData = profiles.reduce((acc, profile) => {
        const dep = profile.department || "Unassigned";
        const title = profile.job_title || "No Title";

        if (!acc[dep]) acc[dep] = {};
        if (!acc[dep][title]) acc[dep][title] = [];

        acc[dep][title].push(profile);
        return acc;
    }, {} as HierarchyData);

    if (loading) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Users className="size-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Organization Hierarchy</h1>
                </div>
                <p className="text-muted-foreground text-lg">Visualize your company structure and team members.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {Object.entries(hierarchy).map(([department, titles], depIdx) => (
                    <motion.div
                        key={department}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: depIdx * 0.1 }}
                        className="group"
                    >
                        <Card className="overflow-hidden border-none glass-card neon-border-purple/20 transition-all duration-300 hover:neon-border-purple/40">
                            <CardHeader
                                className="cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors py-4 px-6 flex flex-row items-center justify-between"
                                onClick={() => toggleDep(department)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-background rounded-xl shadow-sm">
                                        <Building2 className="size-5 text-secondary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold">{department}</CardTitle>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                            {Object.values(titles).flat().length} Members · {Object.keys(titles).length} Roles
                                        </p>
                                    </div>
                                </div>
                                {expandedDeps[department] ? <ChevronDown className="size-5 text-muted-foreground" /> : <ChevronRight className="size-5 text-muted-foreground" />}
                            </CardHeader>

                            <AnimatePresence>
                                {expandedDeps[department] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <CardContent className="p-6 bg-background/20 backdrop-blur-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                {Object.entries(titles).map(([title, members]) => (
                                                    <div key={title} className="space-y-4">
                                                        <div className="flex items-center gap-2 px-1 border-b border-border/50 pb-2">
                                                            <Briefcase className="size-4 text-primary/70" />
                                                            <h3 className="font-bold text-sm uppercase tracking-widest text-primary/80">{title}</h3>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            {members.map((member) => (
                                                                <motion.div
                                                                    key={member.user_id}
                                                                    whileHover={{ x: 4 }}
                                                                    className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-white/5 hover:border-primary/20 hover:bg-background/60 transition-all group/member"
                                                                >
                                                                    <div className="relative">
                                                                        <div className="size-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10 overflow-hidden">
                                                                            <UserCircle className="size-6 text-foreground/50" />
                                                                        </div>
                                                                        {member.is_admin && (
                                                                            <div className="absolute -top-1 -right-1 p-0.5 bg-background rounded-full border border-border shadow-sm">
                                                                                <ShieldCheck className="size-3 text-emerald-500" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="font-semibold text-sm truncate">{member.email ? member.email.split('@')[0] : 'Unknown User'}</span>
                                                                        <span className="text-[10px] text-muted-foreground truncate font-mono opacity-60">{member.email || member.user_id}</span>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
