export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  is_active: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export enum ProjectMemberRole {
  ADMIN = "admin",
  MANAGER = "manager",
  DEVELOPER = "developer",
  VIEWER = "viewer",
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectMemberRole | string;
  user?: User;
  joined_at: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  github_repo_url?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  members_count?: number;
  issues_count?: number;
}

export enum IssueStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  IN_REVIEW = "in_review",
  RESOLVED = "resolved",
  CLOSED = "closed",
  REOPENED = "reopened",
}

export enum IssueSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  TRIVIAL = "trivial",
}

export enum IssuePriority {
  URGENT = "urgent",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum IssueSource {
  MANUAL = "manual",
  AI_ASSISTANT = "ai_assistant",
  REPO_SCAN = "repo_scan",
  WEB_SCAN = "web_scan",
}

export interface Issue {
  id: string;
  project_id: string;
  reporter_id: string;
  issue_number: number;
  title: string;
  description?: string | null;
  status: IssueStatus | string;
  severity: IssueSeverity | string;
  priority: IssuePriority | string;
  component?: string | null;
  assignee_id?: string | null;
  assignee?: User | null;
  reporter?: User | null;
  source: IssueSource | string;
  github_issue_url?: string | null;
  ai_summary?: string | null;
  scan_finding_id?: string | null;
  reproduction_steps?: string | null;
  suggested_fix?: string | null;
  labels?: string[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  user_id: string;
  user?: User;
  content: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface IssueHistory {
  id: string;
  issue_id: string;
  user_id?: string | null;
  user?: User | null;
  field_changed: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
}

export enum ScanStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum ScanFindingStatus {
  PENDING = "pending",
  REVIEWED = "reviewed",
  DISMISSED = "dismissed",
  CREATED_ISSUE = "created_issue",
}

export interface ScanFinding {
  id: string;
  scan_id: string;
  tool: string;
  title: string;
  description?: string | null;
  file_path?: string | null;
  line_number?: number | null;
  code_snippet?: string | null;
  severity: IssueSeverity | string;
  confidence: "high" | "medium" | "low" | string;
  ai_analysis?: string | null;
  ai_suggested_fix?: string | null;
  evidence?: string | null;
  status: ScanFindingStatus | string;
  created_issue_id?: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  project_id: string;
  initiated_by: string;
  scan_type: "repository" | "website" | string;
  status: ScanStatus | string;
  target_url: string;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  summary?: {
    total_findings?: number;
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
    security_score?: string;
    scanned_files?: number;
    duration_ms?: number;
  } | null;
  findings?: ScanFinding[];
}

export interface AIBugAnalysisRequest {
  project_id: string;
  bug_description: string;
  component?: string;
  reproduction_steps?: string;
  environment?: string;
}

export interface AIBugAnalysisResponse {
  title: string;
  severity: IssueSeverity | string;
  priority: IssuePriority | string;
  component?: string;
  labels: string[];
  reproduction_steps: string;
  suggested_fix: string;
  root_cause?: string;
  confidence?: string;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal?: string | null;
  status: "future" | "active" | "completed" | string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "issue_assigned" | "scan_completed" | "comment_added" | "critical_bug";
  read: boolean;
  link?: string;
  created_at: string;
}
