import {Attachment} from "./issue";

export interface ClientIssue{
    id: number;
    title: string;
    description?: string;
    status: string; //"open" | "in_progress" | "closed"
    priority: string; // "low" | "medium" | "high"
    created_at: string;
    updated_at?: string;
    attachments: Attachment[];
}

export interface ClientIssueCreatePayload {
    title: string;
    description?: string;
    priority: string; // "low" | "medium" | "high"
}