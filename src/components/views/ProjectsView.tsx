import React, { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import {
  FolderGit2,
  Plus,
  GitBranch,
  Users,
  CheckSquare,
  ExternalLink,
  Calendar,
  Search,
  Check,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { formatDate } from "../../lib/utils";

export const ProjectsView: React.FC = () => {
  const {
    projects,
    activeProject,
    setActiveProject,
    setIsCreateProjectOpen,
    setActiveView,
    members,
  } = useProject();
  const { showToast } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Projects</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage developer codebases, repositories, and issue tracking namespaces.
          </p>
        </div>

        <button
          onClick={() => setIsCreateProjectOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search projects by name, key, or repository..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0e1017] border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const isActive = activeProject?.id === project.id;
          return (
            <div
              key={project.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all group ${
                isActive
                  ? "bg-[#0e111c] border-indigo-500/50 ring-1 ring-indigo-500/30"
                  : "bg-[#0d0f17] border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-900/30"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors truncate">
                        {project.name}
                      </h3>
                      <span className="text-[11px] font-mono font-medium text-indigo-400">
                        {project.key}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                  {project.description || "No project description provided."}
                </p>

                {project.github_repo_url && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded border border-zinc-800 truncate">
                    <GitBranch className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="truncate">{project.github_repo_url}</span>
                  </div>
                )}
              </div>

              {/* Stats Footer */}
              <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-mono text-zinc-300">{project.issues_count || 0}</span>
                    <span>issues</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-mono text-zinc-300">{project.members_count || 1}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveProject(project);
                    setActiveView("issues");
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
