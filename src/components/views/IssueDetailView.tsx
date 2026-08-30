import React, { useState, useEffect, useCallback } from "react";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { api } from "../../lib/api";
import {
  Issue,
  IssueStatus,
  IssueSeverity,
  IssuePriority,
  Comment,
  IssueHistory,
} from "../../types";
import {
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Send,
  Copy,
  Check,
  Clock,
  History,
  MessageSquare,
  Flame,
  GitPullRequest,
  CheckCircle2,
  Terminal,
  Code2,
} from "lucide-react";
import { StatusBadge, SeverityBadge, PriorityBadge, SourceBadge } from "../common/Badges";
import { formatDate, formatDateTime, getInitials } from "../../lib/utils";

export const IssueDetailView: React.FC = () => {
  const { selectedIssueId, setActiveView, updateIssue, members } = useProject();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<IssueHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New comment input
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isGeneratingAiPatch, setIsGeneratingAiPatch] = useState(false);
  const [hasCopiedPatch, setHasCopiedPatch] = useState(false);

  const loadIssueData = useCallback(async () => {
    if (!selectedIssueId) return;
    try {
      setIsLoading(true);
      const [iss, comms, hist] = await Promise.all([
        api.issues.get(selectedIssueId),
        api.issues.getComments(selectedIssueId),
        api.issues.getHistory(selectedIssueId),
      ]);
      setIssue(iss);
      setComments(comms);
      setHistory(hist);
    } catch (err: any) {
      showToast({ type: "error", title: "Error loading issue", message: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [selectedIssueId, showToast]);

  useEffect(() => {
    loadIssueData();
  }, [loadIssueData]);

  if (!selectedIssueId || (!isLoading && !issue)) {
    return (
      <div className="p-12 text-center text-zinc-500">
        <p>No issue selected.</p>
        <button
          onClick={() => setActiveView("issues")}
          className="mt-3 px-4 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
        >
          ← Return to issues list
        </button>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue) return;
    try {
      const updated = await updateIssue(issue.id, { status: newStatus });
      setIssue(updated);
      showToast({ type: "success", title: "Status Updated", message: `Status changed to ${newStatus}` });
      const hist = await api.issues.getHistory(issue.id);
      setHistory(hist);
    } catch (err: any) {
      showToast({ type: "error", title: "Update failed", message: err.message });
    }
  };

  const handleSeverityChange = async (newSeverity: IssueSeverity) => {
    if (!issue) return;
    try {
      const updated = await updateIssue(issue.id, { severity: newSeverity });
      setIssue(updated);
      showToast({ type: "success", title: "Severity Updated", message: `Severity set to ${newSeverity}` });
      const hist = await api.issues.getHistory(issue.id);
      setHistory(hist);
    } catch (err: any) {
      showToast({ type: "error", title: "Update failed", message: err.message });
    }
  };

  const handlePriorityChange = async (newPriority: IssuePriority) => {
    if (!issue) return;
    try {
      const updated = await updateIssue(issue.id, { priority: newPriority });
      setIssue(updated);
      showToast({ type: "success", title: "Priority Updated", message: `Priority set to ${newPriority}` });
      const hist = await api.issues.getHistory(issue.id);
      setHistory(hist);
    } catch (err: any) {
      showToast({ type: "error", title: "Update failed", message: err.message });
    }
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    if (!issue) return;
    try {
      const updated = await updateIssue(issue.id, { assignee_id: assigneeId || undefined });
      setIssue(updated);
      showToast({ type: "success", title: "Assignee Updated", message: `Assigned updated successfully` });
      const hist = await api.issues.getHistory(issue.id);
      setHistory(hist);
    } catch (err: any) {
      showToast({ type: "error", title: "Update failed", message: err.message });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !issue) return;
    try {
      setIsSubmittingComment(true);
      const c = await api.issues.addComment(issue.id, newCommentText.trim());
      setComments((prev) => [...prev, c]);
      setNewCommentText("");
      showToast({ type: "success", title: "Comment Posted" });
    } catch (err: any) {
      showToast({ type: "error", title: "Failed to post comment", message: err.message });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAskAiForPatch = async () => {
    if (!issue) return;
    try {
      setIsGeneratingAiPatch(true);
      const res = await api.ai.analyzeBug({
        project_id: issue.project_id,
        bug_description: `${issue.title}\n\n${issue.description}`,
        component: issue.component,
        reproduction_steps: issue.reproduction_steps || undefined,
      });

      const updated = await updateIssue(issue.id, {
        suggested_fix: res.suggested_fix,
      });
      setIssue(updated);

      // Also append AI comment
      const aiComment = await api.issues.addComment(
        issue.id,
        `🤖 **Fixora AI Automated Analysis**:\n\n**Root Cause**: ${res.root_cause}\n\n**Confidence**: ${res.confidence}\n\n\`\`\`\n${res.suggested_fix}\n\`\`\``,
        true
      );
      setComments((prev) => [...prev, aiComment]);

      showToast({
        type: "success",
        title: "AI Analysis Complete",
        message: "Patch & root cause analysis generated.",
      });
    } catch (err: any) {
      showToast({ type: "error", title: "AI Generation Failed", message: err.message });
    } finally {
      setIsGeneratingAiPatch(false);
    }
  };

  const copyPatch = (code: string) => {
    navigator.clipboard.writeText(code);
    setHasCopiedPatch(true);
    setTimeout(() => setHasCopiedPatch(false), 2000);
    showToast({ type: "info", title: "Copied to clipboard" });
  };

  if (isLoading || !issue) {
    return (
      <div className="p-12 text-center text-zinc-400 text-xs font-mono">
        Loading issue telemetry...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <button
          onClick={() => setActiveView("issues")}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Issues</span>
        </button>

        <div className="flex items-center gap-2">
          <SourceBadge source={issue.source} />
          <button
            onClick={handleAskAiForPatch}
            disabled={isGeneratingAiPatch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isGeneratingAiPatch ? "Analyzing with AI..." : "Generate AI Patch"}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Issue Content, Code, Timeline, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Info */}
          <div className="p-6 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-950/40 px-2.5 py-0.5 rounded border border-indigo-800/50">
                FIX-{issue.issue_number}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                Reported {formatDateTime(issue.created_at)}
              </span>
            </div>

            <h1 className="text-lg font-bold text-zinc-100 leading-snug">
              {issue.title}
            </h1>

            {/* Description */}
            <div className="pt-3 border-t border-zinc-800/80">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Description & Stack Trace
              </h3>
              <div className="bg-[#121520] p-4 rounded-lg border border-zinc-800/80 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {issue.description || "No description provided."}
              </div>
            </div>

            {/* Reproduction Steps */}
            {issue.reproduction_steps && (
              <div className="pt-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                  Reproduction Protocol
                </h3>
                <div className="bg-[#121520] p-3 rounded-lg border border-zinc-800/80 text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                  {issue.reproduction_steps}
                </div>
              </div>
            )}

            {/* AI Suggested Fix / Code Snippet */}
            {issue.suggested_fix && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                      AI Suggested Fix & Patch
                    </h3>
                  </div>
                  <button
                    onClick={() => copyPatch(issue.suggested_fix!)}
                    className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 border border-zinc-700"
                  >
                    {hasCopiedPatch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{hasCopiedPatch ? "Copied" : "Copy Patch"}</span>
                  </button>
                </div>
                <div className="bg-[#090b11] p-4 rounded-lg border border-emerald-900/40 text-xs font-mono text-emerald-200/90 whitespace-pre-wrap overflow-x-auto">
                  {issue.suggested_fix}
                </div>
              </div>
            )}
          </div>

          {/* Activity History Audit Trail */}
          <div className="p-6 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <History className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Audit Trail & History
              </h2>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-xs text-zinc-500">No status changes recorded yet.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="flex items-start gap-2.5 text-xs text-zinc-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-zinc-200 font-semibold">{h.user?.name || "System"}</span>{" "}
                      changed <span className="text-indigo-300 font-semibold">{h.field_changed}</span>{" "}
                      {h.old_value && (
                        <>
                          from <span className="text-zinc-400 line-through">{h.old_value}</span>{" "}
                        </>
                      )}
                      to <span className="text-emerald-400 font-semibold">{h.new_value}</span>
                      <span className="text-[10px] text-zinc-500 ml-2">
                        ({formatDateTime(h.created_at)})
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comments Thread */}
          <div className="p-6 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                Developer Discussion ({comments.length})
              </h2>
            </div>

            {/* List of comments */}
            <div className="space-y-3">
              {comments.map((comm) => (
                <div
                  key={comm.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                    comm.is_ai_generated
                      ? "bg-indigo-950/20 border-indigo-500/30 text-indigo-100"
                      : "bg-[#121520] border-zinc-800 text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-[9px] font-bold">
                        {getInitials(comm.user?.name)}
                      </div>
                      <span className="font-semibold text-zinc-200">
                        {comm.user?.name || "Developer"}
                      </span>
                      {comm.is_ai_generated && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                          AI Agent
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatDateTime(comm.created_at)}
                    </span>
                  </div>
                  <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {comm.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Post comment input */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-zinc-800 space-y-2">
              <textarea
                rows={3}
                placeholder="Leave a comment, code review note, or test result..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newCommentText.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmittingComment ? "Posting..." : "Comment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Metadata and Quick Controls */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800">
              Attributes & Triage
            </h3>

            {/* Status Selector */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Status
              </label>
              <select
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value as IssueStatus)}
                className="w-full px-2.5 py-1.5 bg-[#141724] border border-zinc-700/80 rounded-lg text-xs text-zinc-200 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value={IssueStatus.OPEN}>Open</option>
                <option value={IssueStatus.IN_PROGRESS}>In Progress</option>
                <option value={IssueStatus.IN_REVIEW}>In Review</option>
                <option value={IssueStatus.RESOLVED}>Resolved</option>
                <option value={IssueStatus.CLOSED}>Closed</option>
                <option value={IssueStatus.REOPENED}>Reopened</option>
              </select>
            </div>

            {/* Severity Selector */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Severity
              </label>
              <select
                value={issue.severity}
                onChange={(e) => handleSeverityChange(e.target.value as IssueSeverity)}
                className="w-full px-2.5 py-1.5 bg-[#141724] border border-zinc-700/80 rounded-lg text-xs text-zinc-200 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value={IssueSeverity.CRITICAL}>Critical (Blocker)</option>
                <option value={IssueSeverity.HIGH}>High</option>
                <option value={IssueSeverity.MEDIUM}>Medium</option>
                <option value={IssueSeverity.LOW}>Low</option>
                <option value={IssueSeverity.TRIVIAL}>Trivial</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Priority
              </label>
              <select
                value={issue.priority}
                onChange={(e) => handlePriorityChange(e.target.value as IssuePriority)}
                className="w-full px-2.5 py-1.5 bg-[#141724] border border-zinc-700/80 rounded-lg text-xs text-zinc-200 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value={IssuePriority.URGENT}>Urgent (P0)</option>
                <option value={IssuePriority.HIGH}>High (P1)</option>
                <option value={IssuePriority.MEDIUM}>Medium (P2)</option>
                <option value={IssuePriority.LOW}>Low (P3)</option>
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Assignee
              </label>
              <select
                value={issue.assignee_id || ""}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#141724] border border-zinc-700/80 rounded-lg text-xs text-zinc-200 font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.user_id}>
                    {m.user?.name || m.user?.email || m.user_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Component */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Component / Subsystem
              </label>
              <input
                type="text"
                value={issue.component || ""}
                onChange={async (e) => {
                  const val = e.target.value;
                  const updated = await updateIssue(issue.id, { component: val });
                  setIssue(updated);
                }}
                className="w-full px-2.5 py-1.5 bg-[#141724] border border-zinc-700/80 rounded-lg text-xs text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Reporter & Metadata Details */}
          <div className="p-5 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-3 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Reporter</span>
              <span className="text-zinc-200 font-semibold font-mono">
                {issue.reporter?.name || "Alex River"}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Source</span>
              <SourceBadge source={issue.source} />
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Created</span>
              <span className="text-zinc-300 font-mono text-[11px]">
                {formatDate(issue.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Updated</span>
              <span className="text-zinc-300 font-mono text-[11px]">
                {formatDate(issue.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
