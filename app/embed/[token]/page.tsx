"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function EmbedPage({ params }: { params: { token: string } }) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const mode = searchParams.get("mode") || "view"; // view or interactive

  const [project, setProject] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    (async () => {
      const [projRes, filesRes] = await Promise.all([
        supabase
          .from("workspace_projects")
          .select("id, name, prompt")
          .eq("id", projectId)
          .maybeSingle(),
        supabase
          .from("workspace_files")
          .select("path, content, language")
          .eq("project_id", projectId)
          .limit(5),
      ]);

      if (projRes.data) setProject(projRes.data);
      if (filesRes.data) setFiles(filesRes.data);
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-red-400">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">{project.name}</h1>
          <p className="text-sm text-gray-400">{project.prompt}</p>
        </div>

        {/* Files Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {files.map((file, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {/* File Header */}
              <div className="bg-black/40 border-b border-white/10 px-4 py-2">
                <p className="text-xs font-mono text-cyan-400">{file.path}</p>
              </div>

              {/* File Content */}
              <div className="p-4 overflow-auto max-h-64">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
                  {file.content.slice(0, 500)}
                  {file.content.length > 500 && "..."}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {mode === "view" && (
          <div className="mt-8 text-center">
            <a
              href={`/workspace/new?fork=${projectId}`}
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-700 hover:to-blue-700 transition"
            >
              Fork & Edit This Project
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
