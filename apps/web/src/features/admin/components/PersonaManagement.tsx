"use client";

import React, { useState } from "react";
import {
    Brain, Plus, Trash2, Save, X, MessageSquare, Target, Zap, Database,
    PlusCircle, UserCircle, Edit2, Wrench, Check, Building2, Layers,
    BarChart3, Loader2,
} from "lucide-react";
import { useAuthContext } from "@/providers/Auth";
import { useAgentsContext } from "@/providers/Agents";
import { useMCPContext } from "@/providers/MCP";
import { useOrganizationContext } from "@/providers/Organization";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { getDeployments } from "@/lib/environment/deployments";
import { useAgents } from "@/hooks/use-agents";
import { RefreshCw } from "lucide-react";
import { AGENT_ARCHETYPE_LABELS, HIERARCHY_LEVEL_LABELS } from "@/types/organization";
import type { AgentArchetype, HierarchyLevel, OrgPersona } from "@/types/organization";

// ─── Types ────────────────────────────────────────────────────────────────────

type PersonaDraft = OrgPersona;

// ─── Component ────────────────────────────────────────────────────────────────

export function PersonaManagement() {
    const { session } = useAuthContext();
    const { agents, refreshAgents } = useAgentsContext();
    const { createAgent } = useAgents();
    const { tools: availableTools } = useMCPContext();

    // Pull everything from OrganizationProvider (Supabase-backed)
    const {
        personas,
        departments,
        loading,
        savePersona,
        removePersona,
    } = useOrganizationContext();

    const [isSyncing, setIsSyncing] = useState(false);
    const [editingTitle, setEditingTitle] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<PersonaDraft | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // ── Edit helpers ──────────────────────────────────────────────────────────

    const handleStartEdit = (persona: OrgPersona) => {
        setEditingTitle(persona.job_title);
        setEditValues({ ...persona });
    };

    const handleAddNew = () => {
        const firstDept = departments[0];
        const newPersona: PersonaDraft = {
            job_title: "مسمى وظيفي جديد",
            persona_text: "",
            goals: [],
            rag_context: "goeic_org_docs",
            rag_collections: ["goeic_org_docs"],
            capabilities: [],
            tools: [],
            agent_type: "workgroup",
            hierarchy_level: 3,
            department: firstDept?.id,
        };
        setEditingTitle("NEW");
        setEditValues(newPersona);
    };

    const handleSave = async () => {
        if (!editValues) return;
        setIsSaving(true);
        try {
            await savePersona(editValues);
            setEditingTitle(null);
            setEditValues(null);
        } catch {
            toast.error("فشل حفظ الشخصية");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (jobTitle: string) => {
        if (!confirm(`هل أنت متأكد من حذف شخصية "${jobTitle}"؟`)) return;
        try {
            await removePersona(jobTitle);
        } catch {
            toast.error("فشل حذف الشخصية");
        }
    };

    // ── Sync all personas → create missing LangGraph agents ──────────────────

    const handleSyncAll = async () => {
        if (!confirm("سيتم التأكد من وجود وكيل لكل شخصية. الشخصيات التي لها وكيل بالفعل لن تُعدَّل. هل تريد المتابعة؟")) return;

        setIsSyncing(true);
        const deployments = getDeployments();
        const defaultDeployment = deployments.find(d => d.isDefault) || deployments[0];

        let createdCount = 0;
        let errorCount = 0;

        try {
            for (const persona of personas) {
                const exists = agents.some(a => a.name === persona.job_title);
                if (exists) continue;

                const success = await createAgent(defaultDeployment.id, defaultDeployment.defaultGraphId!, {
                    name: persona.job_title,
                    description: persona.persona_text,
                    config: { system_prompt: persona.persona_text, tools: persona.tools || [] },
                });

                if (success) createdCount++;
                else errorCount++;
            }

            if (createdCount > 0) {
                toast.success(`تم إنشاء ${createdCount} وكيل بنجاح`);
                await refreshAgents();
            } else {
                toast.info("جميع الشخصيات لها وكلاء بالفعل.");
            }
            if (errorCount > 0) toast.error(`فشل إنشاء ${errorCount} وكيل`);
        } catch (error) {
            toast.error("حدث خطأ أثناء المزامنة");
        } finally {
            setIsSyncing(false);
        }
    };

    // ── Array-field helpers ───────────────────────────────────────────────────

    const updateArrayField = (field: "goals" | "capabilities", index: number, value: string) => {
        if (!editValues) return;
        const newArr = [...(editValues[field] as string[])];
        newArr[index] = value;
        setEditValues({ ...editValues, [field]: newArr });
    };

    const addArrayItem = (field: "goals" | "capabilities") => {
        if (!editValues) return;
        setEditValues({ ...editValues, [field]: [...(editValues[field] as string[]), ""] });
    };

    const removeArrayItem = (field: "goals" | "capabilities" | "tools", index: number) => {
        if (!editValues) return;
        const newArr = (editValues[field] as string[]).filter((_, i) => i !== index);
        setEditValues({ ...editValues, [field]: newArr });
    };

    const toggleTool = (toolName: string) => {
        if (!editValues) return;
        const current = editValues.tools ?? [];
        const next = current.includes(toolName) ? current.filter(t => t !== toolName) : [...current, toolName];
        setEditValues({ ...editValues, tools: next });
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-9 w-36" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
                </div>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">مكتبة الشخصيات</h2>
                    <p className="text-sm text-muted-foreground">
                        تحديد سلوك الوكيل الذكي لكل مسمى وظيفي — البيانات من قاعدة البيانات.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleSyncAll}
                        disabled={isSyncing || personas.length === 0}
                        className="gap-2"
                    >
                        <RefreshCw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "مزامنة..." : "مزامنة الوكلاء"}
                    </Button>
                    <Button onClick={handleAddNew} className="gap-2">
                        <PlusCircle className="size-4" />
                        إضافة شخصية
                    </Button>
                </div>
            </div>

            {/* Persona Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {personas.map((p) => {
                        const dept = departments.find(d => d.id === p.department);
                        return (
                            <motion.div
                                key={p.job_title}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card className="h-full border-none glass-card hover:shadow-blue-500/10 transition-all group">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 shrink-0">
                                                <Brain className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <CardTitle className="text-base font-bold truncate">{p.job_title}</CardTitle>
                                                {dept && (
                                                    <p className="text-[10px] text-muted-foreground truncate">{dept.name_ar}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            {p.agent_type && (
                                                <Badge variant="outline" className="text-[9px] font-bold uppercase">
                                                    {AGENT_ARCHETYPE_LABELS[p.agent_type]?.ar}
                                                </Badge>
                                            )}
                                            {p.hierarchy_level && (
                                                <Badge variant="secondary" className="text-[9px] font-bold">
                                                    L{p.hierarchy_level}
                                                </Badge>
                                            )}
                                            <Button size="icon" variant="ghost" className="size-8 hover:bg-primary/10 hover:text-primary" onClick={() => handleStartEdit(p)}>
                                                <Edit2 className="size-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="size-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleDelete(p.job_title)}>
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground line-clamp-2 italic">
                                            "{p.persona_text}"
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {p.capabilities.map(c => (
                                                <Badge key={c} variant="secondary" className="text-[10px] uppercase font-bold bg-blue-500/5 text-blue-400 border-none">
                                                    {c}
                                                </Badge>
                                            ))}
                                            {(p.tools ?? []).map(t => (
                                                <Badge key={t} variant="outline" className="text-[10px] uppercase font-bold bg-green-500/5 text-green-400 border-green-500/20">
                                                    <Wrench className="size-2 mr-1" />{t}
                                                </Badge>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                            <span className="flex items-center gap-1">
                                                <Database className="size-3" />
                                                {(p.rag_collections ?? [p.rag_context]).length} مجموعات RAG
                                            </span>
                                            {p.assigned_agent_id && (
                                                <span className="flex items-center gap-1 text-primary">
                                                    <UserCircle className="size-3" />
                                                    {agents.find(a => a.assistant_id === p.assigned_agent_id)?.name || "وكيل مُعيَّن"}
                                                </span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {personas.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                        <Brain className="size-10 opacity-20" />
                        <p className="text-sm">لا توجد شخصيات بعد. أضف شخصية لتبدأ.</p>
                    </div>
                )}
            </div>

            {/* Edit Drawer */}
            <AnimatePresence>
                {editValues && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-x-0 bottom-0 z-50 p-6 bg-background/95 backdrop-blur-xl border-t border-border shadow-2xl overflow-y-auto max-h-[80vh]"
                    >
                        <div className="max-w-4xl mx-auto space-y-6">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black italic uppercase tracking-tighter">
                                    {editingTitle === "NEW" ? "إضافة شخصية جديدة" : `تعديل: ${editingTitle}`}
                                </h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => { setEditValues(null); setEditingTitle(null); }}>
                                        إلغاء
                                    </Button>
                                    <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                        {editingTitle === "NEW" ? "إنشاء" : "حفظ"}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left column */}
                                <div className="space-y-4">
                                    {/* Job Title */}
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                                            المسمى الوظيفي
                                        </label>
                                        <Input
                                            value={editValues.job_title}
                                            onChange={(e) => setEditValues({ ...editValues, job_title: e.target.value })}
                                            disabled={editingTitle !== "NEW"}
                                            placeholder="مثال: مستشار قانوني"
                                            className="font-bold"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* Persona Text */}
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                                            <MessageSquare className="size-3" /> نص الشخصية (System Prompt)
                                        </label>
                                        <Textarea
                                            value={editValues.persona_text}
                                            onChange={(e) => setEditValues({ ...editValues, persona_text: e.target.value })}
                                            rows={5}
                                            placeholder="صف شخصية الوكيل وتخصصه..."
                                            className="resize-none leading-relaxed"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* RAG Context */}
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                                            <Database className="size-3" /> مجموعة RAG الأساسية
                                        </label>
                                        <Input
                                            value={editValues.rag_context}
                                            onChange={(e) => setEditValues({ ...editValues, rag_context: e.target.value })}
                                            placeholder="goeic_org_docs"
                                        />
                                    </div>

                                    {/* Assigned Agent */}
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                                            <UserCircle className="size-3" /> الوكيل المُعيَّن
                                        </label>
                                        <Select
                                            value={editValues.assigned_agent_id ? `${editValues.assigned_agent_id}:${editValues.assigned_deployment_id}` : "none"}
                                            onValueChange={(v) => {
                                                if (v === "none") {
                                                    setEditValues({ ...editValues, assigned_agent_id: undefined, assigned_deployment_id: undefined });
                                                } else {
                                                    const [aid, did] = v.split(":");
                                                    setEditValues({ ...editValues, assigned_agent_id: aid, assigned_deployment_id: did });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="اختر وكيلاً لهذه الشخصية" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">بدون وكيل محدد</SelectItem>
                                                {agents.map(a => (
                                                    <SelectItem key={`${a.assistant_id}:${a.deploymentId}`} value={`${a.assistant_id}:${a.deploymentId}`}>
                                                        {a.name} ({a.graph_id})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* ── Org-Aware Fields ── */}
                                    <div className="pt-2 border-t border-border/50 space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                            <Building2 className="size-3" /> السياق التنظيمي
                                        </p>

                                        {/* Agent Archetype */}
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                                                <BarChart3 className="size-3" /> نوع الوكيل (Archetype)
                                            </label>
                                            <Select
                                                value={editValues.agent_type ?? "workgroup"}
                                                onValueChange={(v) => setEditValues({ ...editValues, agent_type: v as AgentArchetype })}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="اختر النمط" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(Object.entries(AGENT_ARCHETYPE_LABELS) as [AgentArchetype, typeof AGENT_ARCHETYPE_LABELS[AgentArchetype]][]).map(([key, label]) => (
                                                        <SelectItem key={key} value={key}>
                                                            <span className="font-bold">{label.ar}</span>
                                                            <span className="text-muted-foreground text-[10px] mr-2">({label.en})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Hierarchy Level */}
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                                                <Layers className="size-3" /> المستوى الهرمي
                                            </label>
                                            <Select
                                                value={String(editValues.hierarchy_level ?? 3)}
                                                onValueChange={(v) => setEditValues({ ...editValues, hierarchy_level: Number(v) as HierarchyLevel })}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {([1, 2, 3] as HierarchyLevel[]).map((lvl) => (
                                                        <SelectItem key={lvl} value={String(lvl)}>
                                                            {HIERARCHY_LEVEL_LABELS[lvl].ar} — {HIERARCHY_LEVEL_LABELS[lvl].en}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Department — from Supabase */}
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                                                <Building2 className="size-3" /> الإدارة
                                            </label>
                                            <Select
                                                value={editValues.department ?? ""}
                                                onValueChange={(v) => setEditValues({ ...editValues, department: v })}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="اختر الإدارة" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departments.map((dept) => (
                                                        <SelectItem key={dept.id} value={dept.id}>
                                                            {dept.name_ar}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Right column */}
                                <div className="space-y-6">
                                    {/* Goals */}
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center justify-between">
                                            <span className="flex items-center gap-2"><Target className="size-3" /> الأهداف</span>
                                            <Button variant="ghost" size="sm" onClick={() => addArrayItem("goals")} className="h-6 px-1 text-blue-500 font-black"><Plus className="size-3" /></Button>
                                        </label>
                                        <div className="space-y-2">
                                            {editValues.goals.map((g, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <Input value={g} onChange={(e) => updateArrayField("goals", i, e.target.value)} className="h-9 text-sm" dir="rtl" />
                                                    <Button variant="ghost" size="icon" onClick={() => removeArrayItem("goals", i)} className="size-9 shrink-0 text-red-400"><X className="size-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Capabilities */}
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center justify-between">
                                            <span className="flex items-center gap-2"><Zap className="size-3" /> القدرات</span>
                                            <Button variant="ghost" size="sm" onClick={() => addArrayItem("capabilities")} className="h-6 px-1 text-secondary font-black"><Plus className="size-3" /></Button>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {editValues.capabilities.map((c, i) => (
                                                <Badge key={i} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                                                    <Input
                                                        value={c}
                                                        onChange={(e) => updateArrayField("capabilities", i, e.target.value)}
                                                        className="border-none bg-transparent hover:bg-white/10 p-0 h-4 w-24 text-[10px] font-bold uppercase text-center focus-visible:ring-0"
                                                    />
                                                    <X className="size-3 cursor-pointer hover:text-red-500" onClick={() => removeArrayItem("capabilities", i)} />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tools */}
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 block">
                                            <span className="flex items-center gap-2"><Wrench className="size-3" /> الأدوات المتاحة</span>
                                        </label>
                                        <div className="space-y-3">
                                            <Input
                                                placeholder="بحث في الأدوات..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-1 pr-2 scrollbar-thin scrollbar-thumb-muted border rounded-md">
                                                {availableTools
                                                    .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .map((tool) => {
                                                        const isSelected = editValues.tools?.includes(tool.name);
                                                        return (
                                                            <div
                                                                key={tool.name}
                                                                onClick={() => toggleTool(tool.name)}
                                                                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${isSelected
                                                                    ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                                                                    : "border-transparent hover:bg-white/5"
                                                                    }`}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold">{tool.name}</span>
                                                                    <span className="text-[10px] text-muted-foreground line-clamp-1">{tool.description}</span>
                                                                </div>
                                                                {isSelected && <Check className="size-4" />}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
