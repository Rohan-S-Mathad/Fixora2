import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import { useNotification } from "../../context/NotificationContext";
import {
  getApiBaseUrl,
  setApiBaseUrl,
  testLiveApiConnection,
  resetDatabaseToDefaults,
} from "../../lib/api";
import {
  Sliders,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { refreshProjects, refreshIssues } = useProject();
  const { showToast } = useNotification();

  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveApiUrl = () => {
    setApiBaseUrl(apiUrl);
    showToast({
      type: "success",
      title: "API URL Updated",
      message: `API base set to ${apiUrl}`,
    });
  };

  const handleTestConnection = async () => {
    setIsTestingApi(true);
    setTestResult(null);
    try {
      const isLive = await testLiveApiConnection();
      if (isLive) {
        setTestResult({
          success: true,
          message: "Live FastAPI Backend connected successfully (status 200/401 verified).",
        });
        showToast({ type: "success", title: "Backend Connected" });
      } else {
        setTestResult({
          success: false,
          message: "FastAPI server unreachable. Local reactive storage engine actively serving requests.",
        });
        showToast({ type: "info", title: "Using Reactive Local Engine" });
      }
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleResetData = async () => {
    if (confirm("Reset all project, issue, and scan data to standard initial mock data?")) {
      resetDatabaseToDefaults();
      await refreshProjects();
      await refreshIssues();
      showToast({ type: "success", title: "Database Re-seeded Successfully" });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="pb-4 border-b border-zinc-800/80">
        <h1 className="text-xl font-bold tracking-tight text-white">Platform Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Backend API routing, environment credentials, and telemetry database configuration.
        </p>
      </div>

      {/* Backend API Configuration */}
      <div className="p-6 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
          <Server className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-100">FastAPI Backend Endpoint</h2>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Configure the API proxy destination for Fixora services. If the live backend container is unavailable, the built-in storage engine ensures all operations continue seamlessly.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="/api/v1 or http://localhost:8000/api/v1"
            className="w-full px-3 py-2 bg-[#121520] border border-zinc-700/80 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleSaveApiUrl}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTestingApi}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              {isTestingApi && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2 ${
              testResult.success
                ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                : "bg-indigo-950/30 border-indigo-800/60 text-indigo-300"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Infrastructure Telemetry */}
      <div className="p-6 rounded-xl bg-[#0d0f17] border border-zinc-800/80 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
          <Cpu className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-zinc-100">Service Mesh & Pipeline Status</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-[#121520] rounded-lg border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Vector Search</span>
            <p className="text-xs font-semibold text-zinc-200">pgvector 0.7.0</p>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Index
            </span>
          </div>

          <div className="p-3 bg-[#121520] rounded-lg border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">Async Task Engine</span>
            <p className="text-xs font-semibold text-zinc-200">Celery + Redis</p>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Worker Ready
            </span>
          </div>

          <div className="p-3 bg-[#121520] rounded-lg border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500">AI Intelligence</span>
            <p className="text-xs font-semibold text-zinc-200">Fixora Gemini 2.5</p>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online
            </span>
          </div>
        </div>
      </div>

      {/* Database Re-seed */}
      <div className="p-6 rounded-xl bg-[#0d0f17] border border-zinc-800/80 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset Demo Database</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Restore standard sample issues, projects, members, and scan telemetry.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-800/60 text-zinc-300 border border-zinc-700 transition-colors shrink-0"
        >
          Reset Data
        </button>
      </div>
    </div>
  );
};
