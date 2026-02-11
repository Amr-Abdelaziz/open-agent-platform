"use client";

import { useCallback, useState } from "react";
import { useAuthContext } from "@/providers/Auth";
import { toast } from "sonner";
import { UserSettingResponse, UserSettingUpdate } from "@/types/settings";

function getApiUrlOrThrow(): URL {
    if (!process.env.NEXT_PUBLIC_RAG_API_URL) {
        throw new Error(
            "API URL not configured. Please set NEXT_PUBLIC_RAG_API_URL",
        );
    }
    return new URL(process.env.NEXT_PUBLIC_RAG_API_URL);
}

export function useUserSettings() {
    const { session } = useAuthContext();
    const [settings, setSettings] = useState<UserSettingResponse[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!session?.accessToken) return;

        setLoading(true);
        try {
            const url = getApiUrlOrThrow();
            url.pathname = "/settings/";

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch settings: ${response.statusText}`);
            }

            const data = await response.json();
            setSettings(data);
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to fetch settings");
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    const updateSetting = useCallback(
        async (setting: UserSettingUpdate) => {
            if (!session?.accessToken) return;

            try {
                const url = getApiUrlOrThrow();
                url.pathname = "/settings/";

                const response = await fetch(url.toString(), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                    body: JSON.stringify(setting),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || "Failed to update setting");
                }

                const data = await response.json();
                setSettings((prev) => {
                    const index = prev.findIndex((s) => s.key === data.key);
                    if (index !== -1) {
                        const next = [...prev];
                        next[index] = data;
                        return next;
                    }
                    return [...prev, data];
                });
                toast.success(`Setting '${setting.key}' updated`);
                return data;
            } catch (error: any) {
                console.error("Error updating setting:", error);
                toast.error(error.message || "Failed to update setting");
            }
        },
        [session?.accessToken],
    );

    const deleteSetting = useCallback(
        async (key: string) => {
            if (!session?.accessToken) return;

            try {
                const url = getApiUrlOrThrow();
                url.pathname = `/settings/${key}`;

                const response = await fetch(url.toString(), {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to delete setting");
                }

                setSettings((prev) => prev.filter((s) => s.key !== key));
                toast.success(`Setting '${key}' removed`);
            } catch (error) {
                console.error("Error deleting setting:", error);
                toast.error("Failed to delete setting");
            }
        },
        [session?.accessToken],
    );

    return {
        settings,
        loading,
        fetchSettings,
        updateSetting,
        deleteSetting,
    };
}
