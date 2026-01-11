import { useAuthContext } from "@/providers/Auth";
import { useConfigStore } from "@/features/chat/hooks/use-config-store";
import { toast } from "sonner";

export interface UserProfile {
    user_id: string;
    department: string;
    job_title: string;
    persona_name: string | null;
    system_prompt: string;
    rag_context: string;
    rag_collection_id: string | null;
    is_admin?: boolean;
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

/**
 * Injects the persona and goals into the agent configuration.
 */
export function injectPersona(agentId: string, profile: UserProfile) {
    const { updateConfig } = useConfigStore.getState();

    // Assuming the system prompt field is named "System Prompt" or "system_prompt"
    // This depends on the agent's schema. We'll try common names.
    updateConfig(agentId, "System Prompt", profile.system_prompt);
    updateConfig(agentId, "system_prompt", profile.system_prompt);

    // Injection of RAG Context (Provisioning)
    if (profile.rag_collection_id || profile.rag_context) {
        const collection = profile.rag_collection_id || profile.rag_context;
        // Set the collection for RAG
        updateConfig(agentId, "collections", [collection]);
        updateConfig(agentId, "rag_collections", [collection]);
    }

    toast.success(`تم تلقيم الشخصية: ${profile.job_title}`, {
        description: `تم تحديث أهداف الوكيل وربط البيانات: ${profile.rag_context}`,
    });
}
