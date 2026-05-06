"use client";
import { useMemo, useState } from "react";
import { useAgentStore } from "@/store/agent";
import { buildPreviewHtml } from "@/lib/build-preview";
import { BrowserFrame } from "./BrowserFrame";
import { DeviceControls, DeviceKind } from "./DeviceControls";

export function LivePreviewPanel() {
  const files = useAgentStore((s) => s.files);
  const [device, setDevice] = useState<DeviceKind>("desktop");
  const html = useMemo(() => buildPreviewHtml(files), [files]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Live Preview</h2>
        <div className="ml-auto">
          <DeviceControls value={device} onChange={setDevice} />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <BrowserFrame device={device}>
          <iframe
            title="preview"
            srcDoc={html}
            className="w-full h-full bg-white"
            sandbox="allow-scripts allow-forms allow-same-origin"
          />
        </BrowserFrame>
      </div>
    </div>
  );
}
