import React, { useState } from "react";
import { useProject } from "../../context/ProjectContext";
import { useNotification } from "../../context/NotificationContext";
import { X, FolderGit2, GitBranch } from "lucide-react";

export const CreateProjectModal: React.FC = () => {
  const { isCreateProjectOpen, setIsCreateProjectOpen, createProject } = useProject();
  const { showToast } = useNotification();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateProjectOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length <= 4) {
      // Auto-generate key from first letters
      const clean = val.replace(/[^a-zA-Z0-9\s]/g, "");
      const words = clean.split(/\s+/).filter(Boolean);
      let generated = "";
      if (words.length >= 2) {
        generated = words.map((w) => w[0]).join("").toUpperCase().slice(0, 4);
      } else if (words.length === 1) {
        generated = words[0].slice(0, 3).toUpperCase();
      }
      if (generated) setKey(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ type: "error", title: "Validation Error", message: "Project name is required" });
      return;
    }
    if (!key.trim()) {
      showToast({ type: "error", title: "Validation Error", message: "Project key is required (e.g. FIX)" });
      return;
    }

    try {
      setIsSubmitting(true);
      const newProj = await createProject({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim() || undefined,
        github_repo_url: githubRepoUrl.trim() || undefined,
      });

      showToast({
        type: "success",
        title: "Project Created",
        message: `Project ${newProj.name} (${newProj.key}) has been initialized.`,
      });

      setName("");
      setKey("");
      setDescription("");
      setGithubRepoUrl("");
      setIsCreateProjectOpen(false);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to create project",
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#0d0f17] border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#121520]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Create Project</h2>
              <p className="text-xs text-zinc-400">Initialize a new developer workspace</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateProjectOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fixora Core Engine"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Project Key <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="e.g. FIX"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 font-mono focus:outline-none focus:border-indigo-500 uppercase"
            />
            <p className="text-[11px] text-zinc-500 mt-1 font-mono">
              Used as prefix for all issue identifiers (e.g. {key || "FIX"}-101)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              GitHub Repository URL
            </label>
            <div className="relative">
              <GitBranch className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="url"
                placeholder="https://github.com/org/repo"
                value={githubRepoUrl}
                onChange={(e) => setGithubRepoUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe the architecture, technologies, or services in this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#141724] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateProjectOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
