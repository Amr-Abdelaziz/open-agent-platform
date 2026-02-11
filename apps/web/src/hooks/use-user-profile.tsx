import { useState, useEffect } from "react";
import { useAuthContext } from "@/providers/Auth";
import { fetchMyProfile, UserProfile, fetchPersonas, Persona } from "@/lib/onboarding";

export function useUserProfile() {
    const { session } = useAuthContext();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [persona, setPersona] = useState<Persona | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (session?.accessToken) {
                setLoading(true);
                try {
                    // First, fetch the user profile
                    const p = await fetchMyProfile(session.accessToken);
                    setProfile(p);

                    if (p) {
                        // Check if user is admin
                        const userIsAdmin = p.is_admin || session?.user?.email === "amr2@dr-ai.tech";

                        let foundPersona: Persona | null = null;

                        // Only fetch personas from admin endpoint if user is admin
                        if (userIsAdmin) {
                            const personas = await fetchPersonas(session.accessToken);

                            // Try to find matching persona from personas endpoint
                            if (personas.length > 0) {
                                const matchingPersona = personas.find(pers => pers.job_title === p.job_title);
                                if (matchingPersona) {
                                    foundPersona = matchingPersona;
                                    setPersona(matchingPersona);
                                }
                            }
                        }

                        // Fallback: If no persona found but profile has assigned_agent_id, create a persona from profile
                        // This is used for non-admin users or admin users without a matching persona
                        if (!foundPersona && p.assigned_agent_id) {
                            const fallbackPersona: Persona = {
                                job_title: p.job_title,
                                persona_text: p.system_prompt || '',
                                goals: [],
                                rag_context: p.rag_context || '',
                                capabilities: [],
                                assigned_agent_id: p.assigned_agent_id,
                                assigned_deployment_id: p.assigned_deployment_id,
                            };
                            setPersona(fallbackPersona);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch user profile or personas:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        }

        loadData();
    }, [session?.accessToken]);

    const isAdmin = profile?.is_admin || session?.user?.email === "amr2@dr-ai.tech";

    return {
        profile,
        persona,
        isAdmin,
        loading,
    };
}
