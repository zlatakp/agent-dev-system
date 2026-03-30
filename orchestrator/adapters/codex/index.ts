import { Codex, Thread } from "@openai/codex-sdk";

const codex = new Codex();
import type {
  RunStreamedResult,
  ThreadItem,
  ThreadOptions,
  Usage,
} from "@openai/codex-sdk";

type CollectStreamInfoResult = {
  result: string;
  items: ThreadItem[];
  usage: Usage | null;
};

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


export async function run(_role: string, threadId: string | null, config: { projectRoot: any; model: any; modelReasoningEffort: any; }) { //_message: string,
  let thread: Thread;

  if (threadId == null) {
    thread = codex.startThread()
  } else {
    thread = codex.resumeThread(threadId)
  }
  const options: ThreadOptions = { workingDirectory: config.projectRoot, model: config.model, modelReasoningEffort: config.modelReasoningEffort }
  const role = _role;
  const message = "Check your inbox and proceed."
  const stream = await thread.runStreamed(
    `${role}\n${message}`,
  );

  const { result, items, usage } = await collectStreamInfo(stream);


  return { result, thread }

}