import { useState, useEffect } from "react";
import { useAuthContext } from "@/providers/Auth";
import { fetchMyProfile, UserProfile } from "@/lib/onboarding";

export function useUserProfile() {
    const { session } = useAuthContext();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            if (session?.accessToken) {
                setLoading(true);
                try {
                    const p = await fetchMyProfile(session.accessToken);
                    setProfile(p);
                } catch (error) {
                    console.error("Failed to fetch user profile:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        }

        loadProfile();
    }, [session?.accessToken]);

    const isAdmin = profile?.is_admin || session?.user?.email === "amr2@dr-ai.tech";

    return {
        profile,
        isAdmin,
        loading,
    };
}
