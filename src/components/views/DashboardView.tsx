import React from "react";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
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
  GitPullRequest,
  Plus,
  Terminal,
  Activity,
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

  // Metrics
  const totalIssues = issues.length;
  const openIssues = issues.filter(
    (i) => i.status === IssueStatus.OPEN || i.status === IssueStatus.REOPENED
  ).length;
  const inProgressIssues = issues.filter(
    (i) => i.status === IssueStatus.IN_PROGRESS || i.status === IssueStatus.IN_REVIEW
  ).length;
  const criticalIssues = issues.filter(
    (i) =>
      i.severity === IssueSeverity.CRITICAL &&
      i.status !== IssueStatus.RESOLVED &&
      i.status !== IssueStatus.CLOSED
  ).length;
  const resolvedIssues = issues.filter(
    (i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED
  ).length;

  // Recent high priority issues
  const urgentIssues = issues
    .filter(
      (i) =>
        (i.severity === IssueSeverity.CRITICAL || i.severity === IssueSeverity.HIGH) &&
        i.status !== IssueStatus.RESOLVED &&
        i.status !== IssueStatus.CLOSED
    )
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner / Overview Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              Developer Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {activeProject?.name || "All Projects"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time bug telemetry, active sprint health, and automated vulnerability monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveView("ai-hunter")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Launch Repo Scanner</span>
          </button>
          <button
            onClick={() => setIsCreateIssueOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Bug</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Issues */}
        <div
          onClick={() => setActiveView("issues")}
          className="p-4 rounded-xl bg-[#0e1017] border border-zinc-800/80 hover:border-zinc-700/80 cursor-pointer transition-all hover:bg-zinc-900/40"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Issues</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{openIssues}</span>
            <span className="text-xs text-zinc-500 font-mono">/ {totalIssues} total</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="text-sky-400 font-semibold font-mono">
              {totalIssues ? Math.round((openIssues / totalIssues) * 100) : 0}%
            </span>
            <span>of active backlog</span>
          </div>
        </div>

        {/* Critical Blockers */}
        <div
          onClick={() => setActiveView("issues")}
          className="p-4 rounded-xl bg-[#0e1017] border border-rose-900/30 hover:border-rose-700/50 cursor-pointer transition-all hover:bg-rose-950/10"
        >
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Blockers</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{criticalIssues}</span>
            <span className="text-xs text-rose-400/60 font-mono">P0 / Sev-1</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-rose-300/80">
            <span className="font-semibold">Requires immediate fix</span>
          </div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setActiveView("board")}
          className="p-4 rounded-xl bg-[#0e1017] border border-zinc-800/80 hover:border-zinc-700/80 cursor-pointer transition-all hover:bg-zinc-900/40"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Flight</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{inProgressIssues}</span>
            <span className="text-xs text-zinc-500 font-mono">assigned</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-400">
            <span>In dev or review</span>
          </div>
        </div>

        {/* Resolution Rate */}
        <div
          onClick={() => setActiveView("analytics")}
          className="p-4 rounded-xl bg-[#0e1017] border border-zinc-800/80 hover:border-zinc-700/80 cursor-pointer transition-all hover:bg-zinc-900/40"
        >
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{resolvedIssues}</span>
            <span className="text-xs text-zinc-500 font-mono">
              ({totalIssues ? Math.round((resolvedIssues / totalIssues) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400/80">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sprint velocity steady</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Issues & AI Bug Hunter Centerpiece */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High Priority Issues */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-[#0d0f17] border border-zinc-800/80">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Critical & High Priority Issues</h2>
              </div>
              <button
                onClick={() => setActiveView("issues")}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>View All ({totalIssues})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-zinc-800/50 mt-1">
              {urgentIssues.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
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
                          <span className="font-mono text-zinc-400">{issue.component}</span>
                          <span>•</span>
                          <span>Reported {formatDate(issue.created_at)}</span>
                          {issue.assignee && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-300 flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-300">
                                  {getInitials(issue.assignee.name)}
                                </span>
                                {issue.assignee.name}
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

          {/* Quick AI Diagnostics Trigger */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#0e1017] border border-indigo-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-200">AI Bug Assistant Analysis</p>
                <p className="text-[11px] text-zinc-400">
                  Paste error logs or stack traces to auto-categorize severity and generate instant code fixes.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView("ai-assistant")}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 shadow-md transition-all"
            >
              Analyze Log
            </button>
          </div>
        </div>

        {/* Right Col: AI Bug Hunter Card & Quick Scan Widget */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Repository Scanner</h2>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                SAST + AI
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Security Score</span>
                <span className="text-emerald-400 font-mono font-bold">A- (88/100)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 w-[88%]" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
                <span>54 files analyzed</span>
                <span>Bandit • Semgrep • Gitleaks</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Automated security pipeline parses AST trees for SQL injections, secrets, and hardcoded tokens.
              </p>
              <button
                onClick={() => setActiveView("ai-hunter")}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Security Scanner</span>
              </button>
            </div>
          </div>

          {/* Project Details Box */}
          <div className="p-4 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Environment
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Repository</span>
                <span className="font-mono text-zinc-200 text-[11px] truncate max-w-[140px]">
                  {activeProject?.github_repo_url || "github.com/org/fixora"}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Async Engine</span>
                <span className="font-mono text-indigo-400 text-[11px]">Celery + Redis</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Vector Index</span>
                <span className="font-mono text-purple-400 text-[11px]">pgvector (HNSW)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
