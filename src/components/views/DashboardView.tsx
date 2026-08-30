import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import { api, DashboardMetrics } from "../../lib/api";
import {
  CheckSquare,
  AlertTriangle,
  Flame,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Plus,
  Terminal,
  Activity,
  FolderGit2,
  Code2,
} from "lucide-react";
import { StatusBadge, SeverityBadge, PriorityBadge } from "../common/Badges";
import { formatDate, formatDateTime, getInitials } from "../../lib/utils";
import { IssueSeverity, IssueStatus } from "../../types";

export const DashboardView: React.FC = () => {
  const {
    activeProject,
    projects,
    issues,
    setActiveView,
    setSelectedIssueId,
    setIsCreateIssueOpen,
  } = useProject();
  const { user } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const data = await api.dashboard.getMetrics(activeProject?.id);
        if (isMounted) {
          setMetrics(data);
        }
      } catch (err) {
        console.warn("Failed to fetch backend metrics, using local issue state", err);
      } finally {
        if (isMounted) setLoadingMetrics(false);
      }
    };
    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, [activeProject?.id, issues]);

  // Derived or backend metrics
  const totalIssues = metrics ? metrics.total_issues : issues.length;
  const openIssues = metrics
    ? metrics.open_issues
    : issues.filter(
        (i) => i.status === IssueStatus.OPEN || i.status === IssueStatus.REOPENED
      ).length;
  const inProgressIssues = metrics
    ? metrics.in_progress_issues
    : issues.filter(
        (i) => i.status === IssueStatus.IN_PROGRESS || i.status === IssueStatus.IN_REVIEW
      ).length;
  const criticalIssues = metrics
    ? metrics.critical_issues
    : issues.filter(
        (i) =>
          i.severity === IssueSeverity.CRITICAL &&
          i.status !== IssueStatus.RESOLVED &&
          i.status !== IssueStatus.CLOSED
      ).length;
  const resolvedIssues = metrics
    ? metrics.resolved_issues
    : issues.filter(
        (i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED
      ).length;

  const securityScore = metrics?.security_score || "B+";
  const securityScoreNum = metrics?.security_score_num || 84;

  // Recent high priority issues
  const urgentIssues = issues
    .filter(
      (i) =>
        (i.severity === IssueSeverity.CRITICAL || i.severity === IssueSeverity.HIGH) &&
        i.status !== IssueStatus.RESOLVED &&
        i.status !== IssueStatus.CLOSED
    )
    .slice(0, 6);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Engineering Overview
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/70">
              {activeProject?.name || "All Projects"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Issue backlog velocity, open blockers, and automated vulnerability pipeline status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView("ai-hunter")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
            <span>Security Scanner</span>
          </button>
          <button
            onClick={() => setIsCreateIssueOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* KPI Grid - Clean single-container border-divided strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-[#0d0f17] border border-zinc-800/80 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80 overflow-hidden">
        {/* Open Issues */}
        <div
          onClick={() => setActiveView("issues")}
          className="p-4.5 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Open Backlog</span>
            <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{openIssues}</span>
            <span className="text-xs text-zinc-500 font-mono">/ {totalIssues}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1 font-mono">
            {totalIssues ? Math.round((openIssues / totalIssues) * 100) : 0}% unresolved
          </p>
        </div>

        {/* Critical Blockers */}
        <div
          onClick={() => setActiveView("issues")}
          className="p-4.5 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center justify-between text-rose-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-medium">Critical Blockers</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{criticalIssues}</span>
            <span className="text-xs text-zinc-500 font-mono">P0 / Sev-1</span>
          </div>
          <p className="text-[11px] text-rose-400/70 mt-1 font-mono">
            {criticalIssues > 0 ? "Requires remediation" : "No active blockers"}
          </p>
        </div>

        {/* In Flight */}
        <div
          onClick={() => setActiveView("board")}
          className="p-4.5 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">In Progress</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{inProgressIssues}</span>
            <span className="text-xs text-zinc-500 font-mono">active</span>
          </div>
          <p className="text-[11px] text-amber-400/80 mt-1 font-mono">
            Under active development
          </p>
        </div>

        {/* Resolved */}
        <div
          onClick={() => setActiveView("analytics")}
          className="p-4.5 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Resolved Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{resolvedIssues}</span>
            <span className="text-xs text-zinc-500 font-mono">
              ({totalIssues ? Math.round((resolvedIssues / totalIssues) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-emerald-400/70 mt-1 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Closed issues verified</span>
          </p>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High Priority Issues List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-[#0d0f17] border border-zinc-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Critical & High Priority Issues</h2>
              </div>
              <button
                onClick={() => setActiveView("issues")}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>View All ({totalIssues})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-zinc-800/50 mt-1">
              {urgentIssues.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-xs">
                  No active critical bugs in this project.
                </div>
              ) : (
                urgentIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => {
                      setSelectedIssueId(issue.id);
                      setActiveView("issue-detail");
                    }}
                    className="py-3 px-2 flex items-start justify-between gap-3 hover:bg-zinc-800/40 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-xs font-mono text-indigo-400 font-semibold shrink-0 mt-0.5">
                        FIX-{issue.issue_number}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {issue.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-500">
                          <span className="font-mono text-zinc-400 bg-zinc-800/70 px-1.5 py-0.2 rounded text-[10px]">
                            {issue.component}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{formatDate(issue.created_at)}</span>
                          {issue.assignee && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-300 flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-300">
                                  {getInitials(issue.assignee.name)}
                                </span>
                                <span>{issue.assignee.name}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <SeverityBadge severity={issue.severity} />
                      <StatusBadge status={issue.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Diagnostics Action */}
          <div className="p-4 rounded-xl bg-[#0d0f17] border border-zinc-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-indigo-400 flex items-center justify-center shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">Diagnostic Bug Assistant</p>
                <p className="text-[11px] text-zinc-400">
                  Analyze stack traces, deduct root causes, and generate automated code patches.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView("ai-assistant")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 shrink-0 transition-colors"
            >
              Analyze Log
            </button>
          </div>
        </div>

        {/* Right Col: Security Scanner & Active Workspace Status */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Security Pipeline</h2>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                SAST Engine
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono">Security Score</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {securityScore} ({securityScoreNum}/100)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, securityScoreNum))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
                <span>AST Rule Engine Active</span>
                <span>Bandit • Semgrep • Gitleaks</span>
              </div>
            </div>

            <button
              onClick={() => setActiveView("ai-hunter")}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Open Security Scanner</span>
            </button>
          </div>

          {/* Active Workspace Info */}
          <div className="p-4.5 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Workspace Context
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Repository</span>
                <span className="font-mono text-zinc-200 text-[11px] truncate max-w-[150px]">
                  {activeProject?.github_repo_url || "github.com/org/fixora"}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Project Key</span>
                <span className="font-mono text-indigo-400 text-[11px]">
                  {activeProject?.key || "FIX"}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Engine Runtime</span>
                <span className="font-mono text-zinc-300 text-[11px]">FastAPI 0.110 + React</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
