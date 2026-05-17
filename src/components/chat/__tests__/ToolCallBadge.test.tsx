import { describe, test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => cleanup());
import { getToolLabel, ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

// --- getToolLabel ---

describe("getToolLabel", () => {
  describe("str_replace_editor", () => {
    test("create", () => {
      expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating App.jsx");
    });

    test("str_replace", () => {
      expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/Button.tsx" })).toBe("Editing Button.tsx");
    });

    test("insert", () => {
      expect(getToolLabel("str_replace_editor", { command: "insert", path: "/styles.css" })).toBe("Editing styles.css");
    });

    test("view", () => {
      expect(getToolLabel("str_replace_editor", { command: "view", path: "/index.jsx" })).toBe("Reading index.jsx");
    });

    test("undo_edit", () => {
      expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Undoing edit in App.jsx");
    });

    test("missing args falls back gracefully", () => {
      expect(getToolLabel("str_replace_editor", undefined)).toBe("Processing file");
    });

    test("missing path falls back gracefully", () => {
      expect(getToolLabel("str_replace_editor", { command: "create", path: "" })).toBe("Creating file");
    });
  });

  describe("file_manager", () => {
    test("rename", () => {
      expect(getToolLabel("file_manager", { command: "rename", path: "/old.jsx" })).toBe("Renaming old.jsx");
    });

    test("delete", () => {
      expect(getToolLabel("file_manager", { command: "delete", path: "/unused.tsx" })).toBe("Deleting unused.tsx");
    });

    test("missing args falls back gracefully", () => {
      expect(getToolLabel("file_manager", undefined)).toBe("Managing file");
    });
  });

  test("unknown tool returns raw tool name", () => {
    expect(getToolLabel("some_other_tool", { command: "run", path: "/foo" })).toBe("some_other_tool");
  });

  test("extracts filename from nested path", () => {
    expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/components/Card.tsx" })).toBe("Creating Card.tsx");
  });
});

// --- ToolCallBadge rendering ---

function makeTool(state: "call" | "result", toolName = "str_replace_editor", args = { command: "create", path: "/App.jsx" }): ToolInvocation {
  if (state === "result") {
    return { state, toolCallId: "1", toolName, args, result: "ok" };
  }
  return { state, toolCallId: "1", toolName, args };
}

describe("ToolCallBadge", () => {
  test("shows spinner when not done", () => {
    render(<ToolCallBadge tool={makeTool("call")} />);
    expect(screen.getByText("Creating App.jsx")).toBeTruthy();
    // Spinner has animate-spin class
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeTruthy();
  });

  test("shows green dot when done", () => {
    render(<ToolCallBadge tool={makeTool("result")} />);
    expect(screen.getByText("Creating App.jsx")).toBeTruthy();
    const greenDot = document.querySelector(".bg-emerald-500");
    expect(greenDot).toBeTruthy();
  });

  test("renders user-friendly label", () => {
    render(<ToolCallBadge tool={makeTool("call", "file_manager", { command: "delete", path: "/old.jsx" })} />);
    expect(screen.getByText("Deleting old.jsx")).toBeTruthy();
  });
});
