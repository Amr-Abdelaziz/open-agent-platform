export interface UserSettingResponse {
    key: string;
    value: any;
    updated_at: string;
}

export interface UserSettingUpdate {
    key: string;
    value: any;
}
