import { useConfigStore } from "@/features/chat/hooks/use-config-store";
import { toast } from "sonner";
import { fetchOrgUserProfiles } from "@/lib/org-api";

export interface UserProfile {
    user_id: string;
    department: string;
    job_title: string;
    persona_name: string | null;
    system_prompt: string;
    rag_context: string;
    rag_collection_id: string | null;
    is_admin?: boolean;
    assigned_agent_id?: string;
    assigned_deployment_id?: string;
}

export async function fetchMyProfile(accessToken: string): Promise<UserProfile | null> {
    const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
    if (!ragApiUrl) return null;

    try {
        const response = await fetch(`${ragApiUrl}/api/profiles/me`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error("Failed to fetch profile");
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
}

export async function createProfile(accessToken: string, data: { department: string; job_title: string }): Promise<UserProfile | null> {
    const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
    if (!ragApiUrl) return null;

    try {
        const response = await fetch(`${ragApiUrl}/api/profiles/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to create profile");

        return await response.json();
    } catch (error) {
        console.error("Error creating profile:", error);
        return null;
    }
}

export interface Persona {
    job_title: string;
    persona_text: string;
    goals: string[];
    rag_context: string;
    capabilities: string[];
    assigned_agent_id?: string;
    assigned_deployment_id?: string;
}

export async function fetchPersonas(accessToken: string): Promise<Persona[]> {
    const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
    if (!ragApiUrl) return [];

    try {
        const response = await fetch(`${ragApiUrl}/api/profiles/admin/personas`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((p: any) => ({
            ...p,
            goals: typeof p.goals === 'string' ? JSON.parse(p.goals) : p.goals,
            capabilities: typeof p.capabilities === 'string' ? JSON.parse(p.capabilities) : p.capabilities,
        }));
    } catch (error) {
        console.error("Error fetching personas:", error);
        return [];
    }
}

/**
 * Injects the persona and org-aware context into the agent configuration.
 * Accepts optional helper functions from OrganizationProvider so we avoid
 * any dependency on the static mock data at call time.
 */
export function injectPersona(
    agentId: string,
    profile: UserProfile,
    options?: {
        buildSystemPrompt?: (params: {
            department: string;
            jobTitle: string;
            personaText?: string;
            goals?: string[];
        }) => string;
        getRagCollections?: (department: string, jobTitle: string) => string[];
    }
) {
    const { updateConfig } = useConfigStore.getState();

    // Prefer live helpers from OrganizationProvider; fall back to basic prompt
    const systemPrompt = options?.buildSystemPrompt
        ? options.buildSystemPrompt({
            department: profile.department,
            jobTitle: profile.job_title,
            personaText: profile.system_prompt,
        })
        : profile.system_prompt ?? "";

    updateConfig(agentId, "System Prompt", systemPrompt);
    updateConfig(agentId, "system_prompt", systemPrompt);

    const ragCollections = options?.getRagCollections
        ? options.getRagCollections(profile.department, profile.job_title)
        : [profile.rag_collection_id ?? profile.rag_context].filter(Boolean) as string[];

    const primaryCollection = profile.rag_collection_id || profile.rag_context || ragCollections[0];

    updateConfig(agentId, "collections", ragCollections);
    updateConfig(agentId, "rag_collections", ragCollections);
    if (primaryCollection) {
        updateConfig(agentId, "rag_context", primaryCollection);
    }

    toast.success(`تم تلقيم الشخصية: ${profile.job_title}`, {
        description: `تم تحديث السياق المؤسسي وربط ${ragCollections.length} مجموعات معرفية`,
    });
}

/**
 * Fetch the current user's org profile from Supabase (org_user_profiles table).
 * Returns null if the user hasn't been registered yet.
 */
export async function fetchMyOrgProfile(userId: string): Promise<import("@/lib/org-api").OrgUserProfile | null> {
    try {
        const all = await fetchOrgUserProfiles();
        return all.find(p => p.user_id === userId) ?? null;
    } catch {
        return null;
    }
}
