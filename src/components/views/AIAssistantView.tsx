import React, { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { useNotification } from "../../context/NotificationContext";
import { api } from "../../lib/api";
import { AIBugAnalysisResponse, IssueSeverity, IssuePriority, IssueSource } from "../../types";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  Send,
  RefreshCw,
  Plus,
} from "lucide-react";
import { SeverityBadge, PriorityBadge } from "../common/Badges";

export const AIAssistantView: React.FC = () => {
  const {
    activeProject,
    createIssue,
    refreshIssues,
    setSelectedIssueId,
    setActiveView,
    setIsCreateIssueOpen,
    setQuickPrefillIssueData,
  } = useProject();
  const { showToast } = useNotification();

  const [bugDescription, setBugDescription] = useState(
    `Traceback (most recent call last):
  File "fastapi/routing.py", line 227, in app
    raw_response = await run_endpoint_function(dependant=dependant, values=values, is_coroutine=is_coroutine)
  File "app/api/auth.py", line 84, in refresh_token
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
jwt.exceptions.ExpiredSignatureError: Signature has expired`
  );
  const [component, setComponent] = useState("Authentication Service");
  const [reproductionSteps, setReproductionSteps] = useState(
    "1. Initiate session with expired refresh token cookie.\n2. Submit request to /api/v1/auth/refresh.\n3. Server returns unhandled 500 instead of 401 Unauthorized."
  );
  const [environment, setEnvironment] = useState("FastAPI 0.110, Python 3.11, Docker Alpine");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIBugAnalysisResponse | null>(null);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [isSavingIssue, setIsSavingIssue] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugDescription.trim()) {
      showToast({ type: "error", title: "Description is required" });
      return;
    }

    try {
      setIsAnalyzing(true);
      const res = await api.ai.analyzeBug({
        project_id: activeProject?.id || "p-fixora-core",
        bug_description: bugDescription.trim(),
        component: component.trim() || undefined,
        reproduction_steps: reproductionSteps.trim() || undefined,
        environment: environment.trim() || undefined,
      });
      setAnalysisResult(res);
      showToast({
        type: "success",
        title: "Analysis Complete",
        message: `Bug triage synthesized with ${res.confidence} confidence.`,
      });
    } catch (err: any) {
      showToast({ type: "error", title: "AI Analysis Failed", message: err.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAsIssue = async () => {
    if (!analysisResult) return;
    try {
      setIsSavingIssue(true);
      const newIssue = await createIssue({
        title: analysisResult.title,
        description: `### AI Incident Summary\n${bugDescription}\n\n### Root Cause Analysis\n${analysisResult.root_cause}\n\n### Environment\n${environment}`,
        severity: analysisResult.severity,
        priority: analysisResult.priority,
        component: analysisResult.component,
        reproduction_steps: analysisResult.reproduction_steps,
        suggested_fix: analysisResult.suggested_fix,
        source: IssueSource.AI_ASSISTANT,
        labels: analysisResult.labels || ["ai-analyzed"],
      });

      showToast({
        type: "success",
        title: "Issue Created",
        message: `Saved as FIX-${newIssue.issue_number}`,
      });

      setSelectedIssueId(newIssue.id);
      setActiveView("issue-detail");
    } catch (err: any) {
      showToast({ type: "error", title: "Failed to save issue", message: err.message });
    } finally {
      setIsSavingIssue(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
    showToast({ type: "info", title: "Patch copied to clipboard" });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                AI Bug Assistant
              </h1>
              <p className="text-xs text-zinc-400">
                Automated bug diagnosis, severity triage, root-cause deduction, and code patch generator.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
            Endpoint: <code className="text-indigo-400">POST /api/v1/ai/analyze-bug</code>
          </span>
        </div>
      </div>

      {/* Main 2-Column Interface: Input Form on Left, AI Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (6 Cols) */}
        <div className="lg:col-span-6">
          <form
            onSubmit={handleAnalyze}
            className="p-6 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                Bug Input & Telemetry
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">
                Project: {activeProject?.key || "FIX"}
              </span>
            </div>

            {/* Error Log / Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Error Logs, Stack Trace or Bug Symptoms <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={7}
                required
                placeholder="Paste tracebacks, console errors, or bug descriptions..."
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#121520] border border-zinc-700/80 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Component & Environment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Subsystem / Component
                </label>
                <input
                  type="text"
                  placeholder="e.g. Auth, DB, Payments"
                  value={component}
                  onChange={(e) => setComponent(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121520] border border-zinc-700/80 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Runtime Environment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python 3.11, PostgreSQL"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121520] border border-zinc-700/80 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Reproduction Steps */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Observed Steps / Context (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="1. Step one&#10;2. Step two"
                value={reproductionSteps}
                onChange={(e) => setReproductionSteps(e.target.value)}
                className="w-full px-3 py-2 bg-[#121520] border border-zinc-700/80 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isAnalyzing || !bugDescription.trim()}
                className="w-full py-2.5 px-4 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Stack & Generating Patch...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Run AI Bug Diagnosis</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: AI Output Panel (6 Cols) */}
        <div className="lg:col-span-6">
          {analysisResult ? (
            <div className="p-6 rounded-xl bg-[#0d0f17] border border-indigo-500/40 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      Confidence: {analysisResult.confidence}
                    </span>
                    <SeverityBadge severity={analysisResult.severity} />
                    <PriorityBadge priority={analysisResult.priority} />
                  </div>
                  <h2 className="text-sm font-bold text-zinc-100">
                    {analysisResult.title}
                  </h2>
                </div>

                <button
                  onClick={handleSaveAsIssue}
                  disabled={isSavingIssue}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSavingIssue ? "Saving..." : "Log to Backlog"}</span>
                </button>
              </div>

              {/* Root Cause */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-400 mb-1.5">
                  Root Cause Deduction
                </h3>
                <div className="bg-[#121520] p-3.5 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300 leading-relaxed">
                  {analysisResult.root_cause}
                </div>
              </div>

              {/* Suggested Fix */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Recommended Code Patch</span>
                  </h3>
                  <button
                    onClick={() => handleCopyCode(analysisResult.suggested_fix)}
                    className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700"
                  >
                    {hasCopiedCode ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{hasCopiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="bg-[#090b11] p-4 rounded-lg border border-emerald-900/40 text-xs font-mono text-emerald-200 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{analysisResult.suggested_fix}</pre>
                </div>
              </div>

              {/* Suggested Labels */}
              {analysisResult.labels && analysisResult.labels.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Categorization Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.labels.map((l) => (
                      <span
                        key={l}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700"
                      >
                        #{l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center p-8 rounded-xl bg-[#0d0f17] border border-dashed border-zinc-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-300">Awaiting Bug Input</h3>
                <p className="text-xs text-zinc-500 max-w-sm mt-1">
                  Fill in the error details on the left and click &ldquo;Run AI Bug Diagnosis&rdquo; to analyze the stack trace.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
