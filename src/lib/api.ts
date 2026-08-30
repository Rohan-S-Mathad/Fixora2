import {
  User,
  Project,
  ProjectMember,
  Issue,
  IssueStatus,
  IssueSeverity,
  IssuePriority,
  IssueSource,
  Comment,
  IssueHistory,
  Scan,
  ScanStatus,
  ScanFinding,
  ScanFindingStatus,
  AIBugAnalysisRequest,
  AIBugAnalysisResponse,
  NotificationItem,
  Sprint,
} from "../types";

export interface DashboardMetrics {
  total_issues: number;
  open_issues: number;
  in_progress_issues: number;
  critical_issues: number;
  resolved_issues: number;
  resolution_rate: number;
  security_score: string;
  security_score_num: number;
  scans_count: number;
  total_security_findings: number;
  critical_security_findings: number;
  active_sprint_name?: string | null;
  active_sprint_goal?: string | null;
  active_sprint_id?: string | null;
}

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("fixora_custom_api_url") ||
      (window as any).__FIXORA_API_URL__ ||
      "/api/v1"
    );
  }
  return "/api/v1";
};

export const setApiBaseUrl = (url: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("fixora_custom_api_url", url);
  }
};

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("fixora_access_token");
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("fixora_access_token", token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fixora_access_token");
  }
}

// ---------------------------------------------------------------------------
// Core Real API Fetcher
// ---------------------------------------------------------------------------
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getAuthToken();

  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error(
      `Network connection failed: ${err.message || "Unable to reach Fixora API backend"}`
    );
  }

  if (res.status === 401) {
    clearAuthToken();
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null as unknown as T;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API Error (${res.status}): ${text || res.statusText}`);
    }
    return null as unknown as T;
  }

  const json = await res.json();
  if (!res.ok) {
    const errorDetail =
      json.detail || json.message || `Request failed with status ${res.status}`;
    throw new Error(typeof errorDetail === "string" ? errorDetail : JSON.stringify(errorDetail));
  }

  return json as T;
}

export async function testLiveApiConnection(): Promise<boolean> {
  try {
    const res = await fetch("/api/health");
    if (res.ok) return true;
    const resV1 = await fetch(`${getApiBaseUrl()}/projects`);
    return resV1.status < 500;
  } catch (err) {
    return false;
  }
}

export function resetDatabaseToDefaults() {
  localStorage.removeItem("fixora_notifications");
}

// ---------------------------------------------------------------------------
// Unified API Client
// ---------------------------------------------------------------------------
export const api = {
  // -------------------------------------------------------------------------
  // Auth API
  // -------------------------------------------------------------------------
  auth: {
    async getCurrentUser(): Promise<User> {
      return apiRequest<User>("/auth/me", { method: "GET" });
    },

    async login(email: string, password?: string): Promise<{ access_token: string; user: User }> {
      const data = await apiRequest<{ access_token: string; token_type: string; user: User }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password: password || "fixora123" }),
        }
      );
      if (data.access_token) {
        setAuthToken(data.access_token);
      }
      return data;
    },

    async register(name: string, email: string, password?: string): Promise<User> {
      const data = await apiRequest<{ access_token: string; token_type: string; user: User }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ name, email, password: password || "fixora123" }),
        }
      );
      if (data.access_token) {
        setAuthToken(data.access_token);
      }
      return data.user;
    },

    async logout(): Promise<void> {
      clearAuthToken();
    },

    async switchUser(userId: string): Promise<User> {
      const data = await apiRequest<{ access_token: string; token_type: string; user: User }>(
        "/auth/switch-user",
        {
          method: "POST",
          body: JSON.stringify({ user_id: userId }),
        }
      );
      if (data.access_token) {
        setAuthToken(data.access_token);
      }
      return data.user;
    },

    async getAllUsers(): Promise<User[]> {
      return apiRequest<User[]>("/auth/users", { method: "GET" });
    },
  },

  // -------------------------------------------------------------------------
  // Projects API
  // -------------------------------------------------------------------------
  projects: {
    async list(): Promise<Project[]> {
      return apiRequest<Project[]>("/projects", { method: "GET" });
    },

    async get(id: string): Promise<Project> {
      return apiRequest<Project>(`/projects/${id}`, { method: "GET" });
    },

    async create(data: {
      name: string;
      key: string;
      description?: string;
      github_repo_url?: string;
    }): Promise<Project> {
      return apiRequest<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async getMembers(projectId: string): Promise<ProjectMember[]> {
      return apiRequest<ProjectMember[]>(`/projects/${projectId}/members`, { method: "GET" });
    },

    async addMember(projectId: string, userId: string, role: string): Promise<ProjectMember> {
      return apiRequest<ProjectMember>(`/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId, role }),
      });
    },
  },

  // -------------------------------------------------------------------------
  // Issues API
  // -------------------------------------------------------------------------
  issues: {
    async list(
      projectId?: string,
      filters?: { status?: string; severity?: string; priority?: string; search?: string }
    ): Promise<Issue[]> {
      const params = new URLSearchParams();
      if (projectId) params.set("project_id", projectId);
      if (filters?.status && filters.status !== "all") params.set("status", filters.status);
      if (filters?.severity && filters.severity !== "all") params.set("severity", filters.severity);
      if (filters?.priority && filters.priority !== "all") params.set("priority", filters.priority);
      if (filters?.search) params.set("search", filters.search);

      const qs = params.toString();
      const endpoint = qs ? `/issues?${qs}` : "/issues";
      return apiRequest<Issue[]>(endpoint, { method: "GET" });
    },

    async get(id: string): Promise<Issue> {
      return apiRequest<Issue>(`/issues/${id}`, { method: "GET" });
    },

    async create(projectId: string, data: Partial<Issue>): Promise<Issue> {
      const payload = {
        ...data,
        project_id: projectId,
        labels: data.labels || ["bug"],
      };
      return apiRequest<Issue>("/issues", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async update(issueId: string, updates: Partial<Issue>): Promise<Issue> {
      return apiRequest<Issue>(`/issues/${issueId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },

    async delete(issueId: string): Promise<{ success: boolean; message: string }> {
      return apiRequest<{ success: boolean; message: string }>(`/issues/${issueId}`, {
        method: "DELETE",
      });
    },

    async getHistory(issueId: string): Promise<IssueHistory[]> {
      return apiRequest<IssueHistory[]>(`/issues/${issueId}/history`, { method: "GET" });
    },

    async getComments(issueId: string): Promise<Comment[]> {
      return apiRequest<Comment[]>(`/issues/${issueId}/comments`, { method: "GET" });
    },

    async addComment(issueId: string, content: string, isAi = false): Promise<Comment> {
      return apiRequest<Comment>(`/issues/${issueId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content, is_ai_generated: isAi }),
      });
    },
  },

  // -------------------------------------------------------------------------
  // Sprints API
  // -------------------------------------------------------------------------
  sprints: {
    async list(projectId?: string): Promise<Sprint[]> {
      const qs = projectId ? `?project_id=${projectId}` : "";
      return apiRequest<Sprint[]>(`/sprints${qs}`, { method: "GET" });
    },

    async create(data: Partial<Sprint>): Promise<Sprint> {
      return apiRequest<Sprint>("/sprints", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(sprintId: string, updates: Partial<Sprint>): Promise<Sprint> {
      return apiRequest<Sprint>(`/sprints/${sprintId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
    },
  },

  // -------------------------------------------------------------------------
  // AI Services API
  // -------------------------------------------------------------------------
  ai: {
    async analyzeBug(data: AIBugAnalysisRequest): Promise<AIBugAnalysisResponse> {
      return apiRequest<AIBugAnalysisResponse>("/ai/analyze-bug", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async generatePatch(data: {
      code_context: string;
      error_message: string;
      file_path?: string;
      bug_description?: string;
    }): Promise<{ patch: string; explanation: string; test_case?: string; model_used?: string }> {
      return apiRequest<{ patch: string; explanation: string; test_case?: string; model_used?: string }>(
        "/ai/generate-patch",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    },

    async triageFinding(data: {
      tool: string;
      finding_title: string;
      finding_description: string;
      code_snippet?: string;
      file_path?: string;
    }): Promise<{
      root_cause: string;
      suggested_fix: string;
      patch?: string;
      severity: string;
      confidence: string;
      model_used?: string;
    }> {
      return apiRequest<{
        root_cause: string;
        suggested_fix: string;
        patch?: string;
        severity: string;
        confidence: string;
        model_used?: string;
      }>("/ai/triage-finding", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  // -------------------------------------------------------------------------
  // Dashboard & Metrics API
  // -------------------------------------------------------------------------
  dashboard: {
    async getMetrics(projectId?: string): Promise<DashboardMetrics> {
      const qs = projectId ? `?project_id=${projectId}` : "";
      return apiRequest<DashboardMetrics>(`/dashboard/metrics${qs}`, { method: "GET" });
    },
  },

  // -------------------------------------------------------------------------
  // Security Scans & AST Findings API
  // -------------------------------------------------------------------------
  scans: {
    async startRepositoryScan(projectId: string, githubUrl: string): Promise<Scan> {
      return apiRequest<Scan>("/security/scans", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          target_url: githubUrl,
          scan_type: "repository",
        }),
      });
    },

    async listScans(projectId?: string): Promise<Scan[]> {
      const qs = projectId ? `?project_id=${projectId}` : "";
      return apiRequest<Scan[]>(`/security/scans${qs}`, { method: "GET" });
    },

    async getStatus(scanId: string): Promise<Scan> {
      const scans = await api.scans.listScans();
      const found = scans.find((s) => s.id === scanId);
      if (!found) throw new Error("Scan not found");
      return found;
    },

    async getFindings(scanId?: string, statusFilter?: string): Promise<ScanFinding[]> {
      const params = new URLSearchParams();
      if (scanId && scanId !== "all") params.set("scan_id", scanId);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

      const qs = params.toString();
      const endpoint = qs ? `/security/findings?${qs}` : "/security/findings";
      return apiRequest<ScanFinding[]>(endpoint, { method: "GET" });
    },

    async createIssueFromFinding(findingId: string): Promise<Issue> {
      const issue = await apiRequest<Issue>(
        `/security/findings/${findingId}/create-issue`,
        { method: "POST" }
      );
      return issue;
    },

    async ignoreFinding(findingId: string): Promise<ScanFinding> {
      return apiRequest<ScanFinding>(`/security/findings/${findingId}/dismiss`, {
        method: "PATCH",
      });
    },

    async completeSimulatedScan(scanId: string): Promise<Scan> {
      const scans = await api.scans.listScans();
      const scan = scans.find((s) => s.id === scanId) || scans[0];
      return scan;
    },
  },

  // -------------------------------------------------------------------------
  // Notifications API (Real backend with local fallback)
  // -------------------------------------------------------------------------
  notifications: {
    async list(): Promise<NotificationItem[]> {
      try {
        const list = await apiRequest<NotificationItem[]>("/notifications", { method: "GET" });
        return list;
      } catch (err) {
        // Fallback to local storage if offline or unauthenticated
        try {
          const raw = localStorage.getItem("fixora_notifications");
          if (raw) return JSON.parse(raw);
        } catch (e) {
          console.error(e);
        }
        return [];
      }
    },

    async markAsRead(id: string): Promise<void> {
      try {
        await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
      } catch (err) {
        const items = await api.notifications.list();
        const updated = items.map((n) => (n.id === id ? { ...n, read: true } : n));
        localStorage.setItem("fixora_notifications", JSON.stringify(updated));
      }
    },

    async markAllAsRead(): Promise<void> {
      try {
        await apiRequest("/notifications/read-all", { method: "POST" });
      } catch (err) {
        const items = await api.notifications.list();
        const updated = items.map((n) => ({ ...n, read: true }));
        localStorage.setItem("fixora_notifications", JSON.stringify(updated));
      }
    },
  },
};
