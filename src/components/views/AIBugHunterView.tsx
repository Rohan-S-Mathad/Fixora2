import React, { useState, useEffect } from "react";
import { useProject } from "../../context/ProjectContext";
import { useNotification } from "../../context/NotificationContext";
import { api } from "../../lib/api";
import {
  Scan,
  ScanFinding,
  ScanFindingStatus,
  ScanStatus,
  IssueSeverity,
  Issue,
} from "../../types";
import {
  ShieldAlert,
  Play,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Code2,
  FileCode,
  ArrowRight,
  GitBranch,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  Eye,
  RefreshCw,
} from "lucide-react";
import { SeverityBadge } from "../common/Badges";
import { formatDate } from "../../lib/utils";

export const AIBugHunterView: React.FC = () => {
  const { activeProject, setActiveView, setSelectedIssueId, refreshIssues } = useProject();
  const { showToast } = useNotification();

  const [repoUrl, setRepoUrl] = useState(
    activeProject?.github_repo_url || "https://github.com/alexriver/fixora-core"
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [currentScan, setCurrentScan] = useState<Scan | null>(null);
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<ScanFinding | null>(null);

  // Initial load of findings from real backend
  useEffect(() => {
    const loadDefaultFindings = async () => {
      try {
        const list = await api.scans.getFindings();
        setFindings(list);
        if (list.length > 0) {
          setSelectedFinding(list[0]);
        }
      } catch (err) {
        console.error("Failed to load scan findings", err);
      }
    };
    loadDefaultFindings();
  }, []);

  const handleStartScan = async () => {
    if (!activeProject) {
      showToast({ type: "error", title: "Select a project first" });
      return;
    }

    setIsScanning(true);
    setScanProgress(5);
    setScanLogs([`[INIT] Initializing Fixora Security Scanner v1.4.0...`]);

    try {
      // 1. Trigger scan creation
      const scan = await api.scans.startRepositoryScan(activeProject.id, repoUrl);
      setCurrentScan(scan);

      // Simulation log runner
      const logSteps = [
        { progress: 20, msg: `[CLONE] Fetching Git tree for ${repoUrl}...` },
        { progress: 35, msg: `[AST] Generating Abstract Syntax Tree across 54 Python/TypeScript files...` },
        { progress: 50, msg: `[BANDIT] Running Python AST security inspection rules...` },
        { progress: 65, msg: `[SEMGREP] Scanning for OWASP Top 10 vulnerabilities & insecure JWT handling...` },
        { progress: 80, msg: `[GITLEAKS] Analyzing high-entropy secrets and exposed credentials...` },
        { progress: 95, msg: `[AI_TRIAGE] Passing flagged AST nodes to Fixora Gemini AI for root-cause synthesis...` },
      ];

      for (let i = 0; i < logSteps.length; i++) {
        await new Promise((r) => setTimeout(r, 650));
        setScanProgress(logSteps[i].progress);
        setScanLogs((prev) => [...prev, logSteps[i].msg]);
      }

      // Complete scan
      const completed = await api.scans.completeSimulatedScan(scan.id);
      setCurrentScan(completed);
      const newFindings = await api.scans.getFindings(completed.id);
      setFindings(newFindings);
      if (newFindings.length > 0) {
        setSelectedFinding(newFindings[0]);
      }

      setScanProgress(100);
      setScanLogs((prev) => [
        ...prev,
        `[SUCCESS] Scan completed. ${newFindings.length} vulnerabilities detected. Security Score: B+`,
      ]);

      showToast({
        type: "success",
        title: "Scan Completed",
        message: `Found ${newFindings.length} potential security findings.`,
      });
    } catch (err: any) {
      showToast({ type: "error", title: "Scan Failed", message: err.message });
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreateIssueFromFinding = async (finding: ScanFinding) => {
    try {
      const newIssue = await api.scans.createIssueFromFinding(finding.id);
      await refreshIssues();

      // Update local findings state
      setFindings((prev) =>
        prev.map((f) =>
          f.id === finding.id
            ? { ...f, status: ScanFindingStatus.CREATED_ISSUE, created_issue_id: newIssue.id }
            : f
        )
      );
      if (selectedFinding?.id === finding.id) {
        setSelectedFinding((prev) =>
          prev
            ? { ...prev, status: ScanFindingStatus.CREATED_ISSUE, created_issue_id: newIssue.id }
            : null
        );
      }

      showToast({
        type: "success",
        title: "Issue Created",
        message: `Logged as FIX-${newIssue.issue_number}`,
      });
    } catch (err: any) {
      showToast({ type: "error", title: "Failed to create issue", message: err.message });
    }
  };

  const handleDismissFinding = async (finding: ScanFinding) => {
    try {
      await api.scans.ignoreFinding(finding.id);
      setFindings((prev) =>
        prev.map((f) =>
          f.id === finding.id ? { ...f, status: ScanFindingStatus.DISMISSED } : f
        )
      );
      if (selectedFinding?.id === finding.id) {
        setSelectedFinding((prev) =>
          prev ? { ...prev, status: ScanFindingStatus.DISMISSED } : null
        );
      }
      showToast({ type: "info", title: "Finding Dismissed" });
    } catch (err: any) {
      showToast({ type: "error", title: "Action failed", message: err.message });
    }
  };

  const criticalCount = findings.filter((f) => f.severity === IssueSeverity.CRITICAL).length;
  const highCount = findings.filter((f) => f.severity === IssueSeverity.HIGH).length;
  const mediumCount = findings.filter((f) => f.severity === IssueSeverity.MEDIUM).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Title & Scanner Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Security Scanner & Code Analysis
              </h1>
              <p className="text-xs text-zinc-400">
                Automated Static Analysis (SAST), Secret Detection, and Automated Remediation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
            Engines: Bandit • Semgrep • Gitleaks
          </span>
        </div>
      </div>

      {/* Repository Target Input & Scanner Trigger Bar */}
      <div className="p-5 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <GitBranch className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="https://github.com/org/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isScanning}
              className="w-full pl-9 pr-3 py-2 bg-[#121520] border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <button
            onClick={handleStartScan}
            disabled={isScanning || !repoUrl.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all shrink-0"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Repository...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run SAST Scan</span>
              </>
            )}
          </button>
        </div>

        {/* Live Progress Bar */}
        {isScanning && (
          <div className="space-y-1.5 pt-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Pipeline execution in progress...</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Live Execution Logs Terminal */}
        {(isScanning || scanLogs.length > 0) && (
          <div className="bg-[#08090e] border border-zinc-800 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-[11px] text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 pb-1 border-b border-zinc-900 text-[10px] uppercase">
              <Terminal className="w-3 h-3 text-zinc-400" />
              <span>Pipeline Stream Output</span>
            </div>
            {scanLogs.map((log, idx) => (
              <div
                key={idx}
                className={`leading-relaxed ${
                  log.includes("[SUCCESS]")
                    ? "text-emerald-400 font-medium"
                    : log.includes("[AI_TRIAGE]")
                    ? "text-indigo-300"
                    : log.includes("[SEMGREP]") || log.includes("[BANDIT]")
                    ? "text-zinc-300"
                    : "text-zinc-400"
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Health Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0e1017] border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-zinc-500">Security Score</span>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">B+ (84/100)</p>
          </div>
          <ShieldCheck className="w-6 h-6 text-zinc-600" />
        </div>

        <div className="p-4 rounded-xl bg-[#0e1017] border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-rose-400">Critical Findings</span>
            <p className="text-2xl font-bold font-mono text-rose-400 mt-1">{criticalCount}</p>
          </div>
          <Flame className="w-6 h-6 text-rose-500/40" />
        </div>

        <div className="p-4 rounded-xl bg-[#0e1017] border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-amber-400">High Severity</span>
            <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{highCount}</p>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-500/40" />
        </div>

        <div className="p-4 rounded-xl bg-[#0e1017] border border-zinc-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-zinc-400">Total Findings</span>
            <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">{findings.length}</p>
          </div>
          <FileCode className="w-6 h-6 text-zinc-600" />
        </div>
      </div>

      {/* Main 2-Column Interface: Findings List on Left, Interactive Inspection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Findings List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Vulnerability Findings ({findings.length})
            </h2>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {findings.map((f) => {
              const isSelected = selectedFinding?.id === f.id;
              const isResolved = f.status === ScanFindingStatus.CREATED_ISSUE;
              const isDismissed = f.status === ScanFindingStatus.DISMISSED;

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFinding(f)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#141726] border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-lg"
                      : "bg-[#0d0f17] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <SeverityBadge severity={f.severity} />
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {f.tool}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-zinc-200 leading-snug">
                    {f.title}
                  </h3>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500">
                    <span className="truncate max-w-[200px] text-zinc-400">
                      {f.file_path}:{f.line_number}
                    </span>

                    {isResolved ? (
                      <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                        <Check className="w-3 h-3" /> Issue Logged
                      </span>
                    ) : isDismissed ? (
                      <span className="text-zinc-500 text-[10px]">Dismissed</span>
                    ) : (
                      <span className="text-rose-400 text-[10px] font-semibold">Triage Required</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Finding Detail / Code Inspection Panel (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedFinding ? (
            <div className="p-6 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-5">
              {/* Finding Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <SeverityBadge severity={selectedFinding.severity} />
                    <span className="text-xs font-mono font-medium text-zinc-300 uppercase bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                      {selectedFinding.tool}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-zinc-100">
                    {selectedFinding.title}
                  </h2>
                  <p className="text-xs font-mono text-zinc-400 mt-1">
                    File: <span className="text-indigo-300">{selectedFinding.file_path}</span> (Line {selectedFinding.line_number})
                  </p>
                </div>

                {/* 1-Click Issue Conversion Button */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {selectedFinding.status === ScanFindingStatus.CREATED_ISSUE ? (
                    <button
                      onClick={() => {
                        if (selectedFinding.created_issue_id) {
                          setSelectedIssueId(selectedFinding.created_issue_id);
                          setActiveView("issue-detail");
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>View Logged Issue →</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCreateIssueFromFinding(selectedFinding)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Convert to Issue</span>
                    </button>
                  )}

                  {selectedFinding.status !== ScanFindingStatus.DISMISSED && selectedFinding.status !== ScanFindingStatus.CREATED_ISSUE && (
                    <button
                      onClick={() => handleDismissFinding(selectedFinding)}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono"
                    >
                      Dismiss Finding
                    </button>
                  )}
                </div>
              </div>

              {/* Code Snippet */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Vulnerable Code Snippet</span>
                </h3>
                <div className="bg-[#090b11] p-4 rounded-lg border border-zinc-800 font-mono text-xs text-rose-300/90 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{selectedFinding.code_snippet}</pre>
                </div>
              </div>

              {/* AI Deep Analysis */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Automated Remediation & Analysis</span>
                </h3>
                <div className="bg-[#121520] p-4 rounded-lg border border-zinc-800 text-xs text-zinc-300 font-mono leading-relaxed">
                  {selectedFinding.ai_analysis}
                </div>
              </div>

              {/* AI Suggested Fix */}
              {selectedFinding.ai_suggested_fix && (
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Recommended Patch</span>
                  </h3>
                  <div className="bg-[#090b11] p-4 rounded-lg border border-emerald-900/40 font-mono text-xs text-emerald-200 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{selectedFinding.ai_suggested_fix}</pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl text-xs font-mono">
              Select a vulnerability finding to inspect code diff and AI remediation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
