from __future__ import annotations
# PROJECT_DIR = Path("/Users/zlataplotnikova/Desktop/Repos/webapp")
# THREAD_ID_FILE = PROJECT_DIR / ".codex-thread-id"
# CODEX_BIN = Path("/Applications/Codex.app/Contents/Resources/codex")
import time
import yaml
from pathlib import Path
from adapters import codex #,claude, ollama
import json

THREADS_FILE = Path("orchestrator/agent_threads.json")

def load_config():
    with open("orchestrator/config.yml") as f:
        return yaml.safe_load(f)

def get_adapter(config):
    adapters = {
        "codex": codex.run,
        # "claude": claude,
        # "ollama": ollama,
    }
    return adapters[config["adapter"]]

def check_inbox(agent):
    files = sorted(Path(f"agents/{agent}/inbox").glob("*.md"))
    return [f for f in files if f.parent.name != "done"]

def run_agent(agent: str, inbox_file: Path, adapter, threads: dict[str, str]):
    role = Path(f"agents/{agent}/role.md").read_text(encoding="utf-8")
    message = inbox_file.read_text(encoding="utf-8")

    thread_id = threads.get(agent)

    result = adapter(
        role=role,
        message=message,
        thread_id=thread_id,
    )

    if result.get("thread_id"):
        threads[agent] = result["thread_id"]

    return result


# def run_agent(agent: str, inbox_file: Path, adapter, threads: dict[str, str]):
#     role = Path(f"agents/{agent}/role.md").read_text(encoding="utf-8")
#     message = inbox_file.read_text(encoding="utf-8")
#     thread_id = threads.get(agent)
#     print(dir(adapter))

#     result = adapter(
#         system=role,
#         message=message,
#         thread_id=thread_id,
#     )

#     if result.get("thread_id"):
#         threads[agent] = result["thread_id"]

#     return result



def load_threads():
    if not THREADS_FILE.exists():
        return {}
    with open(THREADS_FILE, 'r', encoding="utf-8") as f:
        return json.load(f)


def watch():
    config = load_config()
    adapter = get_adapter(config)
    agents = ["pm", "architect", "engineer"]
    print("Watching inboxes...")

    while True:
        threads = load_threads()
        for agent in agents:
            files = check_inbox(agent)
            if files:
                print(f"→ {agent} has {len(files)} file(s)")
                for f in files:
                    response = run_agent(agent, f, adapter, threads)
                    print(response)
                    f.rename(f.parent / "done" / f.name)
                    save_threads(threads)
        time.sleep(config["watch_interval"])


if __name__ == "__main__":
    watch()
