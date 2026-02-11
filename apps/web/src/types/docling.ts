export interface DoclingHealthResponse {
    status: string;
    version: string;
}

export interface TaskStatusResponse {
    task_id: string;
    status: 'pending' | 'started' | 'completed' | 'failed';
    result?: any;
    error?: string;
    progress?: number;
}

export interface ConvertDocumentResponse {
    id: string;
    status: string;
    content: any;
}
