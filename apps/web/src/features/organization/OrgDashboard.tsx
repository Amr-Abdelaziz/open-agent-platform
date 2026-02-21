"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, Target, Heart, BookOpen, Users, FileText, Globe,
    ChevronDown, ChevronRight, Bot, Database, Layers, Star, Calendar,
    Shield, BarChart3, Wrench, Briefcase, Edit2, Save, X, Plus, Trash2,
    Loader2, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useOrganizationContext } from "@/providers/Organization";
import {
    AGENT_ARCHETYPE_LABELS,
    HIERARCHY_LEVEL_LABELS,
} from "@/types/organization";
import type {
    AgentArchetype, HierarchyLevel, OrganizationData,
    OrgDepartment, KnowledgeAsset, OrgPersona, OrgJobTitle,
} from "@/types/organization";

// ─── Archetype metadata ──────────────────────────────────────────────────────
const ARCHETYPE_ICONS: Record<AgentArchetype, React.ReactNode> = {
    org_manager: <Building2 className="size-5" />,
    dept_manager: <Briefcase className="size-5" />,
    decision_support: <BarChart3 className="size-5" />,
    compliance: <Shield className="size-5" />,
    workgroup: <Wrench className="size-5" />,
};
const ARCHETYPE_COLORS: Record<AgentArchetype, string> = {
    org_manager: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    dept_manager: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    decision_support: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    compliance: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    workgroup: "from-rose-500/20 to-rose-600/10 border-rose-500/30",
};
const KNOWLEDGE_TYPE_ICONS: Record<string, React.ReactNode> = {
    official_docs: <FileText className="size-4" />,
    laws: <BookOpen className="size-4" />,
    internal_regulations: <Shield className="size-4" />,
    meeting_records: <Calendar className="size-4" />,
    digital_registry: <Database className="size-4" />,
};

// ─── Reusable inline-editor for string arrays ───────────────────────────────
function TagListEditor({
    label, items, onChange,
}: { label: string; items: string[]; onChange: (v: string[]) => void }) {
    const [draft, setDraft] = useState("");
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <div className="flex flex-wrap gap-1.5">
                {items.map((item, i) => (
                    <div key={i} className="group flex items-center gap-1 bg-muted/30 rounded-lg px-2 py-1 text-xs">
                        <span>{item}</span>
                        <button
                            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity"
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && draft.trim()) {
                            onChange([...items, draft.trim()]);
                            setDraft("");
                        }
                    }}
                    placeholder="اكتب ثم اضغط Enter..."
                    className="h-8 text-xs"
                />
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2"
                    onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); } }}
                >
                    <Plus className="size-3" />
                </Button>
            </div>
        </div>
    );
}

// ─── Section header ─────────────────────────────────────────────────────────
function SectionHeader({
    icon, title, subtitle, onAdd, addLabel,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onAdd?: () => void;
    addLabel?: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">{icon}</div>
                <div>
                    <h2 className="text-xl font-black tracking-tight">{title}</h2>
                    {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
            {onAdd && (
                <Button size="sm" onClick={onAdd} className="gap-2">
                    <Plus className="size-4" /> {addLabel ?? "إضافة"}
                </Button>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// OrgDashboard
// ═══════════════════════════════════════════════════════════════════════════
export function OrgDashboard() {
    const {
        orgData, departments, knowledgeAssets, personas, loading,
        saveOrgCore, saveDepartment, removeDepartment,
        saveKnowledgeAsset, removeKnowledgeAsset,
        savePersona, removePersona,
    } = useOrganizationContext();

    const [expandedDept, setExpandedDept] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    // ── Org Core edit state ────────────────────────────────────────────
    const [editingCore, setEditingCore] = useState(false);
    const [coreDraft, setCoreDraft] = useState<Partial<OrganizationData>>({});

    // ── Department edit state ──────────────────────────────────────────
    const [editingDept, setEditingDept] = useState<string | null>(null);
    const [deptDraft, setDeptDraft] = useState<OrgDepartment | null>(null);

    // ── Knowledge asset edit state ─────────────────────────────────────
    const [editingAsset, setEditingAsset] = useState<string | null>(null);
    const [assetDraft, setAssetDraft] = useState<KnowledgeAsset | null>(null);

    // ── Persona edit state ─────────────────────────────────────────────
    const [editingPersona, setEditingPersona] = useState<string | null>(null);
    const [personaDraft, setPersonaDraft] = useState<OrgPersona | null>(null);

    // ── Job Title edit state ───────────────────────────────────────────
    type JobTitleDraft = OrgJobTitle;
    const [editingJobTitle, setEditingJobTitle] = useState<{ deptId: string; jobTitleId: string } | null>(null);
    const [jobTitleDraft, setJobTitleDraft] = useState<JobTitleDraft | null>(null);

    // ── Helpers ────────────────────────────────────────────────────────
    const withSaving = useCallback(async (key: string, fn: () => Promise<void>) => {
        setSaving(key);
        try { await fn(); } finally { setSaving(null); }
    }, []);

    const newDeptId = () => `dept-${Date.now()}`;
    const newAssetId = () => `asset-${Date.now()}`;

    // Update a job title within a department (upsert via saveDepartment)
    const saveJobTitle = useCallback(async (deptId: string, oldTitleAr: string, jt: JobTitleDraft) => {
        const dept = departments.find((d) => d.id === deptId);
        if (!dept) return;
        const updatedTitles = oldTitleAr === "NEW"
            ? [...dept.job_titles, jt]
            : dept.job_titles.map((t) => (t.title_ar === oldTitleAr ? jt : t));
        await saveDepartment({ ...dept, job_titles: updatedTitles });
    }, [departments, saveDepartment]);

    const removeJobTitle = useCallback(async (deptId: string, titleAr: string) => {
        const dept = departments.find((d) => d.id === deptId);
        if (!dept) return;
        await saveDepartment({ ...dept, job_titles: dept.job_titles.filter((t) => t.title_ar !== titleAr) });
    }, [departments, saveDepartment]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
                <span>جارٍ تحميل بيانات المؤسسة...</span>
            </div>
        );
    }

    if (!orgData) return null;

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-10 p-2" dir="rtl">

            {/* ══ 1. ORGANIZATION IDENTITY ═════════════════════════════════════ */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-none overflow-hidden glass-card shadow-2xl">
                    <div className="h-2 w-full bg-gradient-to-r from-primary via-secondary to-primary/50" />
                    <CardContent className="p-8">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
                                    <Globe className="size-10 text-primary" />
                                </div>
                                <div>
                                    {editingCore ? (
                                        <div className="space-y-2">
                                            <Input value={coreDraft.name_ar ?? orgData.name_ar}
                                                onChange={(e) => setCoreDraft((p) => ({ ...p, name_ar: e.target.value }))}
                                                className="text-xl font-black h-10" />
                                            <Input value={coreDraft.name_en ?? orgData.name_en}
                                                onChange={(e) => setCoreDraft((p) => ({ ...p, name_en: e.target.value }))}
                                                className="h-8 text-sm" placeholder="English name" />
                                            <div className="flex gap-2">
                                                <Input value={coreDraft.short_name ?? orgData.short_name}
                                                    onChange={(e) => setCoreDraft((p) => ({ ...p, short_name: e.target.value }))}
                                                    className="h-8 text-xs w-28" placeholder="Short name" />
                                                <Input type="number" value={coreDraft.established_year ?? orgData.established_year}
                                                    onChange={(e) => setCoreDraft((p) => ({ ...p, established_year: Number(e.target.value) }))}
                                                    className="h-8 text-xs w-24" placeholder="Year" />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h1 className="text-2xl font-black">{orgData.name_ar}</h1>
                                                <Badge variant="secondary" className="font-mono text-xs">{orgData.short_name}</Badge>
                                                <Badge variant="outline" className="text-xs">تأسست {orgData.established_year}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium">{orgData.parent_ministry_ar}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                {editingCore ? (
                                    <>
                                        <Button size="sm" variant="outline" onClick={() => setEditingCore(false)}>
                                            <X className="size-4" />
                                        </Button>
                                        <Button size="sm" className="gap-2"
                                            disabled={saving === "core"}
                                            onClick={() => withSaving("core", () => saveOrgCore(coreDraft).then(() => { setEditingCore(false); setCoreDraft({}); }))}>
                                            {saving === "core" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                            حفظ
                                        </Button>
                                    </>
                                ) : (
                                    <Button size="sm" variant="outline" className="gap-2"
                                        onClick={() => { setCoreDraft({}); setEditingCore(true); }}>
                                        <Edit2 className="size-4" /> تعديل
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {editingCore ? (
                            <Textarea value={coreDraft.description_ar ?? orgData.description_ar}
                                onChange={(e) => setCoreDraft((p) => ({ ...p, description_ar: e.target.value }))}
                                rows={2} className="mb-4 text-sm" placeholder="وصف المؤسسة" />
                        ) : (
                            <p className="text-sm text-muted-foreground mb-6 max-w-3xl">{orgData.description_ar}</p>
                        )}

                        {/* Ministry */}
                        {editingCore && (
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <Input value={coreDraft.parent_ministry_ar ?? orgData.parent_ministry_ar}
                                    onChange={(e) => setCoreDraft((p) => ({ ...p, parent_ministry_ar: e.target.value }))}
                                    className="h-8 text-xs" placeholder="الوزارة (عربي)" />
                                <Input value={coreDraft.parent_ministry_en ?? orgData.parent_ministry_en}
                                    onChange={(e) => setCoreDraft((p) => ({ ...p, parent_ministry_en: e.target.value }))}
                                    className="h-8 text-xs" placeholder="Ministry (English)" />
                            </div>
                        )}

                        {/* Vision / Mission / Values */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-2 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                                <div className="flex items-center gap-2 text-purple-400">
                                    <Star className="size-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">الرؤية</span>
                                </div>
                                {editingCore ? (
                                    <Textarea value={coreDraft.vision_ar ?? orgData.vision_ar}
                                        onChange={(e) => setCoreDraft((p) => ({ ...p, vision_ar: e.target.value }))}
                                        rows={3} className="text-xs resize-none" />
                                ) : (
                                    <p className="text-sm leading-relaxed">{orgData.vision_ar}</p>
                                )}
                            </div>
                            <div className="space-y-2 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Target className="size-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">الرسالة</span>
                                </div>
                                {editingCore ? (
                                    <Textarea value={coreDraft.mission_ar ?? orgData.mission_ar}
                                        onChange={(e) => setCoreDraft((p) => ({ ...p, mission_ar: e.target.value }))}
                                        rows={3} className="text-xs resize-none" />
                                ) : (
                                    <p className="text-sm leading-relaxed">{orgData.mission_ar}</p>
                                )}
                            </div>
                            <div className="space-y-2 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <Heart className="size-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">القيم</span>
                                </div>
                                {editingCore ? (
                                    <TagListEditor label="" items={coreDraft.values ?? orgData.values}
                                        onChange={(v) => setCoreDraft((p) => ({ ...p, values: v }))} />
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        {orgData.values.map((v) => (
                                            <Badge key={v} variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-none">{v}</Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Annual Plan */}
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-400 mb-2">
                                <Calendar className="size-4" />
                                <span className="text-xs font-black uppercase tracking-widest">الخطة السنوية</span>
                            </div>
                            {editingCore ? (
                                <Textarea value={coreDraft.annual_plan_summary ?? orgData.annual_plan_summary}
                                    onChange={(e) => setCoreDraft((p) => ({ ...p, annual_plan_summary: e.target.value }))}
                                    rows={2} className="text-xs resize-none" />
                            ) : (
                                <p className="text-sm text-muted-foreground">{orgData.annual_plan_summary}</p>
                            )}
                        </div>

                        {/* Goals */}
                        <div className="mt-4">
                            {editingCore ? (
                                <TagListEditor label="الأهداف الاستراتيجية"
                                    items={coreDraft.goals ?? orgData.goals}
                                    onChange={(v) => setCoreDraft((p) => ({ ...p, goals: v }))} />
                            ) : (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">الأهداف الاستراتيجية</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {orgData.goals.map((g, i) => (
                                            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-background/40 border border-white/5">
                                                <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</div>
                                                <p className="text-sm">{g}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* General Policies */}
                        {editingCore && (
                            <div className="mt-4">
                                <TagListEditor label="السياسات العامة"
                                    items={coreDraft.general_policies ?? orgData.general_policies}
                                    onChange={(v) => setCoreDraft((p) => ({ ...p, general_policies: v }))} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* ══ 2. AGENT PERSONAS ════════════════════════════════════════════ */}
            <section className="space-y-4">
                <SectionHeader
                    icon={<Bot className="size-5 text-primary" />}
                    title="الوكلاء المؤسسيون"
                    subtitle="وكلاء الذكاء الاصطناعي لكل مستوى في الهيكل التنظيمي"
                    onAdd={() => {
                        const blank: OrgPersona = {
                            job_title: "", persona_text: "", goals: [], rag_context: "", rag_collections: [],
                            capabilities: [], tools: [], agent_type: "workgroup", hierarchy_level: 3,
                        };
                        setPersonaDraft(blank);
                        setEditingPersona("NEW");
                    }}
                    addLabel="وكيل جديد"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {personas.map((persona, idx) => {
                            const archetype = persona.agent_type ?? "workgroup";
                            const isEditing = editingPersona === persona.job_title;
                            const draft = isEditing ? personaDraft! : persona;

                            return (
                                <motion.div key={persona.job_title}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.05 }}>
                                    <Card className={`h-full border bg-gradient-to-br ${ARCHETYPE_COLORS[archetype]} glass-card transition-all`}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-background/30 rounded-xl">{ARCHETYPE_ICONS[archetype]}</div>
                                                    <div>
                                                        {isEditing ? (
                                                            <Input value={draft.job_title}
                                                                onChange={(e) => setPersonaDraft((p) => p ? { ...p, job_title: e.target.value } : p)}
                                                                className="h-7 text-sm font-bold" placeholder="المسمى الوظيفي" />
                                                        ) : (
                                                            <CardTitle className="text-base font-bold">{persona.job_title}</CardTitle>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    {isEditing ? (
                                                        <>
                                                            <Button size="icon" variant="ghost" className="size-7"
                                                                onClick={() => setEditingPersona(null)}>
                                                                <X className="size-3" />
                                                            </Button>
                                                            <Button size="icon" className="size-7"
                                                                disabled={saving === `persona-${persona.job_title}`}
                                                                onClick={() => withSaving(`persona-${persona.job_title}`, async () => {
                                                                    await savePersona(draft);
                                                                    setEditingPersona(null);
                                                                })}>
                                                                {saving === `persona-${persona.job_title}` ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button size="icon" variant="ghost" className="size-7"
                                                                onClick={() => { setPersonaDraft({ ...persona }); setEditingPersona(persona.job_title); }}>
                                                                <Edit2 className="size-3" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="size-7 text-red-400 hover:text-red-500"
                                                                onClick={() => removePersona(persona.job_title)}>
                                                                <Trash2 className="size-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <Textarea value={draft.persona_text}
                                                        onChange={(e) => setPersonaDraft((p) => p ? { ...p, persona_text: e.target.value } : p)}
                                                        rows={3} className="text-xs resize-none" placeholder="وصف شخصية الوكيل" />
                                                    <Select value={draft.agent_type ?? "workgroup"}
                                                        onValueChange={(v) => setPersonaDraft((p) => p ? { ...p, agent_type: v as AgentArchetype } : p)}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {(Object.entries(AGENT_ARCHETYPE_LABELS) as [AgentArchetype, typeof AGENT_ARCHETYPE_LABELS[AgentArchetype]][]).map(([k, l]) => (
                                                                <SelectItem key={k} value={k}>{l.ar}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Select value={String(draft.hierarchy_level ?? 3)}
                                                        onValueChange={(v) => setPersonaDraft((p) => p ? { ...p, hierarchy_level: Number(v) as HierarchyLevel } : p)}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {([1, 2, 3] as HierarchyLevel[]).map((l) => (
                                                                <SelectItem key={l} value={String(l)}>{HIERARCHY_LEVEL_LABELS[l].ar}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <TagListEditor label="القدرات" items={draft.capabilities}
                                                        onChange={(v) => setPersonaDraft((p) => p ? { ...p, capabilities: v } : p)} />
                                                    <TagListEditor label="أهداف الوكيل" items={draft.goals}
                                                        onChange={(v) => setPersonaDraft((p) => p ? { ...p, goals: v } : p)} />
                                                    <TagListEditor label="مجموعات المعرفة" items={draft.rag_collections}
                                                        onChange={(v) => setPersonaDraft((p) => p ? { ...p, rag_collections: v } : p)} />
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-xs text-muted-foreground line-clamp-3">{persona.persona_text}</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {persona.capabilities.slice(0, 3).map((c) => (
                                                            <Badge key={c} variant="secondary" className="text-[9px] bg-background/30 border-none">{c}</Badge>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                        <Database className="size-3" />
                                                        <span className="font-mono">{persona.rag_collections.length} مجموعات معرفية</span>
                                                    </div>
                                                    {persona.hierarchy_level && (
                                                        <Badge variant="outline" className="text-[9px]">
                                                            {HIERARCHY_LEVEL_LABELS[persona.hierarchy_level].ar}
                                                        </Badge>
                                                    )}
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* New persona form */}
                    {editingPersona === "NEW" && personaDraft && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            <Card className="h-full border border-dashed border-primary/40 bg-primary/5 glass-card">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-primary">وكيل جديد</span>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditingPersona(null)}>
                                                <X className="size-3" />
                                            </Button>
                                            <Button size="icon" className="size-7"
                                                disabled={saving === "persona-NEW" || !personaDraft.job_title}
                                                onClick={() => withSaving("persona-NEW", async () => {
                                                    await savePersona(personaDraft);
                                                    setEditingPersona(null);
                                                    setPersonaDraft(null);
                                                })}>
                                                {saving === "persona-NEW" ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Input value={personaDraft.job_title}
                                        onChange={(e) => setPersonaDraft((p) => p ? { ...p, job_title: e.target.value } : p)}
                                        className="h-8 text-sm font-bold" placeholder="المسمى الوظيفي *" />
                                    <Textarea value={personaDraft.persona_text}
                                        onChange={(e) => setPersonaDraft((p) => p ? { ...p, persona_text: e.target.value } : p)}
                                        rows={3} className="text-xs" placeholder="وصف شخصية الوكيل" />
                                    <Select value={personaDraft.agent_type ?? "workgroup"}
                                        onValueChange={(v) => setPersonaDraft((p) => p ? { ...p, agent_type: v as AgentArchetype } : p)}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {(Object.entries(AGENT_ARCHETYPE_LABELS) as [AgentArchetype, typeof AGENT_ARCHETYPE_LABELS[AgentArchetype]][]).map(([k, l]) => (
                                                <SelectItem key={k} value={k}>{l.ar}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <TagListEditor label="القدرات" items={personaDraft.capabilities}
                                        onChange={(v) => setPersonaDraft((p) => p ? { ...p, capabilities: v } : p)} />
                                    <TagListEditor label="مجموعات المعرفة" items={personaDraft.rag_collections}
                                        onChange={(v) => setPersonaDraft((p) => p ? { ...p, rag_collections: v } : p)} />
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ══ 3. ORGANIZATIONAL STRUCTURE ══════════════════════════════════ */}
            <section className="space-y-4">
                <SectionHeader
                    icon={<Layers className="size-5 text-secondary" />}
                    title="الهيكل التنظيمي"
                    subtitle="الإدارات والأقسام والمسميات الوظيفية"
                    onAdd={() => {
                        const blank: OrgDepartment = {
                            id: newDeptId(),
                            name_ar: "", name_en: "", description_ar: "",
                            manager_title_ar: "", delegation_level: 2,
                            rag_collection: "", kpis: [], job_titles: [],
                        };
                        setDeptDraft(blank);
                        setEditingDept("NEW");
                    }}
                    addLabel="إدارة جديدة"
                />

                <div className="space-y-3">
                    {departments.map((dept, dIdx) => {
                        const isEditingDept = editingDept === dept.id;
                        const deptDraftData = isEditingDept ? deptDraft! : dept;

                        return (
                            <motion.div key={dept.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: dIdx * 0.05 }}>
                                <Card className="border-none glass-card overflow-hidden">
                                    {/* Department Header */}
                                    <CardHeader className="py-4 px-6">
                                        <div className="flex items-center justify-between">
                                            <button
                                                className="flex items-center gap-4 text-right flex-1"
                                                onClick={() => !isEditingDept && setExpandedDept(expandedDept === dept.id ? null : dept.id)}>
                                                <div className="p-2 bg-background rounded-xl shadow-sm">
                                                    <Building2 className="size-4 text-secondary" />
                                                </div>
                                                <div>
                                                    {isEditingDept ? (
                                                        <div className="flex flex-col gap-1 text-right" onClick={(e) => e.stopPropagation()}>
                                                            <Input value={deptDraftData.name_ar}
                                                                onChange={(e) => setDeptDraft((p) => p ? { ...p, name_ar: e.target.value } : p)}
                                                                className="h-8 font-bold text-sm" placeholder="اسم الإدارة (عربي)" />
                                                            <Input value={deptDraftData.name_en}
                                                                onChange={(e) => setDeptDraft((p) => p ? { ...p, name_en: e.target.value } : p)}
                                                                className="h-7 text-xs" placeholder="Department name (English)" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <CardTitle className="text-base font-bold text-right">{dept.name_ar}</CardTitle>
                                                            <p className="text-[10px] text-muted-foreground">{dept.job_titles.length} مسمى وظيفي</p>
                                                        </>
                                                    )}
                                                </div>
                                            </button>

                                            <div className="flex items-center gap-1 shrink-0">
                                                {isEditingDept ? (
                                                    <>
                                                        <Button size="icon" variant="ghost" className="size-8"
                                                            onClick={() => setEditingDept(null)}>
                                                            <X className="size-4" />
                                                        </Button>
                                                        <Button size="icon" className="size-8"
                                                            disabled={saving === `dept-${dept.id}`}
                                                            onClick={() => withSaving(`dept-${dept.id}`, async () => {
                                                                await saveDepartment(deptDraftData);
                                                                setEditingDept(null);
                                                            })}>
                                                            {saving === `dept-${dept.id}` ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button size="icon" variant="ghost" className="size-8"
                                                            onClick={() => { setDeptDraft({ ...dept }); setEditingDept(dept.id); setExpandedDept(dept.id); }}>
                                                            <Edit2 className="size-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="size-8 text-red-400 hover:text-red-500"
                                                            onClick={() => removeDepartment(dept.id)}>
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                        {expandedDept === dept.id
                                                            ? <ChevronDown className="size-4 text-muted-foreground" />
                                                            : <ChevronRight className="size-4 text-muted-foreground" />
                                                        }
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <AnimatePresence>
                                        {(expandedDept === dept.id || isEditingDept) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}>
                                                <CardContent className="px-6 pb-6 pt-0 space-y-4">
                                                    {isEditingDept ? (
                                                        <div className="space-y-4">
                                                            <Textarea value={deptDraftData.description_ar}
                                                                onChange={(e) => setDeptDraft((p) => p ? { ...p, description_ar: e.target.value } : p)}
                                                                rows={2} className="text-xs resize-none" placeholder="وصف الإدارة" />
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <Input value={deptDraftData.manager_title_ar}
                                                                    onChange={(e) => setDeptDraft((p) => p ? { ...p, manager_title_ar: e.target.value } : p)}
                                                                    className="h-8 text-xs" placeholder="مسمى المدير" />
                                                                <Input value={deptDraftData.rag_collection}
                                                                    onChange={(e) => setDeptDraft((p) => p ? { ...p, rag_collection: e.target.value } : p)}
                                                                    className="h-8 text-xs font-mono" placeholder="rag_collection_id" />
                                                            </div>
                                                            <div>
                                                                <Select value={String(deptDraftData.delegation_level)}
                                                                    onValueChange={(v) => setDeptDraft((p) => p ? { ...p, delegation_level: Number(v) as 1 | 2 | 3 } : p)}>
                                                                    <SelectTrigger className="h-8 text-xs w-48"><SelectValue placeholder="مستوى التفويض" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="1">مستوى 1 — صلاحية عليا</SelectItem>
                                                                        <SelectItem value="2">مستوى 2 — تشغيلي</SelectItem>
                                                                        <SelectItem value="3">مستوى 3 — تنفيذي</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <TagListEditor label="مؤشرات الأداء الرئيسية (KPIs)"
                                                                items={deptDraftData.kpis}
                                                                onChange={(v) => setDeptDraft((p) => p ? { ...p, kpis: v } : p)} />

                                                            {/* Job Titles Editor */}
                                                            <div className="space-y-3 border-t pt-4">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm font-bold">المسميات الوظيفية</p>
                                                                    <Button size="sm" onClick={() => {
                                                                        setEditingJobTitle({ deptId: dept.id, jobTitleId: "NEW" });
                                                                        setJobTitleDraft({
                                                                            title_ar: "", title_en: "", description_ar: "",
                                                                            hierarchy_level: 3, requirements: [], kpis: [],
                                                                        });
                                                                    }}>
                                                                        <Plus className="size-4 mr-2" /> إضافة مسمى
                                                                    </Button>
                                                                </div>
                                                                {deptDraftData.job_titles.map((jt, jtIdx) => {
                                                                    const isEditingJobTitle = editingJobTitle?.deptId === dept.id && editingJobTitle?.jobTitleId === jt.title_ar;
                                                                    const currentJobTitleDraft = isEditingJobTitle ? jobTitleDraft! : jt;

                                                                    return (
                                                                        <div key={jt.title_ar} className="p-3 rounded-xl bg-background/40 border border-white/5 space-y-1">
                                                                            {isEditingJobTitle ? (
                                                                                <div className="space-y-2">
                                                                                    <Input value={currentJobTitleDraft.title_ar}
                                                                                        onChange={(e) => setJobTitleDraft((p) => p ? { ...p, title_ar: e.target.value } : p)}
                                                                                        className="h-8 font-bold text-sm" placeholder="المسمى الوظيفي (عربي)" />
                                                                                    <Input value={currentJobTitleDraft.title_en}
                                                                                        onChange={(e) => setJobTitleDraft((p) => p ? { ...p, title_en: e.target.value } : p)}
                                                                                        className="h-7 text-xs" placeholder="Job Title (English)" />
                                                                                    <Textarea value={currentJobTitleDraft.description_ar}
                                                                                        onChange={(e) => setJobTitleDraft((p) => p ? { ...p, description_ar: e.target.value } : p)}
                                                                                        rows={2} className="text-xs resize-none" placeholder="وصف المسمى الوظيفي" />
                                                                                    <Select value={String(currentJobTitleDraft.hierarchy_level)}
                                                                                        onValueChange={(v) => setJobTitleDraft((p) => p ? { ...p, hierarchy_level: Number(v) as HierarchyLevel } : p)}>
                                                                                        <SelectTrigger className="h-8 text-xs w-48"><SelectValue placeholder="مستوى الهيكل" /></SelectTrigger>
                                                                                        <SelectContent>
                                                                                            {([1, 2, 3] as HierarchyLevel[]).map((l) => (
                                                                                                <SelectItem key={l} value={String(l)}>{HIERARCHY_LEVEL_LABELS[l].ar}</SelectItem>
                                                                                            ))}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                    <div className="flex gap-1 justify-end">
                                                                                        <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditingJobTitle(null)}>
                                                                                            <X className="size-3" />
                                                                                        </Button>
                                                                                        <Button size="icon" className="size-7"
                                                                                            disabled={saving === `jobtitle-${dept.id}-${jt.title_ar}`}
                                                                                            onClick={() => withSaving(`jobtitle-${dept.id}-${jt.title_ar}`, async () => {
                                                                                                await saveJobTitle(dept.id, jt.title_ar, currentJobTitleDraft);
                                                                                                setEditingJobTitle(null);
                                                                                            })}>
                                                                                            {saving === `jobtitle-${dept.id}-${jt.title_ar}` ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <span className="font-bold text-sm">{jt.title_ar}</span>
                                                                                    <div className="flex gap-1 shrink-0">
                                                                                        <Badge variant="secondary" className="text-[9px] shrink-0">
                                                                                            {HIERARCHY_LEVEL_LABELS[jt.hierarchy_level].ar}
                                                                                        </Badge>
                                                                                        <Button size="icon" variant="ghost" className="size-7"
                                                                                            onClick={() => { setJobTitleDraft({ ...jt }); setEditingJobTitle({ deptId: dept.id, jobTitleId: jt.title_ar }); }}>
                                                                                            <Edit2 className="size-3" />
                                                                                        </Button>
                                                                                        <Button size="icon" variant="ghost" className="size-7 text-red-400 hover:text-red-500"
                                                                                            onClick={() => removeJobTitle(dept.id, jt.title_ar)}>
                                                                                            <Trash2 className="size-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}

                                                                {/* New Job Title Form */}
                                                                {editingJobTitle?.deptId === dept.id && editingJobTitle?.jobTitleId === "NEW" && jobTitleDraft && (
                                                                    <div className="p-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 space-y-2">
                                                                        <span className="text-sm font-bold text-primary">مسمى وظيفي جديد</span>
                                                                        <Input value={jobTitleDraft.title_ar}
                                                                            onChange={(e) => setJobTitleDraft((p) => p ? { ...p, title_ar: e.target.value } : p)}
                                                                            className="h-8 font-bold text-sm" placeholder="المسمى الوظيفي (عربي) *" />
                                                                        <Input value={jobTitleDraft.title_en}
                                                                            onChange={(e) => setJobTitleDraft((p) => p ? { ...p, title_en: e.target.value } : p)}
                                                                            className="h-7 text-xs" placeholder="Job Title (English)" />
                                                                        <Textarea value={jobTitleDraft.description_ar}
                                                                            onChange={(e) => setJobTitleDraft((p) => p ? { ...p, description_ar: e.target.value } : p)}
                                                                            rows={2} className="text-xs resize-none" placeholder="وصف المسمى الوظيفي" />
                                                                        <Select value={String(jobTitleDraft.hierarchy_level)}
                                                                            onValueChange={(v) => setJobTitleDraft((p) => p ? { ...p, hierarchy_level: Number(v) as HierarchyLevel } : p)}>
                                                                            <SelectTrigger className="h-8 text-xs w-48"><SelectValue placeholder="مستوى الهيكل" /></SelectTrigger>
                                                                            <SelectContent>
                                                                                {([1, 2, 3] as HierarchyLevel[]).map((l) => (
                                                                                    <SelectItem key={l} value={String(l)}>{HIERARCHY_LEVEL_LABELS[l].ar}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <div className="flex gap-1 justify-end">
                                                                            <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditingJobTitle(null)}>
                                                                                <X className="size-3" />
                                                                            </Button>
                                                                            <Button size="icon" className="size-7"
                                                                                disabled={saving === `jobtitle-${dept.id}-NEW` || !jobTitleDraft.title_ar}
                                                                                onClick={() => withSaving(`jobtitle-${dept.id}-NEW`, async () => {
                                                                                    await saveJobTitle(dept.id, "NEW", jobTitleDraft);
                                                                                    setEditingJobTitle(null);
                                                                                    setJobTitleDraft(null);
                                                                                })}>
                                                                                {saving === `jobtitle-${dept.id}-NEW` ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-muted-foreground">{dept.description_ar}</p>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">مؤشرات الأداء الرئيسية</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {dept.kpis.map((kpi) => (
                                                                        <Badge key={kpi} variant="outline" className="text-[10px]">{kpi}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">المسميات الوظيفية</p>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {dept.job_titles.map((jt: OrgJobTitle, ji: number) => (
                                                                        <div key={ji} className="p-3 rounded-xl bg-background/40 border border-white/5 space-y-1">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <span className="font-bold text-sm">{jt.title_ar}</span>
                                                                                <Badge variant="secondary" className="text-[9px] shrink-0">
                                                                                    {HIERARCHY_LEVEL_LABELS[jt.hierarchy_level].ar}
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="text-[11px] text-muted-foreground">{jt.description_ar}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                                <Database className="size-3 text-primary" />
                                                                <span className="font-mono text-primary">{dept.rag_collection}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            </motion.div>
                        );
                    })}

                    {/* New department form */}
                    {editingDept === "NEW" && deptDraft && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                            <Card className="border border-dashed border-secondary/40 bg-secondary/5 glass-card">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-secondary">إدارة جديدة</span>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="size-8" onClick={() => setEditingDept(null)}>
                                                <X className="size-4" />
                                            </Button>
                                            <Button size="icon" className="size-8"
                                                disabled={saving === "dept-NEW" || !deptDraft.name_ar}
                                                onClick={() => withSaving("dept-NEW", async () => {
                                                    await saveDepartment(deptDraft);
                                                    setEditingDept(null);
                                                    setDeptDraft(null);
                                                })}>
                                                {saving === "dept-NEW" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <Input value={deptDraft.name_ar}
                                        onChange={(e) => setDeptDraft((p) => p ? { ...p, name_ar: e.target.value } : p)}
                                        className="h-9 font-bold" placeholder="اسم الإدارة (عربي) *" />
                                    <Input value={deptDraft.name_en}
                                        onChange={(e) => setDeptDraft((p) => p ? { ...p, name_en: e.target.value } : p)}
                                        className="h-8 text-sm" placeholder="Department name (English)" />
                                    <Textarea value={deptDraft.description_ar}
                                        onChange={(e) => setDeptDraft((p) => p ? { ...p, description_ar: e.target.value } : p)}
                                        rows={2} className="text-xs" placeholder="وصف الإدارة" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Input value={deptDraft.manager_title_ar}
                                            onChange={(e) => setDeptDraft((p) => p ? { ...p, manager_title_ar: e.target.value } : p)}
                                            className="h-8 text-xs" placeholder="مسمى المدير" />
                                        <Input value={deptDraft.rag_collection}
                                            onChange={(e) => setDeptDraft((p) => p ? { ...p, rag_collection: e.target.value } : p)}
                                            className="h-8 text-xs font-mono" placeholder="rag_collection_id" />
                                    </div>
                                    <TagListEditor label="مؤشرات الأداء الرئيسية"
                                        items={deptDraft.kpis}
                                        onChange={(v) => setDeptDraft((p) => p ? { ...p, kpis: v } : p)} />
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ══ 4. KNOWLEDGE ASSETS ══════════════════════════════════════════ */}
            <section className="space-y-4">
                <SectionHeader
                    icon={<BookOpen className="size-5 text-amber-400" />}
                    title="الأصول المعرفية"
                    subtitle="مجموعات المعرفة المرتبطة بالهيئة (RAG Collections)"
                    onAdd={() => {
                        const blank: KnowledgeAsset = {
                            collection_id: newAssetId(), name_ar: "", name_en: "",
                            type: "official_docs", scope: "org",
                        };
                        setAssetDraft(blank);
                        setEditingAsset("NEW");
                    }}
                    addLabel="مجموعة جديدة"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {knowledgeAssets.map((asset, idx) => {
                        const isEditing = editingAsset === asset.collection_id;
                        const draft = isEditing ? assetDraft! : asset;

                        return (
                            <motion.div key={asset.collection_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="flex items-start gap-3 p-4 rounded-xl bg-background/40 border border-white/5 hover:border-primary/20 transition-all relative group">
                                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                                    {KNOWLEDGE_TYPE_ICONS[asset.type] ?? <FileText className="size-4" />}
                                </div>
                                {isEditing ? (
                                    <div className="flex-1 space-y-2">
                                        <Input value={draft.name_ar}
                                            onChange={(e) => setAssetDraft((p) => p ? { ...p, name_ar: e.target.value } : p)}
                                            className="h-7 text-xs font-bold" placeholder="الاسم بالعربي" />
                                        <Input value={draft.collection_id}
                                            onChange={(e) => setAssetDraft((p) => p ? { ...p, collection_id: e.target.value } : p)}
                                            className="h-6 text-[10px] font-mono" placeholder="collection_id" />
                                        <div className="flex gap-2">
                                            <Select value={draft.type}
                                                onValueChange={(v) => setAssetDraft((p) => p ? { ...p, type: v as KnowledgeAsset["type"] } : p)}>
                                                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {(["official_docs", "laws", "internal_regulations", "meeting_records", "digital_registry"] as const).map((t) => (
                                                        <SelectItem key={t} value={t} className="text-xs">{t.replace("_", " ")}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={draft.scope}
                                                onValueChange={(v) => setAssetDraft((p) => p ? { ...p, scope: v as KnowledgeAsset["scope"] } : p)}>
                                                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="org" className="text-xs">مؤسسي</SelectItem>
                                                    <SelectItem value="dept" className="text-xs">إداري</SelectItem>
                                                    <SelectItem value="role" className="text-xs">وظيفي</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="icon" variant="ghost" className="size-6" onClick={() => setEditingAsset(null)}>
                                                <X className="size-3" />
                                            </Button>
                                            <Button size="icon" className="size-6"
                                                disabled={saving === `asset-${asset.collection_id}`}
                                                onClick={() => withSaving(`asset-${asset.collection_id}`, async () => {
                                                    await saveKnowledgeAsset(draft);
                                                    setEditingAsset(null);
                                                })}>
                                                {saving === `asset-${asset.collection_id}` ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <p className="font-bold text-sm">{asset.name_ar}</p>
                                            <p className="font-mono text-[10px] text-muted-foreground truncate">{asset.collection_id}</p>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[9px]">
                                                    {asset.scope === "org" ? "مؤسسي" : asset.scope === "dept" ? "إداري" : "وظيفي"}
                                                </Badge>
                                                <Badge variant="secondary" className="text-[9px]">{asset.type.replace("_", " ")}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="size-6"
                                                onClick={() => { setAssetDraft({ ...asset }); setEditingAsset(asset.collection_id); }}>
                                                <Edit2 className="size-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="size-6 text-red-400"
                                                onClick={() => removeKnowledgeAsset(asset.collection_id)}>
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        );
                    })}

                    {/* New knowledge asset form */}
                    {editingAsset === "NEW" && assetDraft && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl border border-dashed border-amber-400/40 bg-amber-500/5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-400">مجموعة جديدة</span>
                                <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" className="size-6" onClick={() => setEditingAsset(null)}>
                                        <X className="size-3" />
                                    </Button>
                                    <Button size="icon" className="size-6"
                                        disabled={saving === "asset-NEW" || !assetDraft.name_ar}
                                        onClick={() => withSaving("asset-NEW", async () => {
                                            await saveKnowledgeAsset(assetDraft);
                                            setEditingAsset(null);
                                            setAssetDraft(null);
                                        })}>
                                        {saving === "asset-NEW" ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                                    </Button>
                                </div>
                            </div>
                            <Input value={assetDraft.name_ar}
                                onChange={(e) => setAssetDraft((p) => p ? { ...p, name_ar: e.target.value } : p)}
                                className="h-7 text-xs" placeholder="الاسم *" />
                            <Input value={assetDraft.collection_id}
                                onChange={(e) => setAssetDraft((p) => p ? { ...p, collection_id: e.target.value } : p)}
                                className="h-7 text-[10px] font-mono" placeholder="collection_id *" />
                            <div className="flex gap-2">
                                <Select value={assetDraft.type}
                                    onValueChange={(v) => setAssetDraft((p) => p ? { ...p, type: v as KnowledgeAsset["type"] } : p)}>
                                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(["official_docs", "laws", "internal_regulations", "meeting_records", "digital_registry"] as const).map((t) => (
                                            <SelectItem key={t} value={t} className="text-xs">{t.replace("_", " ")}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={assetDraft.scope}
                                    onValueChange={(v) => setAssetDraft((p) => p ? { ...p, scope: v as KnowledgeAsset["scope"] } : p)}>
                                    <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="org" className="text-xs">مؤسسي</SelectItem>
                                        <SelectItem value="dept" className="text-xs">إداري</SelectItem>
                                        <SelectItem value="role" className="text-xs">وظيفي</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>
        </div>
    );
}
