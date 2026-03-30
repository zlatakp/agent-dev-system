import fs from "node:fs";
import path from "node:path";
import { run as codex } from "./adapters/codex/index.js";
import { Thread } from "@openai/codex-sdk";


type RunAdapter = (
    role: string,
    message: string,
    threadId: string | null,
) => Promise<AdapterResult>;

type OrchestratorConfig = {
    adapter: "codex" | "claude" | "cursor";
    projectRoot: string;
    watchInterval: number;
    agents: string[];
    stateFile: string;
};

type AdapterResult = {
    thread: Thread,
    result: string
};

const REPO_ROOT = process.cwd();
const CONFIG_PATH = path.resolve(REPO_ROOT, "orchestrator", "config.json");

function loadConfig(): OrchestratorConfig {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw) as OrchestratorConfig;
}

function resolveRepoPath(value: string): string {
    return path.isAbsolute(value) ? value : path.resolve(REPO_ROOT, value);
}

function getAdapter(config: OrchestratorConfig) {
    switch (config.adapter) {
        case "codex":
            return codex;
    }
}

function checkInbox(agent: string): string[] {
    const inboxDir = path.resolve(REPO_ROOT, "agents", agent, "inbox");
    if (!fs.existsSync(inboxDir)) {
        return [];
    }
    return fs
        .readdirSync(inboxDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
        .map((entry) => path.join(inboxDir, entry.name))
        .sort();
}

function runAgent(
    agent: string,
    inboxFile: string,
    adapter_model: RunAdapter,
    threads: Record<string, string>,
): Promise<AdapterResult> {
    const role = fs.readFileSync(
        path.resolve(REPO_ROOT, "agents", agent, "role.md"),
        "utf8",
    );
    const inboxFileContent = fs.readFileSync(inboxFile, "utf8");
    const message = `\nInbox file:\n${inboxFileContent}\n\nCheck your inbox and proceed.`
    const threadId = threads[agent] ?? null;

    return adapter_model(role, message, threadId);
}

function loadThreads(stateFile: string): Record<string, string> {
    if (!fs.existsSync(stateFile)) {
        return {};
    }

    const raw = fs.readFileSync(stateFile, "utf8").trim();
    if (!raw) {
        return {};
    }

    return JSON.parse(raw) as Record<string, string>;
}

function saveThreads(stateFile: string, threads: Record<string, string>): void {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, `${JSON.stringify(threads, null, 2)}\n`, "utf8");
}

function moveToDone(inboxFile: string): void {
    const doneDir = path.join(path.dirname(inboxFile), "done");
    fs.mkdirSync(doneDir, { recursive: true });
    fs.renameSync(inboxFile, path.join(doneDir, path.basename(inboxFile)));
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function watch(): Promise<void> {
    const config = loadConfig();
    const adapter = getAdapter(config);
    const stateFile = resolveRepoPath(config.stateFile);

    console.log("Watching inboxes...");

    while (true) {
        const threads = loadThreads(stateFile);

        for (const agent of config.agents) {
            const files = checkInbox(agent);
            if (files.length === 0) {
                continue;
            }

            console.log(`-> ${agent} has ${files.length} file(s)`);

            for (const inboxFile of files) {
                try {
                    const response = await runAgent(agent, inboxFile, adapter, threads);
                    if (response.thread_id) {
                        threads[agent] = response.thread_id;
                    }

                    console.log(response);
                    moveToDone(inboxFile);
                    saveThreads(stateFile, threads);
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    console.error(`Failed processing ${agent}:${path.basename(inboxFile)}: ${message}`);
                }
            }
        }

        await sleep(config.watchInterval * 1000);
    }
}

watch().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
});


// const watchedDirectories = config.agents.map(agent => `${REPO_ROOT}/agents/${agent}/inbox/*.md`)
// const watcher = chokidar.watch(watchedDirectories, {
//     depth: 0, ignoreInitial: false, awaitWriteFinish: {  // Recommended for .md files to ensure they are fully saved
//         stabilityThreshold: 500,
//         pollInterval: 100
//     }
// })



// watcher.on('add', inboxFile => {
//     try {
//         const agent = inboxFile.split(path.sep).at(-2);
//         const threads = loadThreads(stateFile);
//         const response = await runAgent(agent, inboxFile, adapter, threads);
//         if (response.thread_id) {
//             threads[agent] = response.thread_id;
//         }

//         console.log(response);
//         moveToDone(inboxFile);
//         saveThreads(stateFile, threads);
//     } catch (error) {
//         const message = error instanceof Error ? error.message : String(error);
//         console.error(`Failed processing ${agent}:${path.basename(inboxFile)}: ${message}`);
//     }

// })