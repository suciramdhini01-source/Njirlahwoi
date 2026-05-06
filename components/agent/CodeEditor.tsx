"use client";
import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { AgentFile } from "@/types";

interface Props {
  file: AgentFile | null;
  streaming: boolean;
}

export function CodeEditor({ file, streaming }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prevContentRef = useRef<string>("");
  const [highlightedLines, setHighlightedLines] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!streaming || !file) return;
    const prev = prevContentRef.current;
    const curr = file.content;
    if (curr.length <= prev.length) {
      prevContentRef.current = curr;
      return;
    }
    const prevLines = prev.split("\n").length;
    const currLines = curr.split("\n").length;
    if (currLines > prevLines) {
      const newLineNums = new Set<number>();
      for (let i = prevLines; i <= currLines; i++) {
        newLineNums.add(i);
      }
      setHighlightedLines((prev) => new Set(Array.from(prev).concat(Array.from(newLineNums))));
      const timer = setTimeout(() => {
        setHighlightedLines((prev) => {
          const next = new Set(Array.from(prev));
          newLineNums.forEach((n) => next.delete(n));
          return next;
        });
      }, 1200);
      prevContentRef.current = curr;
      return () => clearTimeout(timer);
    }
    prevContentRef.current = curr;
  }, [file?.content, streaming]);

  useEffect(() => {
    if (!streaming) {
      prevContentRef.current = "";
      setHighlightedLines(new Set());
    }
  }, [streaming]);

  useEffect(() => {
    if (streaming && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [file?.content, streaming]);

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-500">
        Pilih file untuk melihat kode.
      </div>
    );
  }

  const lines = (file.content || "// menunggu konten...").split("\n");

  return (
    <div
      ref={ref}
      className="h-full overflow-auto scrollbar-neon text-[13px] leading-relaxed"
    >
      <div className="relative">
        <SyntaxHighlighter
          language={file.language || "text"}
          style={oneDark as any}
          showLineNumbers
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: 13,
          }}
          wrapLongLines
          lineProps={(lineNumber) => {
            const isHighlighted = highlightedLines.has(lineNumber);
            return {
              style: {
                display: "block",
                backgroundColor: isHighlighted
                  ? "rgba(253, 224, 71, 0.12)"
                  : undefined,
                borderLeft: isHighlighted
                  ? "2px solid rgba(253, 224, 71, 0.7)"
                  : "2px solid transparent",
                transition: "background-color 0.6s ease, border-color 0.6s ease",
              },
            };
          }}
        >
          {lines.join("\n")}
        </SyntaxHighlighter>
        {streaming && (
          <span
            className="inline-block w-2 h-4 bg-neon-cyan animate-pulse rounded-sm ml-0.5"
            style={{ verticalAlign: "middle" }}
          />
        )}
      </div>
    </div>
  );
}
