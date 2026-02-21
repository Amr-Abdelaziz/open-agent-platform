/**
 * Organization API — Supabase CRUD layer
 * All reads/writes go to the Supabase tables created in the migration.
 */

import { getSupabaseClient } from "@/lib/auth/supabase-client";
import {
    MOCK_ORGANIZATION,
    MOCK_DEPARTMENTS,
    MOCK_KNOWLEDGE_ASSETS,
    MOCK_PERSONAS,
} from "@/lib/mock-org-data";
import type {
    OrganizationData,
    OrgDepartment,
    KnowledgeAsset,
    OrgPersona,
} from "@/types/organization";

const ORG_ID = "goeic-001";

// ─── helpers ────────────────────────────────────────────────────────────────

function supabase() {
    return getSupabaseClient();
}

function parseJsonField<T>(val: unknown, fallback: T): T {
    if (Array.isArray(val)) return val as T;
    if (typeof val === "string") {
        try { return JSON.parse(val) as T; } catch { return fallback; }
    }
    return fallback;
}

// ─── SEED: insert GOEIC mock data if tables are empty ───────────────────────

export async function seedOrgIfEmpty(): Promise<void> {
    const db = supabase();

    // Check if org already exists
    const { data: existing } = await db
        .from("org_core")
        .select("id")
        .eq("id", ORG_ID)
        .maybeSingle();

    if (existing) return; // already seeded

    // Insert org core
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: orgErr } = await (db.from("org_core") as any).insert({
        id: MOCK_ORGANIZATION.id,
        name_ar: MOCK_ORGANIZATION.name_ar,
        name_en: MOCK_ORGANIZATION.name_en,
        short_name: MOCK_ORGANIZATION.short_name,
        established_year: MOCK_ORGANIZATION.established_year,
        parent_ministry_ar: MOCK_ORGANIZATION.parent_ministry_ar,
        parent_ministry_en: MOCK_ORGANIZATION.parent_ministry_en,
        description_ar: MOCK_ORGANIZATION.description_ar,
        vision_ar: MOCK_ORGANIZATION.vision_ar,
        mission_ar: MOCK_ORGANIZATION.mission_ar,
        goals: MOCK_ORGANIZATION.goals,
        values: MOCK_ORGANIZATION.values,
        annual_plan_summary: MOCK_ORGANIZATION.annual_plan_summary,
        general_policies: MOCK_ORGANIZATION.general_policies,
        website: MOCK_ORGANIZATION.website,
    });
    if (orgErr) throw orgErr;

    // Insert departments
    for (const dept of MOCK_DEPARTMENTS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db.from("org_departments") as any).insert({
            id: dept.id,
            org_id: ORG_ID,
            name_ar: dept.name_ar,
            name_en: dept.name_en,
            description_ar: dept.description_ar,
            manager_title_ar: dept.manager_title_ar,
            delegation_level: dept.delegation_level,
            rag_collection: dept.rag_collection,
            kpis: dept.kpis,
            job_titles: dept.job_titles,
        });
    }

    // Insert knowledge assets
    for (const asset of MOCK_KNOWLEDGE_ASSETS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db.from("org_knowledge_assets") as any).insert({
            collection_id: asset.collection_id,
            org_id: ORG_ID,
            name_ar: asset.name_ar,
            name_en: asset.name_en,
            type: asset.type,
            scope: asset.scope,
            department_id: asset.department_id ?? null,
        });
    }

    // Insert personas
    for (const p of MOCK_PERSONAS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db.from("org_personas") as any).insert({
            org_id: ORG_ID,
            job_title: p.job_title,
            persona_text: p.persona_text,
            goals: p.goals,
            rag_context: p.rag_context,
            rag_collections: p.rag_collections,
            capabilities: p.capabilities,
            tools: p.tools ?? [],
            assigned_agent_id: p.assigned_agent_id ?? null,
            assigned_deployment_id: p.assigned_deployment_id ?? null,
            agent_type: p.agent_type ?? null,
            hierarchy_level: p.hierarchy_level ?? null,
            department: p.department ?? null,
        });
    }
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function fetchOrgCore(): Promise<OrganizationData> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase().from("org_core") as any)
        .select("*")
        .eq("id", ORG_ID)
        .single();

    if (error || !data) {
        console.warn("[org-api] fetchOrgCore fallback to mock:", error?.message);
        return MOCK_ORGANIZATION;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = data as any;
    return {
        id: d.id,
        name_ar: d.name_ar,
        name_en: d.name_en,
        short_name: d.short_name,
        established_year: d.established_year,
        parent_ministry_ar: d.parent_ministry_ar,
        parent_ministry_en: d.parent_ministry_en,
        description_ar: d.description_ar,
        vision_ar: d.vision_ar,
        mission_ar: d.mission_ar,
        goals: parseJsonField(d.goals, []),
        values: parseJsonField(d.values, []),
        annual_plan_summary: d.annual_plan_summary,
        general_policies: parseJsonField(d.general_policies, []),
        website: d.website,
    } as OrganizationData;
}

export async function fetchDepartments(): Promise<OrgDepartment[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase().from("org_departments") as any)
        .select("*")
        .eq("org_id", ORG_ID)
        .order("delegation_level");

    if (error || !data?.length) {
        console.warn("[org-api] fetchDepartments fallback to mock:", error?.message);
        return MOCK_DEPARTMENTS;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((d) => ({
        id: d.id,
        name_ar: d.name_ar,
        name_en: d.name_en,
        description_ar: d.description_ar,
        manager_title_ar: d.manager_title_ar,
        delegation_level: d.delegation_level as 1 | 2 | 3,
        rag_collection: d.rag_collection,
        kpis: parseJsonField(d.kpis, []),
        job_titles: parseJsonField(d.job_titles, []),
    })) as OrgDepartment[];
}

export async function fetchKnowledgeAssets(): Promise<KnowledgeAsset[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase().from("org_knowledge_assets") as any)
        .select("*")
        .eq("org_id", ORG_ID);

    if (error || !data?.length) {
        console.warn("[org-api] fetchKnowledgeAssets fallback to mock:", error?.message);
        return MOCK_KNOWLEDGE_ASSETS;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((d) => ({
        collection_id: d.collection_id,
        name_ar: d.name_ar,
        name_en: d.name_en,
        type: d.type,
        scope: d.scope,
        department_id: d.department_id ?? undefined,
    })) as KnowledgeAsset[];
}

export async function fetchPersonas(): Promise<OrgPersona[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase().from("org_personas") as any)
        .select("*")
        .eq("org_id", ORG_ID)
        .order("hierarchy_level");

    if (error || !data?.length) {
        console.warn("[org-api] fetchPersonas fallback to mock:", error?.message);
        return MOCK_PERSONAS;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((d) => ({
        job_title: d.job_title,
        persona_text: d.persona_text,
        goals: parseJsonField(d.goals, []),
        rag_context: d.rag_context,
        rag_collections: parseJsonField(d.rag_collections, []),
        capabilities: parseJsonField(d.capabilities, []),
        tools: parseJsonField(d.tools, []),
        assigned_agent_id: d.assigned_agent_id ?? undefined,
        assigned_deployment_id: d.assigned_deployment_id ?? undefined,
        agent_type: d.agent_type ?? undefined,
        hierarchy_level: d.hierarchy_level ?? undefined,
        department: d.department ?? undefined,
    })) as OrgPersona[];
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateOrgCore(patch: Partial<OrganizationData>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase().from("org_core") as any)
        .update(patch)
        .eq("id", ORG_ID);
    if (error) throw error;
}

export async function upsertDepartment(dept: OrgDepartment): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase().from("org_departments") as any)
        .upsert({ ...dept, org_id: ORG_ID }, { onConflict: "id" });
    if (error) throw error;
}

export async function deleteDepartment(deptId: string): Promise<void> {
    const { error } = await supabase()
        .from("org_departments")
        .delete()
        .eq("id", deptId);
    if (error) throw error;
}

export async function upsertKnowledgeAsset(asset: KnowledgeAsset): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase().from("org_knowledge_assets") as any)
        .upsert({ ...asset, org_id: ORG_ID }, { onConflict: "collection_id" });
    if (error) throw error;
}

export async function deleteKnowledgeAsset(collectionId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase().from("org_knowledge_assets") as any)
        .delete()
        .eq("collection_id", collectionId);
    if (error) throw error;
}

export async function upsertPersona(persona: OrgPersona & { id?: string }): Promise<void> {
    const payload = {
        org_id: ORG_ID,
        job_title: persona.job_title,
        persona_text: persona.persona_text,
        goals: persona.goals,
        rag_context: persona.rag_context,
        rag_collections: persona.rag_collections,
        capabilities: persona.capabilities,
        tools: persona.tools ?? [],
        assigned_agent_id: persona.assigned_agent_id ?? null,
        assigned_deployment_id: persona.assigned_deployment_id ?? null,
        agent_type: persona.agent_type ?? null,
        hierarchy_level: persona.hierarchy_level ?? null,
        department: persona.department ?? null,
        ...(persona.id ? { id: persona.id } : {}),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase().from("org_personas") as any)
        .upsert(payload, { onConflict: "org_id,job_title" });
    if (error) throw error;
}

export async function deletePersona(jobTitle: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase().from("org_personas") as any)
        .delete()
        .eq("org_id", ORG_ID)
        .eq("job_title", jobTitle);
    if (error) throw error;
}

// ─── org_user_profiles ───────────────────────────────────────────────────────

export interface OrgUserProfile {
    id?: string;
    user_id: string;
    email: string | null;
    department: string | null;
    department_id: string | null;
    job_title: string | null;
    hierarchy_level: number | null;
    is_admin: boolean;
}

/** Fetch all user profiles — used by HierarchyView and admin Users tab */
export async function fetchOrgUserProfiles(): Promise<OrgUserProfile[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase().from("org_user_profiles") as any)
        .select("id,user_id,email,department,department_id,job_title,hierarchy_level,is_admin")
        .order("department", { ascending: true });
    if (error) throw error;
    return (data ?? []) as OrgUserProfile[];
}

/** Upsert a single user's org profile (admin or self) */
export async function upsertOrgUserProfile(profile: OrgUserProfile): Promise<void> {
    const payload = {
        user_id: profile.user_id,
        email: profile.email ?? null,
        department: profile.department ?? null,
        department_id: profile.department_id ?? null,
        job_title: profile.job_title ?? null,
        hierarchy_level: profile.hierarchy_level ?? null,
        is_admin: profile.is_admin,
        ...(profile.id ? { id: profile.id } : {}),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase().from("org_user_profiles") as any)
        .upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
}

/** Delete a user profile by user_id */
export async function deleteOrgUserProfile(userId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase().from("org_user_profiles") as any)
        .delete()
        .eq("user_id", userId);
    if (error) throw error;
}

