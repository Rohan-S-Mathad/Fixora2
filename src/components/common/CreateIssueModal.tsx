import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { useNotification } from "../../context/NotificationContext";
import { IssueStatus, IssueSeverity, IssuePriority, IssueSource } from "../../types";
import { X, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";

export const CreateIssueModal: React.FC = () => {
  const {
    isCreateIssueOpen,
    setIsCreateIssueOpen,
    activeProject,
    projects,
    createIssue,
    members,
    quickPrefillIssueData,
    setQuickPrefillIssueData,
  } = useProject();
  const { showToast } = useNotification();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<IssueStatus>(IssueStatus.OPEN);
  const [severity, setSeverity] = useState<IssueSeverity>(IssueSeverity.MEDIUM);
  const [priority, setPriority] = useState<IssuePriority>(IssuePriority.MEDIUM);
  const [component, setComponent] = useState("Backend API");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [reproductionSteps, setReproductionSteps] = useState("");
  const [suggestedFix, setSuggestedFix] = useState("");
  const [source, setSource] = useState<IssueSource>(IssueSource.MANUAL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (quickPrefillIssueData) {
      setTitle(quickPrefillIssueData.title || "");
      setDescription(quickPrefillIssueData.description || "");
      if (quickPrefillIssueData.severity) setSeverity(quickPrefillIssueData.severity as IssueSeverity);
      if (quickPrefillIssueData.priority) setPriority(quickPrefillIssueData.priority as IssuePriority);
      if (quickPrefillIssueData.component) setComponent(quickPrefillIssueData.component);
      if (quickPrefillIssueData.reproduction_steps) setReproductionSteps(quickPrefillIssueData.reproduction_steps);
      if (quickPrefillIssueData.suggested_fix) setSuggestedFix(quickPrefillIssueData.suggested_fix);
      if (quickPrefillIssueData.source) setSource(quickPrefillIssueData.source as IssueSource);
    } else {
      setTitle("");
      setDescription("");
      setStatus(IssueStatus.OPEN);
      setSeverity(IssueSeverity.MEDIUM);
      setPriority(IssuePriority.MEDIUM);
      setComponent("Backend API");
      setAssigneeId("");
      setReproductionSteps("");
      setSuggestedFix("");
      setSource(IssueSource.MANUAL);
    }
  }, [quickPrefillIssueData, isCreateIssueOpen]);

  if (!isCreateIssueOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Issue title is required.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const newIssue = await createIssue({
        title: title.trim(),
        description: description.trim(),
        status,
        severity,
        priority,
        component: component.trim() || "General",
        assignee_id: assigneeId || undefined,
        reproduction_steps: reproductionSteps.trim() || undefined,
        suggested_fix: suggestedFix.trim() || undefined,
        source,
      });

      showToast({
        type: "success",
        title: "Issue Created",
        message: `Issue FIX-${newIssue.issue_number} has been logged in ${activeProject?.name || "project"}.`,
      });

      setQuickPrefillIssueData(null);
      setIsCreateIssueOpen(false);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to create issue",
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#0d0f17] border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#121520]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              {source === IssueSource.AI_ASSISTANT ? (
                <Sparkles className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Create New Issue</h2>
              <p className="text-xs text-zinc-400">
                Target Project:{" "}
                <span className="text-indigo-300 font-mono font-medium">
                  {activeProject?.name || "Fixora Core"} ({activeProject?.key || "FIX"})
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setQuickPrefillIssueData(null);
              setIsCreateIssueOpen(false);
            }}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {source === IssueSource.AI_ASSISTANT && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Prefilled from <strong>AI Bug Assistant</strong> analysis. Review the fields below and submit to save.
              </span>
            </div>
          )}

          {source === IssueSource.REPO_SCAN && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Prefilled from <strong>Security Repository Scanner</strong>.
              </span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Unhandled NullPointerException in OAuth session token handler"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Metadata Row: Severity, Priority, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value={IssueSeverity.CRITICAL}>Critical (Blocker)</option>
                <option value={IssueSeverity.HIGH}>High</option>
                <option value={IssueSeverity.MEDIUM}>Medium</option>
                <option value={IssueSeverity.LOW}>Low</option>
                <option value={IssueSeverity.TRIVIAL}>Trivial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value={IssuePriority.URGENT}>Urgent (P0)</option>
                <option value={IssuePriority.HIGH}>High (P1)</option>
                <option value={IssuePriority.MEDIUM}>Medium (P2)</option>
                <option value={IssuePriority.LOW}>Low (P3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value={IssueStatus.OPEN}>Open</option>
                <option value={IssueStatus.IN_PROGRESS}>In Progress</option>
                <option value={IssueStatus.IN_REVIEW}>In Review</option>
                <option value={IssueStatus.RESOLVED}>Resolved</option>
                <option value={IssueStatus.CLOSED}>Closed</option>
              </select>
            </div>
          </div>

          {/* Component and Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Component / Module
              </label>
              <input
                type="text"
                placeholder="e.g. Auth, Search, Celery Worker, Frontend"
                value={component}
                onChange={(e) => setComponent(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.user_id}>
                    {m.user?.name || m.user?.email || m.user_id} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Description & Context
            </label>
            <textarea
              rows={4}
              placeholder="Describe the bug behavior, stack trace, or failure scenario..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          {/* Reproduction Steps */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Reproduction Steps (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="1. Step one&#10;2. Step two&#10;3. Observed vs expected"
              value={reproductionSteps}
              onChange={(e) => setReproductionSteps(e.target.value)}
              className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          {/* Suggested Fix */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Suggested Fix / Code Remediation (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Code patch, parameter binding, or architectural correction..."
              value={suggestedFix}
              onChange={(e) => setSuggestedFix(e.target.value)}
              className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setQuickPrefillIssueData(null);
                setIsCreateIssueOpen(false);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Creating...</span>
              ) : (
                <span>Create Issue</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
