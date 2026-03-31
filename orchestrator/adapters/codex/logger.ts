import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { Usage } from "@openai/codex-sdk";

const LOG_PATH = path.resolve("./logs/codex_usage.jsonl");

export type CodexLogEntry = {
  timestamp: string;
  run_id: string;
  thread_id: string | null;
  model?: string;
  model_reasoning_effort?: string;
  duration_ms: number;
  usage: Usage | null;
  status: "success" | "error";
  error?: string;
};

export type CodexLogSink = (entry: CodexLogEntry) => void;

export function createJsonlSink(logPath = LOG_PATH): CodexLogSink {
  return (entry) => {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`, "utf8");
  };
}

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function createCodexLogger(
  sinks: CodexLogSink[] = [createJsonlSink()],
) {
  return (base: {
    thread_id: string | null;
    model?: string;
    model_reasoning_effort?: string;
  }) => {
    const runId = crypto.randomUUID();
    const startedAt = Date.now();

    const write = (entry: Omit<CodexLogEntry, "timestamp" | "run_id">) => {
      const record: CodexLogEntry = {
        timestamp: new Date().toISOString(),
        run_id: runId,
        ...entry,
      };

      for (const sink of sinks) {
        sink(record);
      }
    };

    return {
      success(usage: Usage | null, threadId = base.thread_id) {
        write({
          thread_id: threadId,
          model: base.model,
          model_reasoning_effort: base.model_reasoning_effort,
          duration_ms: Date.now() - startedAt,
          usage,
          status: "success",
        });
      },
      error(error: unknown, threadId = base.thread_id) {
        write({
          thread_id: threadId,
          model: base.model,
          model_reasoning_effort: base.model_reasoning_effort,
          duration_ms: Date.now() - startedAt,
          usage: null,
          status: "error",
          error: serializeError(error),
        });
      },
    };
  };
}
