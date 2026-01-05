export interface OllamaInstanceCreate {
    url: string;
    name?: string | null;
}

export interface OllamaInstanceResponse {
    url: string;
    name: string;
    owner_id: string;
    is_active: boolean;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface OllamaModelInfo {
    name: string;
    instance_url: string;
    capabilities: string[];
    details?: Record<string, any> | null;
    size?: number | null;
    digest?: string | null;
}

export interface OllamaDiscoveryResponse {
    models: OllamaModelInfo[];
    total_count: number;
    instances_checked: number;
}
