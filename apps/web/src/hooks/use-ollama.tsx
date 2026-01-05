import { useCallback, useState } from "react";
import { useAuthContext } from "@/providers/Auth";
import { toast } from "sonner";
import {
    OllamaInstanceCreate,
    OllamaInstanceResponse,
    OllamaDiscoveryResponse,
} from "@/types/ollama";

function getApiUrlOrThrow(): URL {
    if (!process.env.NEXT_PUBLIC_RAG_API_URL) {
        throw new Error(
            "API URL not configured. Please set NEXT_PUBLIC_RAG_API_URL",
        );
    }
    return new URL(process.env.NEXT_PUBLIC_RAG_API_URL);
}

export function useOllama() {
    const { session } = useAuthContext();
    const [instances, setInstances] = useState<OllamaInstanceResponse[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchInstances = useCallback(async () => {
        if (!session?.accessToken) return;

        setLoading(true);
        try {
            const url = getApiUrlOrThrow();
            url.pathname = "/api/ollama/instances";

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch Ollama instances: ${response.statusText}`);
            }

            const data = await response.json();
            setInstances(data);
        } catch (error) {
            console.error("Error fetching Ollama instances:", error);
            toast.error("Failed to fetch Ollama instances");
        } finally {
            setLoading(false);
        }
    }, [session?.accessToken]);

    const createInstance = useCallback(
        async (instance: OllamaInstanceCreate) => {
            if (!session?.accessToken) return;

            try {
                const url = getApiUrlOrThrow();
                url.pathname = "/api/ollama/instances";

                const response = await fetch(url.toString(), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                    body: JSON.stringify(instance),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || "Failed to create Ollama instance");
                }

                const data = await response.json();
                setInstances((prev) => [...prev, data]);
                toast.success("Ollama instance added successfully");
                return data;
            } catch (error: any) {
                console.error("Error creating Ollama instance:", error);
                toast.error(error.message || "Failed to create Ollama instance");
            }
        },
        [session?.accessToken],
    );

    const deleteInstance = useCallback(
        async (instanceUrl: string) => {
            if (!session?.accessToken) return;

            try {
                const url = getApiUrlOrThrow();
                url.pathname = "/api/ollama/instances";
                url.searchParams.set("url", instanceUrl);

                const response = await fetch(url.toString(), {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to delete Ollama instance");
                }

                setInstances((prev) => prev.filter((i) => i.url !== instanceUrl));
                toast.success("Ollama instance removed successfully");
            } catch (error) {
                console.error("Error deleting Ollama instance:", error);
                toast.error("Failed to delete Ollama instance");
            }
        },
        [session?.accessToken],
    );

    const discoverModels = useCallback(async (): Promise<OllamaDiscoveryResponse | undefined> => {
        if (!session?.accessToken) return;

        try {
            const url = getApiUrlOrThrow();
            url.pathname = "/api/ollama/models";

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to discover Ollama models");
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error discovering Ollama models:", error);
            toast.error("Failed to discover Ollama models");
        }
    }, [session?.accessToken]);

    const checkHealth = useCallback(async () => {
        if (!session?.accessToken) return;

        try {
            const url = getApiUrlOrThrow();
            url.pathname = "/api/ollama/health";

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to check Ollama health");
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error checking Ollama health:", error);
            return null;
        }
    }, [session?.accessToken]);

    const setEmbeddingModel = useCallback(async (modelName: string, instanceUrl: string) => {
        if (!session?.accessToken) return;

        try {
            const url = getApiUrlOrThrow();
            url.pathname = "/api/ollama/settings/embedding";
            url.searchParams.set("model_name", modelName);
            url.searchParams.set("instance_url", instanceUrl);

            const response = await fetch(url.toString(), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to set embedding model");
            }

            toast.success(`Embedding model set to ${modelName}`);
            return true;
        } catch (error: any) {
            console.error("Error setting embedding model:", error);
            toast.error(error.message || "Failed to set embedding model");
            return false;
        }
    }, [session?.accessToken]);

    const getActiveEmbedding = useCallback(async () => {
        if (!session?.accessToken) return;

        try {
            const url = getApiUrlOrThrow();
            url.pathname = "/api/ollama/settings/embedding";

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error("Failed to fetch active embedding model");
            }

            const data = await response.json();
            return data; // Expected { model_name: string, instance_url: string }
        } catch (error) {
            console.error("Error fetching active embedding model:", error);
            return null;
        }
    }, [session?.accessToken]);

    return {
        instances,
        loading,
        fetchInstances,
        createInstance,
        deleteInstance,
        discoverModels,
        checkHealth,
        setEmbeddingModel,
        getActiveEmbedding,
    };
}
