"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, ChevronRight, ChevronDown, Building2,
    UserCircle, ShieldCheck, Briefcase, RefreshCw,
    Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchOrgUserProfiles, type OrgUserProfile } from "@/lib/org-api";
import { useOrganizationContext } from "@/providers/Organization";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HierarchyGroup {
    departmentId: string | null;
    departmentAr: string;
    departmentEn: string;
    delegationLevel: number;
    ragCollection: string | null;
    jobTitleGroups: {
        jobTitle: string;
        members: OrgUserProfile[];
    }[];
    totalMembers: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HierarchyView() {
    const { departments, loading: orgLoading } = useOrganizationContext();
    const [profiles, setProfiles] = useState<OrgUserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

    const loadProfiles = async () => {
        setLoading(true);
        try {
            const data = await fetchOrgUserProfiles();
            setProfiles(data);
            // Auto-expand the first dept with members
            if (data.length > 0) {
                const firstDept = data[0].department;
                if (firstDept) setExpandedDepts({ [firstDept]: true });
            }
        } catch (err) {
            console.error("[HierarchyView] error:", err);
            toast.error("فشل تحميل بيانات الهيكل التنظيمي من قاعدة البيانات");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfiles();
    }, []);

    const toggleDept = (key: string) =>
        setExpandedDepts(prev => ({ ...prev, [key]: !prev[key] }));

    // ── Build hierarchy: merge departments (from Supabase) with user profiles ──
    const hierarchy = useMemo<HierarchyGroup[]>(() => {
        // Start with all known org_departments (even empty ones)
        const deptMap = new Map<string, HierarchyGroup>();

        for (const dept of departments) {
            deptMap.set(dept.id, {
                departmentId: dept.id,
                departmentAr: dept.name_ar,
                departmentEn: dept.name_en,
                delegationLevel: dept.delegation_level,
                ragCollection: dept.rag_collection ?? null,
                jobTitleGroups: [],
                totalMembers: 0,
            });
        }

        // Group profiles into their dept slots
        for (const profile of profiles) {
            // Try to resolve by department_id first, then by name match
            const deptId = profile.department_id
                ?? departments.find(d => d.name_ar === profile.department)?.id
                ?? null;

            const key = deptId ?? (profile.department || "غير محدد");

            if (!deptMap.has(key)) {
                // Unknown dept — create a fallback group
                deptMap.set(key, {
                    departmentId: null,
                    departmentAr: profile.department ?? "غير محدد",
                    departmentEn: profile.department ?? "Unassigned",
                    delegationLevel: 99,
                    ragCollection: null,
                    jobTitleGroups: [],
                    totalMembers: 0,
                });
            }

            const group = deptMap.get(key)!;
            const jobTitle = profile.job_title ?? "بدون مسمى";
            let jtGroup = group.jobTitleGroups.find(j => j.jobTitle === jobTitle);
            if (!jtGroup) {
                jtGroup = { jobTitle, members: [] };
                group.jobTitleGroups.push(jtGroup);
            }
            jtGroup.members.push(profile);
            group.totalMembers++;
        }

        // Sort by delegationLevel then name
        return Array.from(deptMap.values()).sort((a, b) =>
            a.delegationLevel - b.delegationLevel || a.departmentAr.localeCompare(b.departmentAr, "ar")
        );
    }, [departments, profiles]);

    // ── Loading ───────────────────────────────────────────────────────────────

    if (loading || orgLoading) {
        return (
            <div className="space-y-4 p-6">
                <Skeleton className="h-10 w-72" />
                <div className="grid grid-cols-1 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                </div>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Users className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight" dir="rtl">
                            الهيكل التنظيمي
                        </h1>
                        <p className="text-muted-foreground text-sm" dir="rtl">
                            هيكل الإدارات والمسميات الوظيفية — من قاعدة البيانات
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={loadProfiles}>
                    <RefreshCw className="size-4" />
                    تحديث
                </Button>
            </header>

            {/* Empty state */}
            {profiles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Info className="size-10 opacity-20" />
                    <p className="text-sm" dir="rtl">
                        لا يوجد موظفون مسجلون في <code className="text-xs bg-muted px-1 rounded">org_user_profiles</code> بعد.
                    </p>
                    <p className="text-xs opacity-60" dir="rtl">
                        يُعرض الهيكل التنظيمي للإدارات بناءً على بيانات <code className="text-xs bg-muted px-1 rounded">org_departments</code>
                    </p>
                </div>
            )}

            {/* Hierarchy Cards */}
            <div className="grid grid-cols-1 gap-4">
                {hierarchy.map((group, idx) => {
                    const key = group.departmentId ?? group.departmentAr;
                    const isExpanded = !!expandedDepts[key];
                    const hasMembers = group.totalMembers > 0;

                    return (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Card className={`overflow-hidden border-none glass-card transition-all duration-300 ${hasMembers ? "hover:shadow-purple-500/10" : "opacity-70"}`}>
                                {/* Department Header */}
                                <CardHeader
                                    className="cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors py-4 px-6"
                                    onClick={() => toggleDept(key)}
                                    dir="rtl"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-xl shadow-sm ${hasMembers ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"}`}>
                                                <Building2 className="size-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold">{group.departmentAr}</CardTitle>
                                                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                                                    <span>{group.totalMembers} موظف</span>
                                                    <span>·</span>
                                                    <span>{group.jobTitleGroups.length} مسمى وظيفي</span>
                                                    {group.ragCollection && (
                                                        <>
                                                            <span>·</span>
                                                            <span className="font-mono opacity-60">{group.ragCollection}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] font-black uppercase">
                                                L{group.delegationLevel === 99 ? "?" : group.delegationLevel}
                                            </Badge>
                                            {isExpanded
                                                ? <ChevronDown className="size-4 text-muted-foreground" />
                                                : <ChevronRight className="size-4 text-muted-foreground" />
                                            }
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Job-Title Groups + Members */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                        >
                                            <CardContent className="p-6 bg-background/10 backdrop-blur-sm" dir="rtl">
                                                {group.jobTitleGroups.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground text-center py-4 opacity-60">
                                                        لا يوجد موظفون في هذه الإدارة بعد
                                                    </p>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                        {group.jobTitleGroups.map(({ jobTitle, members }) => (
                                                            <div key={jobTitle} className="space-y-3">
                                                                {/* Role header */}
                                                                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                                                                    <Briefcase className="size-3.5 text-primary/60" />
                                                                    <h3 className="font-bold text-xs uppercase tracking-widest text-primary/80">
                                                                        {jobTitle}
                                                                    </h3>
                                                                    <Badge variant="secondary" className="ml-auto text-[9px] font-bold">
                                                                        {members.length}
                                                                    </Badge>
                                                                </div>
                                                                {/* Members */}
                                                                <div className="flex flex-col gap-2">
                                                                    {members.map((member) => (
                                                                        <motion.div
                                                                            key={member.user_id}
                                                                            whileHover={{ x: -4 }}
                                                                            className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-white/5 hover:border-primary/20 hover:bg-background/60 transition-all"
                                                                        >
                                                                            <div className="relative shrink-0">
                                                                                <div className="size-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10">
                                                                                    <UserCircle className="size-5 text-foreground/50" />
                                                                                </div>
                                                                                {member.is_admin && (
                                                                                    <div className="absolute -top-1 -left-1 p-0.5 bg-background rounded-full border border-border shadow-sm">
                                                                                        <ShieldCheck className="size-3 text-emerald-500" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className="font-semibold text-sm truncate">
                                                                                    {member.email ? member.email.split("@")[0] : "مستخدم"}
                                                                                </span>
                                                                                <span className="text-[10px] text-muted-foreground truncate font-mono opacity-60">
                                                                                    {member.email ?? member.user_id}
                                                                                </span>
                                                                            </div>
                                                                            {member.hierarchy_level && (
                                                                                <Badge variant="outline" className="shrink-0 text-[9px] text-muted-foreground mr-auto">
                                                                                    L{member.hierarchy_level}
                                                                                </Badge>
                                                                            )}
                                                                        </motion.div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
