export type IssueStatus = "open" | "in_progress" | "closed";
export type IssuePriority = "low" | "medium" | "high";

export interface Attachment {
  id: number;
  issue_id: number;
  file_name: string;
  file_url: string;
  public_id?: string;
  resource_type: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

export interface Issue {
  id: number;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  reporter?: string;
  assignee?: string;
  created_at: string;
  updated_at?: string;
  attachments?: Attachment[];
}

// shape needed when creating a new issue (no id/timestamps yet)
export interface IssueCreate {
  title: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  reporter?: string;
  assignee?: string;
}