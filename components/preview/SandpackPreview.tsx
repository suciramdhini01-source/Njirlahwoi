"use client";
import {
  SandpackProvider,
  SandpackPreview as SP,
  SandpackLayout,
} from "@codesandbox/sandpack-react";
import { AgentFile } from "@/types";
import { buildSandpackBundle } from "@/lib/next-to-react";
import { useEffect, useMemo, useState } from "react";

interface Props {
  files: AgentFile[];
}

export default function SandpackPreview({ files }: Props) {
  const [debounced, setDebounced] = useState(files);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(files), 700);
    return () => clearTimeout(t);
  }, [files]);
  const bundle = useMemo(() => buildSandpackBundle(debounced), [debounced]);

  return (
    <SandpackProvider
      template={bundle.template}
      files={bundle.files}
      customSetup={{ dependencies: bundle.dependencies }}
      theme="dark"
      options={{ recompileMode: "delayed", recompileDelay: 800 }}
    >
      <SandpackLayout style={{ height: "100%", borderRadius: 0, border: "none" }}>
        <SP
          style={{ height: "100%" }}
          showOpenInCodeSandbox={false}
          showRefreshButton
          showOpenNewtab={false}
        />
      </SandpackLayout>
    </SandpackProvider>
  );
}
