export interface Organization{
    id: number;
    name: string;
    domain?: string;
    created_at: string;
}

export interface OrganizationCreatePayload{
    name: string;
    domain?: string;
}

export interface InvitePublicInfo{
    email: string;
    organization_name: string;
    expires_at: string;
    is_valid: boolean;
}

export interface InviteAcceptPayload{
    username: string;
    full_name?: string;
    password: string;
}

export interface InviteResponse {
    message: string;
    invite_token: string;
    invite_url: string;
    expires_at: string;
}