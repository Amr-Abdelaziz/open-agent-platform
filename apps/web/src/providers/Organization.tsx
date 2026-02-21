"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useState,
    useEffect,
    useCallback,
} from "react";
import { toast } from "sonner";
import {
    fetchOrgCore,
    fetchDepartments,
    fetchKnowledgeAssets,
    fetchPersonas,
    updateOrgCore,
    upsertDepartment,
    deleteDepartment,
    upsertKnowledgeAsset,
    deleteKnowledgeAsset,
    upsertPersona,
    deletePersona,
    seedOrgIfEmpty,
} from "@/lib/org-api";
import type {
    OrganizationData,
    OrgDepartment,
    KnowledgeAsset,
    OrgPersona,
} from "@/types/organization";

interface OrganizationContextType {
    // ── Data ──────────────────────────────────────────────────────────
    orgData: OrganizationData | null;
    departments: OrgDepartment[];
    knowledgeAssets: KnowledgeAsset[];
    personas: OrgPersona[];
    loading: boolean;

    // ── Mutations ─────────────────────────────────────────────────────
    saveOrgCore: (patch: Partial<OrganizationData>) => Promise<void>;
    saveDepartment: (dept: OrgDepartment) => Promise<void>;
    removeDepartment: (id: string) => Promise<void>;
    saveKnowledgeAsset: (asset: KnowledgeAsset) => Promise<void>;
    removeKnowledgeAsset: (id: string) => Promise<void>;
    savePersona: (persona: OrgPersona) => Promise<void>;
    removePersona: (jobTitle: string) => Promise<void>;

    // ── Helpers (kept from original) ──────────────────────────────────
    getDepartment: (nameOrId: string) => OrgDepartment | undefined;
    getPersona: (jobTitle: string) => OrgPersona | undefined;
    getRagCollections: (department: string, jobTitle: string) => string[];
    buildSystemPrompt: (params: {
        department: string;
        jobTitle: string;
        personaText?: string;
        goals?: string[];
    }) => string;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
    const [orgData, setOrgData] = useState<OrganizationData | null>(null);
    const [departments, setDepartments] = useState<OrgDepartment[]>([]);
    const [knowledgeAssets, setKnowledgeAssets] = useState<KnowledgeAsset[]>([]);
    const [personas, setPersonas] = useState<OrgPersona[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Initial load: seed if empty, then fetch ─────────────────────────
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                await seedOrgIfEmpty();
                const [core, depts, assets, perso] = await Promise.all([
                    fetchOrgCore(),
                    fetchDepartments(),
                    fetchKnowledgeAssets(),
                    fetchPersonas(),
                ]);
                if (cancelled) return;
                setOrgData(core);
                setDepartments(depts);
                setKnowledgeAssets(assets);
                setPersonas(perso);
            } catch (err) {
                console.error("[OrganizationProvider] load error:", err);
                toast.error("فشل تحميل بيانات المؤسسة — يتم استخدام البيانات التجريبية");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, []);

    // ── Mutations ────────────────────────────────────────────────────────

    const saveOrgCore = useCallback(async (patch: Partial<OrganizationData>) => {
        await updateOrgCore(patch);
        setOrgData((prev) => prev ? { ...prev, ...patch } : prev);
        toast.success("تم حفظ بيانات المؤسسة");
    }, []);

    const saveDepartment = useCallback(async (dept: OrgDepartment) => {
        await upsertDepartment(dept);
        setDepartments((prev) => {
            const idx = prev.findIndex((d) => d.id === dept.id);
            if (idx >= 0) return prev.map((d, i) => (i === idx ? dept : d));
            return [...prev, dept];
        });
        toast.success(`تم حفظ الإدارة: ${dept.name_ar}`);
    }, []);

    const removeDepartment = useCallback(async (id: string) => {
        await deleteDepartment(id);
        setDepartments((prev) => prev.filter((d) => d.id !== id));
        toast.success("تم حذف الإدارة");
    }, []);

    const saveKnowledgeAsset = useCallback(async (asset: KnowledgeAsset) => {
        await upsertKnowledgeAsset(asset);
        setKnowledgeAssets((prev) => {
            const idx = prev.findIndex((a) => a.collection_id === asset.collection_id);
            if (idx >= 0) return prev.map((a, i) => (i === idx ? asset : a));
            return [...prev, asset];
        });
        toast.success(`تم حفظ مجموعة المعرفة: ${asset.name_ar}`);
    }, []);

    const removeKnowledgeAsset = useCallback(async (id: string) => {
        await deleteKnowledgeAsset(id);
        setKnowledgeAssets((prev) => prev.filter((a) => a.collection_id !== id));
        toast.success("تم حذف مجموعة المعرفة");
    }, []);

    const savePersona = useCallback(async (persona: OrgPersona) => {
        await upsertPersona(persona);
        setPersonas((prev) => {
            const idx = prev.findIndex((p) => p.job_title === persona.job_title);
            if (idx >= 0) return prev.map((p, i) => (i === idx ? persona : p));
            return [...prev, persona];
        });
        toast.success(`تم حفظ الشخصية: ${persona.job_title}`);
    }, []);

    const removePersona = useCallback(async (jobTitle: string) => {
        await deletePersona(jobTitle);
        setPersonas((prev) => prev.filter((p) => p.job_title !== jobTitle));
        toast.success("تم حذف الشخصية");
    }, []);

    const getDepartment = useCallback(
        (nameOrId: string) =>
            departments.find((d) => d.id === nameOrId || d.name_ar === nameOrId),
        [departments]
    );

    const getPersona = useCallback(
        (jobTitle: string) =>
            personas.find((p) => p.job_title === jobTitle),
        [personas]
    );

    const getRagCollections = useCallback(
        (department: string, jobTitle: string): string[] => {
            const orgCollections = ["goeic_org_docs", "goeic_laws"];
            const dept = departments.find(d => d.name_ar === department || d.id === department);
            const deptCollections = dept?.rag_collection ? [dept.rag_collection] : [];
            const persona = personas.find(p => p.job_title === jobTitle);
            const roleCollections = persona?.rag_collections ?? [];
            return Array.from(new Set([...orgCollections, ...deptCollections, ...roleCollections]));
        },
        [departments, personas]
    );

    const buildSystemPrompt = useCallback(
        (params: { department: string; jobTitle: string; personaText?: string; goals?: string[] }): string => {
            const { department, jobTitle, personaText, goals } = params;
            const org = orgData;
            const dept = departments.find(d => d.name_ar === department || d.id === department);
            const lines: string[] = [
                `## السياق المؤسسي`,
                `**المؤسسة:** ${org?.name_ar ?? ""} (${org?.short_name ?? ""})`,
                `**الوزارة المشرفة:** ${org?.parent_ministry_ar ?? ""}`,
                `**الرؤية:** ${org?.vision_ar ?? ""}`,
                `**الرسالة:** ${org?.mission_ar ?? ""}`,
                `**القيم:** ${(org?.values ?? []).join("، ")}`,
                ``,
                `## موقعك في الهيكل التنظيمي`,
                `**الإدارة:** ${department}`,
                `**المسمى الوظيفي:** ${jobTitle}`,
            ];
            if (dept) {
                lines.push(`**وصف الإدارة:** ${dept.description_ar}`);
                lines.push(`**مؤشرات الأداء الرئيسية:**`);
                (dept.kpis ?? []).forEach(kpi => lines.push(`  - ${kpi}`));
            }
            if (personaText) lines.push(``, `## هويتك كوكيل ذكاء اصطناعي`, personaText);
            if (goals && goals.length > 0) {
                lines.push(``, `## أهدافك الرئيسية`);
                goals.forEach(g => lines.push(`- ${g}`));
            }
            if (org?.general_policies?.length) {
                lines.push(``, `## سياسات عامة`, ...org.general_policies.map(p => `- ${p}`));
            }
            return lines.join("\n");
        },
        [orgData, departments]
    );

    return (
        <OrganizationContext.Provider
            value={{
                orgData,
                departments,
                knowledgeAssets,
                personas,
                loading,
                saveOrgCore,
                saveDepartment,
                removeDepartment,
                saveKnowledgeAsset,
                removeKnowledgeAsset,
                savePersona,
                removePersona,
                getDepartment,
                getPersona,
                getRagCollections,
                buildSystemPrompt,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

export function useOrganizationContext(): OrganizationContextType {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error("useOrganizationContext must be used within an OrganizationProvider");
    }
    return context;
}
