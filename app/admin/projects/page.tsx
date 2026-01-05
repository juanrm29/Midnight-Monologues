"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface Project {
  id: number;
  slug: string;
  title: string;
  description: string;
  tech: string[];
  year: string;
  status: "Active" | "Maintained" | "Archived";
  featured: boolean;
  role?: string;
  links?: { live?: string; github?: string };
  philosophy?: { text: string; author: string };
}

// ═══════════════════════════════════════════════════════════════════
// PROJECTS MANAGER - CRUD for portfolio projects
// "What stands in the way becomes the way." - Marcus Aurelius
// ═══════════════════════════════════════════════════════════════════

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const EMPTY_PROJECT: Project = {
  id: 0,
  slug: "",
  title: "",
  description: "",
  tech: [],
  year: new Date().getFullYear().toString(),
  status: "Active",
  featured: false
};

const STATUS_OPTIONS: Project["status"][] = ["Active", "Maintained", "Archived"];

export default function ProjectsManager() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadProjects();
  }, []);

  useEffect(() => {
    if (mounted) {
      const editId = searchParams.get("edit");
      const isNew = searchParams.get("new");
      
      if (isNew) {
        setSelectedProject({ ...EMPTY_PROJECT });
        setIsEditing(true);
      } else if (editId) {
        const project = projects.find(p => p.id === parseInt(editId));
        if (project) {
          setSelectedProject(project);
          setIsEditing(true);
        }
      }
    }
  }, [mounted, searchParams, projects]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProject) return;
    setSaving(true);
    
    const projectToSave = {
      ...selectedProject,
      slug: selectedProject.slug || generateSlug(selectedProject.title)
    };

    try {
      const isNew = projectToSave.id === 0;
      const url = isNew ? "/api/projects" : `/api/projects/${projectToSave.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectToSave),
      });
      
      if (res.ok) {
        await loadProjects();
        setIsEditing(false);
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadProjects();
        setShowDeleteConfirm(null);
        if (selectedProject?.id === id) {
          setSelectedProject(null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const handleAddTech = () => {
    if (!selectedProject || !techInput.trim()) return;
    if (!selectedProject.tech.includes(techInput.trim())) {
      setSelectedProject({
        ...selectedProject,
        tech: [...selectedProject.tech, techInput.trim()]
      });
    }
    setTechInput("");
  };

  const handleRemoveTech = (tech: string) => {
    if (!selectedProject) return;
    setSelectedProject({
      ...selectedProject,
      tech: selectedProject.tech.filter(t => t !== tech)
    });
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-2xl"
          style={{ color: "var(--accent-gold)" }}
        >
          ◐
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {isEditing && selectedProject ? (
          /* Edit Mode */
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedProject(null);
                }}
                className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                ← Back to projects
              </button>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedProject(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)"
                  }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ 
                    backgroundColor: "var(--accent-gold)",
                    color: "var(--bg-primary)"
                  }}
                >
                  Save Project
                </motion.button>
              </div>
            </div>

            {/* Editor Form */}
            <div 
              className="p-6 rounded-xl space-y-6"
              style={{ 
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-primary)"
              }}
            >
              {/* Title */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Project Title
                </label>
                <input
                  type="text"
                  value={selectedProject.title}
                  onChange={(e) => setSelectedProject({ 
                    ...selectedProject, 
                    title: e.target.value,
                    slug: generateSlug(e.target.value)
                  })}
                  placeholder="Project name..."
                  className="w-full px-4 py-3 rounded-lg text-lg font-light focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              {/* Slug */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Slug (URL path)
                </label>
                <input
                  type="text"
                  value={selectedProject.slug}
                  onChange={(e) => setSelectedProject({ ...selectedProject, slug: e.target.value })}
                  placeholder="project-slug"
                  className="w-full px-4 py-2 rounded-lg text-sm font-mono focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)",
                    color: "var(--text-secondary)"
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Description
                </label>
                <textarea
                  value={selectedProject.description}
                  onChange={(e) => setSelectedProject({ ...selectedProject, description: e.target.value })}
                  placeholder="Brief description of the project..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)",
                    color: "var(--text-primary)"
                  }}
                />
              </div>

              {/* Meta Row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Year
                  </label>
                  <input
                    type="text"
                    value={selectedProject.year}
                    onChange={(e) => setSelectedProject({ ...selectedProject, year: e.target.value })}
                    placeholder="2025"
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Status
                  </label>
                  <select
                    value={selectedProject.status}
                    onChange={(e) => setSelectedProject({ ...selectedProject, status: e.target.value as Project["status"] })}
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Featured
                  </label>
                  <button
                    onClick={() => setSelectedProject({ ...selectedProject, featured: !selectedProject.featured })}
                    className="w-full px-4 py-2 rounded-lg text-sm transition-all duration-200"
                    style={{ 
                      backgroundColor: selectedProject.featured ? "var(--accent-gold-dim)" : "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: selectedProject.featured ? "var(--accent-gold)" : "var(--text-muted)"
                    }}
                  >
                    {selectedProject.featured ? "★ Featured" : "☆ Not Featured"}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Your Role
                </label>
                <input
                  type="text"
                  value={selectedProject.role || ""}
                  onChange={(e) => setSelectedProject({ ...selectedProject, role: e.target.value })}
                  placeholder="Creator & Developer"
                  className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-secondary)",
                    color: "var(--text-secondary)"
                  }}
                />
              </div>

              {/* Tech Stack */}
              <div>
                <label 
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Tech Stack
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedProject.tech.map(tech => (
                    <span 
                      key={tech}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                      style={{ 
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-secondary)",
                        color: "var(--text-secondary)"
                      }}
                    >
                      {tech}
                      <button 
                        onClick={() => handleRemoveTech(tech)}
                        className="ml-1 hover:opacity-70"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTech())}
                    placeholder="Add technology..."
                    className="flex-1 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  />
                  <button
                    onClick={handleAddTech}
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Live URL
                  </label>
                  <input
                    type="url"
                    value={selectedProject.links?.live || ""}
                    onChange={(e) => setSelectedProject({ 
                      ...selectedProject, 
                      links: { ...selectedProject.links, live: e.target.value }
                    })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  />
                </div>
                <div>
                  <label 
                    className="block text-xs uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={selectedProject.links?.github || ""}
                    onChange={(e) => setSelectedProject({ 
                      ...selectedProject, 
                      links: { ...selectedProject.links, github: e.target.value }
                    })}
                    placeholder="https://github.com/..."
                    className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-secondary)",
                      color: "var(--text-secondary)"
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* List Mode */
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <p 
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedProject({ ...EMPTY_PROJECT });
                  setIsEditing(true);
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ 
                  backgroundColor: "var(--accent-gold)",
                  color: "var(--bg-primary)"
                }}
              >
                + New Project
              </motion.button>
            </div>

            {/* Projects List */}
            <div className="space-y-3">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                  style={{ 
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-primary)"
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 
                          className="text-lg font-light"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {project.title}
                        </h3>
                        {project.featured && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ 
                              backgroundColor: "var(--accent-gold-dim)",
                              color: "var(--accent-gold)"
                            }}
                          >
                            featured
                          </span>
                        )}
                        <span 
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: project.status === "Active" 
                              ? "rgba(34, 197, 94, 0.2)" 
                              : project.status === "Maintained"
                              ? "rgba(59, 130, 246, 0.2)"
                              : "var(--bg-primary)",
                            color: project.status === "Active"
                              ? "#22c55e"
                              : project.status === "Maintained"
                              ? "#3b82f6"
                              : "var(--text-muted)"
                          }}
                        >
                          {project.status}
                        </span>
                      </div>
                      <p 
                        className="text-sm mb-2"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {project.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>{project.year}</span>
                        <span>·</span>
                        <span>{project.tech.join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setIsEditing(true);
                        }}
                        className="px-3 py-1 rounded-lg text-xs transition-opacity hover:opacity-70"
                        style={{ 
                          backgroundColor: "var(--bg-primary)",
                          border: "1px solid var(--border-secondary)",
                          color: "var(--text-secondary)"
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(project.id)}
                        className="px-3 py-1 rounded-lg text-xs transition-opacity hover:opacity-70"
                        style={{ 
                          backgroundColor: "var(--bg-primary)",
                          border: "1px solid var(--border-secondary)",
                          color: "#ef4444"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  <AnimatePresence>
                    {showDeleteConfirm === project.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 flex items-center justify-between"
                        style={{ borderTop: "1px solid var(--border-secondary)" }}
                      >
                        <p className="text-sm" style={{ color: "#ef4444" }}>
                          Are you sure you want to delete this project?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="px-3 py-1 rounded-lg text-xs"
                            style={{ 
                              backgroundColor: "var(--bg-primary)",
                              color: "var(--text-muted)"
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="px-3 py-1 rounded-lg text-xs"
                            style={{ 
                              backgroundColor: "#ef4444",
                              color: "white"
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {projects.length === 0 && (
              <div 
                className="text-center py-16"
                style={{ color: "var(--text-muted)" }}
              >
                <p className="text-4xl mb-4">⬡</p>
                <p className="text-sm">No projects yet</p>
                <p className="text-xs mt-1">Create your first project to get started</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
