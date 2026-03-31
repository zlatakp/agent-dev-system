import { Codex, Thread } from "@openai/codex-sdk";

const codex = new Codex();
import type {
  ModelReasoningEffort,
  RunStreamedResult,
  ThreadItem,
  ThreadOptions,
  Usage,
} from "@openai/codex-sdk";

import { createCodexLogger } from "./logger.js";

type CollectStreamInfoResult = {
  result: string;
  items: ThreadItem[];
  usage: Usage | null;
};

const logRun = createCodexLogger();

export async function collectStreamInfo(
  stream: RunStreamedResult,
): Promise<CollectStreamInfoResult> {
  const items: ThreadItem[] = [];
  let result = "";
  let usage: Usage | null = null;

  for await (const event of stream.events) {
    //console.log(event);
    switch (event.type) {
      case "thread.started":
        console.log(`Thread started: ${event.thread_id}`);
        break;

      case "turn.started":
        console.log("Turn started");
        break;

      case "item.started":
        console.log(`Started: ${event.item.type}`);
        break;

      case "item.updated":
        if (event.item.type === "command_execution") {
          console.log(`Running: ${event.item.command}`);
        }
        break;

      case "item.completed":
        items.push(event.item);
        console.log(`Completed: ${event.item.type}`);

        switch (event.item.type) {
          case "agent_message":
            result = event.item.text;
            break;

          case "command_execution":
            console.log(event.item.aggregated_output);
            break;

          case "file_change":
            console.log(
              "Changed files:",
              event.item.changes.map((change) => change.path).join(", "),
            );
            break;

          case "error":
            throw new Error(event.item.message);

          case "reasoning":
          case "mcp_tool_call":
          case "web_search":
          case "todo_list":
            break;
        }
        break;

      case "turn.completed":
        usage = event.usage;
        console.log("Turn completed");
        break;

      case "turn.failed":
        throw new Error(event.error.message);

      case "error":
        throw new Error(event.message);
    }
  }

  return { result, items, usage };
}


export async function run(_role: string, threadId: string | null, config: Record<string, any>) { //_message: string,
  let thread: Thread;
  const options: ThreadOptions = { workingDirectory: config.projectRoot, model: config.model, modelReasoningEffort: config.modelReasoningEffort, additionalDirectories: [config.pipelineRoot] }

  if (threadId == null) {
    thread = codex.startThread(options)
  } else {
    thread = codex.resumeThread(threadId, options)
  }
  const role = _role;
  const message = "Check your inbox and proceed."
  const input = `${role}\n${message}`;
  const logger = logRun({
    thread_id: threadId,
    model: config.model,
    model_reasoning_effort: config.modelReasoningEffort,
  });

  try {
    const stream = await thread.runStreamed(input);
    const { result, items, usage } = await collectStreamInfo(stream);

    logger.success(usage, thread.id ?? threadId);

    return { result, thread }
  } catch (error) {
    logger.error(error, thread.id ?? threadId);
    throw error;
  }

}
