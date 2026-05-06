"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function SharePage({ params }: { params: { token: string } }) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setError("Missing project ID");
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error: err } = await supabase
        .from("workspace_projects")
        .select("id, name, prompt, status, kind, created_at")
        .eq("id", projectId)
        .maybeSingle();

      if (err || !data) {
        setError("Project not found or expired");
      } else {
        setProject(data);
      }
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          <p className="mt-4 text-gray-400">Loading shared project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <Card className="p-8 max-w-md bg-red-950/50 border-red-700/50">
          <p className="text-red-300">{error}</p>
          <Link href="/">
            <Button className="mt-4 w-full">Back to Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text cursor-pointer hover:opacity-80">
              NJIRLAH
            </h1>
          </Link>
          <Link href={`/workspace/new?fork=${project.id}`}>
            <Button>Fork Project</Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="bg-white/5 border-white/10 p-8">
          <h2 className="text-4xl font-bold text-white mb-2">{project.name}</h2>
          <p className="text-gray-400 mb-6">
            {project.kind === "fullstack" ? "Full-stack Project" : "Project"} •{" "}
            {project.status === "draft" ? "Draft" : "Completed"}
          </p>

          {/* Prompt */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
              Prompt
            </h3>
            <div className="bg-black/40 rounded-lg p-4 border border-white/10 text-gray-200 font-mono text-sm">
              {project.prompt}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-xs text-gray-500 mb-1">Created</p>
              <p className="text-white font-semibold">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <p className="text-white font-semibold capitalize">{project.status}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href={`/workspace/new?fork=${project.id}`} className="flex-1">
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                Fork & Edit
              </Button>
            </Link>
            <Link href="/workspace/new" className="flex-1">
              <Button variant="outline" className="w-full">
                New Project
              </Button>
            </Link>
          </div>
        </Card>

        {/* Share Info */}
        <Card className="bg-white/5 border-white/10 p-6 mt-8">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
            Share This Project
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">View Link</p>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/share/${params.token}?projectId=${project.id}`}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-gray-300 font-mono"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Embed Code</p>
              <textarea
                readOnly
                value={`<iframe src="${window.location.origin}/embed/${params.token}?projectId=${project.id}&mode=view" width="100%" height="600" frameborder="0"></iframe>`}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-gray-300 font-mono"
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
