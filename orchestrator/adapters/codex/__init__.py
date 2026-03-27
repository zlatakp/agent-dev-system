# import { Codex } from "@openai/codex-sdk";
# import * as fs from "fs";

# const codex = new Codex();

# export async function run(rolePath: string, inboxFile: string) {
#   const role = fs.readFileSync(rolePath, "utf-8");
#   const message = fs.readFileSync(inboxFile, "utf-8");

#   const thread = codex.startThread();
#   const result = await thread.run(
#     `${role}\n\nInbox file:\n${message}\n\nCheck your inbox and proceed.`
#   );

#   return { result, thread }; // return thread for rejection resumption
# }

# export async function resume(thread: any, message: string) {
#   return await thread.run(message);
# }

from __future__ import annotations
#import json
import os
from pathlib import Path
from typing import Any

from codex_sdk import Codex, CodexOptions, Thread, ThreadOptions #, TurnOptions


PROJECT_DIR = Path("/Users/zlataplotnikova/Desktop/Repos/webapp")
THREAD_ID_FILE = PROJECT_DIR / ".codex-thread-id"
CODEX_BIN = Path("/Applications/Codex.app/Contents/Resources/codex")
options = ThreadOptions(
        working_directory=str(PROJECT_DIR),
        sandbox_mode="workspace-write",
        skip_git_repo_check=True,
        model_reasoning_effort="high",
        approval_policy="on-failure",
        web_search_enabled=False,
    )



def construct_prompt(role_md: str, inbox_file: str) -> str:
    return f"""
    Read and follow {role_md}.
    Then read {inbox_file} and proceed.
    """.strip()


def build_codex() -> Codex:
    env = dict(os.environ)
    env.pop("OPENAI_API_KEY", None)
    env.pop("CODEX_API_KEY", None)
    return Codex(
        CodexOptions(
            codex_path_override=str(CODEX_BIN) if CODEX_BIN.is_file() else None,
            env=env,
        )
    )

def collect_stream_info(stream) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    final_response = ""
    usage = None
    for event in stream.events:
        print(event)
        event_type = event["type"]

        if event_type == "thread.started":
            print(f"Thread started: {event['thread_id']}")

        elif event_type == "turn.started":
            print("Turn started")

        elif event_type == "item.started":
            item = event["item"]
            print(f"Started: {item['type']}")

        elif event_type == "item.updated":
            item = event["item"]
            if item["type"] == "command_execution":
                print(f"Running: {item['command']}")

        elif event_type == "item.completed":
            item = event["item"]
            items.append(item)
            print(f"Completed: {item['type']}")

            if item["type"] == "agent_message":
                final_response = item["text"]

            elif item["type"] == "command_execution":
                print(item["aggregated_output"])

            elif item["type"] == "file_change":
                changed = [change["path"] for change in item["changes"]]
                print("Changed files:", ", ".join(changed))

        elif event_type == "turn.completed":
            usage = event["usage"]
            print("Turn completed")

        elif event_type == "turn.failed":
            raise RuntimeError(event["error"]["message"])

        elif event_type == "error":
            raise RuntimeError(event["message"])
        
    return final_response, items, usage


def _run(thread: Thread, prompt: str) -> dict[str, Any]:

    stream = thread.run_streamed(
        prompt,
        #turn_options=TurnOptions(output_schema=OUTPUT_SCHEMA),
    )
    final_response, items, usage = collect_stream_info(stream)

    # save_thread_id(thread.id)

    return {
        "thread_id": thread.id,
        "final_response": final_response,
        "items": items,
        "usage": usage,
    }


def start_thread(role: str, message: str ) -> dict[str, Any]:
    codex = build_codex()
    print("Starting new thread")
    thread = codex.start_thread(options)
    res = _run(thread, construct_prompt(role, message))
    return res


def resume_thread(thread_id: str, message: str) -> dict[str, Any]:
    codex = build_codex()
    print(f"Resuming thread: {thread_id}")
    thread = codex.resume_thread(thread_id, options)
    res = _run(thread, message)
    return res


def run(role: str, message: str, thread_id: str|None):
    return resume_thread(thread_id, message) if thread_id else start_thread(role, message)
    # print("\nTHREAD ID:")
    # print(result["thread_id"])

    # print("\nRAW FINAL RESPONSE:")
    # print(result["final_response"])

    # print("\nPARSED JSON:")
    # parsed = json.loads(result["final_response"])
    # print(json.dumps(parsed, indent=2))

    # print("\nUSAGE:")
    # print(json.dumps(result["usage"], indent=2))

    # print("\nITEM COUNT:")
    # print(len(result["items"]))


# def load_thread_id() -> str | None:
#     if THREAD_ID_FILE.exists():
#         value = THREAD_ID_FILE.read_text(encoding="utf-8").strip()
#         return value or None
#     return None


# def save_thread_id(thread_id: str | None) -> None:
#     if thread_id:
#         THREAD_ID_FILE.write_text(thread_id, encoding="utf-8")


# PROMPT = """
# Explore this codebase and return a concise JSON report with:
# 1. what the project does
# 2. the main entrypoints

# Be concrete and practical.
# """.strip()

# OUTPUT_SCHEMA = {
#     "type": "object",
#     "properties": {
#         "summary": {"type": "string"},
#         "entrypoints": {"type": "array", "items": {"type": "string"}},
#         "run_instructions": {"type": "string"},
#         "test_instructions": {"type": "string"},
#         "risks": {"type": "array", "items": {"type": "string"}},
#     },
#     "required": [
#         "summary",
#         "entrypoints",
#         "run_instructions",
#         "test_instructions",
#         "risks",
#     ],
#     "additionalProperties": False,
# }