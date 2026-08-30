import React, { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { useNotification } from "../../context/NotificationContext";
import { Issue, IssueStatus, IssueSeverity } from "../../types";
import {
  Plus,
  MoreHorizontal,
  Sparkles,
  ShieldAlert,
  Flame,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { SeverityBadge, PriorityBadge, SourceBadge } from "../common/Badges";
import { getInitials } from "../../lib/utils";

const COLUMNS: { id: IssueStatus; title: string; color: string }[] = [
  { id: IssueStatus.OPEN, title: "Backlog & Open", color: "border-sky-500/40 bg-sky-500/5" },
  { id: IssueStatus.IN_PROGRESS, title: "In Progress", color: "border-amber-500/40 bg-amber-500/5" },
  { id: IssueStatus.IN_REVIEW, title: "In Review", color: "border-purple-500/40 bg-purple-500/5" },
  { id: IssueStatus.RESOLVED, title: "Resolved & Closed", color: "border-emerald-500/40 bg-emerald-500/5" },
];

export const KanbanBoardView: React.FC = () => {
  const {
    issues,
    activeProject,
    setSelectedIssueId,
    setActiveView,
    setIsCreateIssueOpen,
    updateIssue,
    setQuickPrefillIssueData,
  } = useProject();
  const { showToast } = useNotification();

  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filteredIssues = issues.filter((i) => {
    if (severityFilter !== "all" && i.severity !== severityFilter) return false;
    return true;
  });

  const handleMoveStatus = async (issueId: string, newStatus: IssueStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateIssue(issueId, { status: newStatus });
      showToast({ type: "success", title: "Status Updated", message: `Moved to ${newStatus}` });
    } catch (err: any) {
      showToast({ type: "error", title: "Failed to move issue", message: err.message });
    }
  };

  const getIssuesForColumn = (colId: IssueStatus) => {
    if (colId === IssueStatus.RESOLVED) {
      return filteredIssues.filter(
        (i) => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED
      );
    }
    return filteredIssues.filter((i) => i.status === colId);
  };

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Kanban Board</h1>
            <span className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
              {activeProject?.key || "FIX"} Sprint
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Interactive task workflow. Click cards to view full code analysis & audit history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0e1017] border border-zinc-700/80 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="all">All Severities</option>
            <option value={IssueSeverity.CRITICAL}>Critical Only</option>
            <option value={IssueSeverity.HIGH}>High & Critical</option>
            <option value={IssueSeverity.MEDIUM}>Medium</option>
          </select>

          <button
            onClick={() => setIsCreateIssueOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0 overflow-y-auto pb-4">
        {COLUMNS.map((col, colIdx) => {
          const colIssues = getIssuesForColumn(col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col bg-[#0b0d14] border border-zinc-800/80 rounded-xl overflow-hidden min-h-[400px]"
            >
              {/* Column Header */}
              <div
                className={`p-3 border-b border-zinc-800 flex items-center justify-between ${col.color}`}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                    {col.title}
                  </h3>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700">
                    {colIssues.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setQuickPrefillIssueData({ status: col.id });
                    setIsCreateIssueOpen(true);
                  }}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
                  title="Add issue to this column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards list */}
              <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto">
                {colIssues.length === 0 ? (
                  <div className="h-32 flex items-center justify-center border border-dashed border-zinc-800 rounded-lg text-[11px] text-zinc-600">
                    No active issues
                  </div>
                ) : (
                  colIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        setActiveView("issue-detail");
                      }}
                      className="p-3 bg-[#111420] hover:bg-[#151928] border border-zinc-800/90 hover:border-zinc-700 rounded-lg shadow-sm cursor-pointer transition-all space-y-2.5 group"
                    >
                      {/* Top row: Key and Severity */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-indigo-400 group-hover:text-indigo-300">
                          FIX-{issue.issue_number}
                        </span>
                        <SeverityBadge severity={issue.severity} />
                      </div>

                      {/* Title */}
                      <p className="text-xs font-semibold text-zinc-200 line-clamp-2 leading-snug">
                        {issue.title}
                      </p>

                      {/* Component + Source */}
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
                        <span className="truncate max-w-[120px] bg-zinc-800/60 px-1.5 py-0.5 rounded text-zinc-300">
                          {issue.component || "General"}
                        </span>
                        <SourceBadge source={issue.source} />
                      </div>

                      {/* Bottom row: Assignee and Move Action */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        {issue.assignee ? (
                          <div className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
                            <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px] font-bold">
                              {getInitials(issue.assignee.name)}
                            </div>
                            <span className="truncate max-w-[80px]">{issue.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono">Unassigned</span>
                        )}

                        {/* Move next stage quick button */}
                        {colIdx < COLUMNS.length - 1 && (
                          <button
                            onClick={(e) =>
                              handleMoveStatus(issue.id, COLUMNS[colIdx + 1].id, e)
                            }
                            className="p-1 rounded text-zinc-400 hover:text-indigo-300 hover:bg-zinc-800 transition-colors flex items-center gap-0.5 text-[10px] font-mono"
                            title={`Move to ${COLUMNS[colIdx + 1].title}`}
                          >
                            <span>Move</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
