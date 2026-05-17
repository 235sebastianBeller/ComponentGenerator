"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolCallBadgeProps {
  tool: ToolInvocation;
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

export function getToolLabel(toolName: string, args: Record<string, string> | undefined): string {
  const fileName = args?.path ? getFileName(args.path) : "";

  if (toolName === "str_replace_editor") {
    switch (args?.command) {
      case "create":    return fileName ? `Creating ${fileName}` : "Creating file";
      case "str_replace":
      case "insert":    return fileName ? `Editing ${fileName}` : "Editing file";
      case "view":      return fileName ? `Reading ${fileName}` : "Reading file";
      case "undo_edit": return fileName ? `Undoing edit in ${fileName}` : "Undoing edit";
      default:          return fileName ? `Processing ${fileName}` : "Processing file";
    }
  }

  if (toolName === "file_manager") {
    switch (args?.command) {
      case "rename": return fileName ? `Renaming ${fileName}` : "Renaming file";
      case "delete": return fileName ? `Deleting ${fileName}` : "Deleting file";
      default:       return "Managing file";
    }
  }

  return toolName;
}

export function ToolCallBadge({ tool }: ToolCallBadgeProps) {
  const isDone = tool.state === "result";
  const label = getToolLabel(tool.toolName, tool.args as Record<string, string> | undefined);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
