import React, { useState, useMemo } from "react";
import { useProject } from "../../context/ProjectContext";
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  CheckSquare,
  Sparkles,
  ShieldAlert,
  Flame,
  User as UserIcon,
  Tag,
  SlidersHorizontal,
  CircleDot,
  CheckCircle2,
  Clock,
  Radio,
  XCircle,
} from "lucide-react";
import { StatusBadge, SeverityBadge, PriorityBadge, SourceBadge } from "../common/Badges";
import { formatDate, getInitials } from "../../lib/utils";
import { Issue, IssueStatus, IssueSeverity, IssuePriority } from "../../types";

export const IssuesView: React.FC = () => {
  const {
    issues,
    activeProject,
    setSelectedIssueId,
    setActiveView,
    setIsCreateIssueOpen,
    updateIssue,
  } = useProject();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [componentFilter, setComponentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"number" | "created" | "severity" | "priority">("created");

  // Distinct components
  const componentsList = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => {
      if (i.component) set.add(i.component);
    });
    return Array.from(set);
  }, [issues]);

  // Filtering & Sorting
  const filteredIssues = useMemo(() => {
    return issues
      .filter((i) => {
        if (statusFilter !== "all" && i.status !== statusFilter) return false;
        if (severityFilter !== "all" && i.severity !== severityFilter) return false;
        if (priorityFilter !== "all" && i.priority !== priorityFilter) return false;
        if (componentFilter !== "all" && i.component !== componentFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = i.title.toLowerCase().includes(q);
          const matchNum = `fix-${i.issue_number}`.toLowerCase().includes(q);
          const matchComp = i.component?.toLowerCase().includes(q);
          const matchDesc = i.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchNum && !matchComp && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "created") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === "number") {
          return b.issue_number - a.issue_number;
        }
        if (sortBy === "severity") {
          const weight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, trivial: 0 };
          return (weight[b.severity] || 0) - (weight[a.severity] || 0);
        }
        if (sortBy === "priority") {
          const weight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (weight[b.priority] || 0) - (weight[a.priority] || 0);
        }
        return 0;
      });
  }, [issues, statusFilter, severityFilter, priorityFilter, componentFilter, searchQuery, sortBy]);

  const openIssueDetail = (id: string) => {
    setSelectedIssueId(id);
    setActiveView("issue-detail");
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Issues</h1>
            <span className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
              {filteredIssues.length} of {issues.length}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Namespace:{" "}
            <span className="text-indigo-400 font-mono font-medium">
              {activeProject?.name || "Fixora Core"} ({activeProject?.key || "FIX"})
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateIssueOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0e1017] p-2.5 rounded-xl border border-zinc-800/80">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by title, FIX-#, component..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#121520] border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-[#121520] border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
        >
          <option value="all">All Statuses</option>
          <option value={IssueStatus.OPEN}>Open</option>
          <option value={IssueStatus.IN_PROGRESS}>In Progress</option>
          <option value={IssueStatus.IN_REVIEW}>In Review</option>
          <option value={IssueStatus.RESOLVED}>Resolved</option>
          <option value={IssueStatus.CLOSED}>Closed</option>
        </select>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-[#121520] border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
        >
          <option value="all">All Severities</option>
          <option value={IssueSeverity.CRITICAL}>Critical</option>
          <option value={IssueSeverity.HIGH}>High</option>
          <option value={IssueSeverity.MEDIUM}>Medium</option>
          <option value={IssueSeverity.LOW}>Low</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-[#121520] border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
        >
          <option value="all">All Priorities</option>
          <option value={IssuePriority.URGENT}>Urgent (P0)</option>
          <option value={IssuePriority.HIGH}>High (P1)</option>
          <option value={IssuePriority.MEDIUM}>Medium (P2)</option>
          <option value={IssuePriority.LOW}>Low (P3)</option>
        </select>

        {/* Component Filter */}
        {componentsList.length > 0 && (
          <select
            value={componentFilter}
            onChange={(e) => setComponentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#121520] border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Components</option>
            {componentsList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        {/* Sort By */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 pl-2 border-l border-zinc-800">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#121520] border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-mono"
          >
            <option value="created">Newest First</option>
            <option value="number">Issue #</option>
            <option value="severity">Severity</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Issues Table Container */}
      <div className="bg-[#0d0f17] border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#121520] text-zinc-400 uppercase font-mono tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold w-24">Key</th>
                <th className="py-3 px-4 font-semibold">Title & Context</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Severity</th>
                <th className="py-3 px-3 font-semibold">Priority</th>
                <th className="py-3 px-3 font-semibold">Assignee</th>
                <th className="py-3 px-4 font-semibold text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs font-mono">
                    No issues match current filters.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => openIssueDetail(issue.id)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Key */}
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-400 whitespace-nowrap">
                      FIX-{issue.issue_number}
                    </td>

                    {/* Title + Component + Source Tag */}
                    <td className="py-3 px-4 min-w-[280px]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {issue.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {issue.component && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                            {issue.component}
                          </span>
                        )}
                        <SourceBadge source={issue.source} />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={issue.status} />
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <SeverityBadge severity={issue.severity} />
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <PriorityBadge priority={issue.priority} />
                    </td>

                    {/* Assignee */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {issue.assignee ? (
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <div className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center text-[9px] font-mono font-semibold">
                            {getInitials(issue.assignee.name)}
                          </div>
                          <span className="truncate max-w-[100px] text-xs">{issue.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 font-mono text-[11px]">Unassigned</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {formatDate(issue.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
