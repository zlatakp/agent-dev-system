"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var index_js_1 = require("./adapters/codex/index.js");
var REPO_ROOT = process.cwd();
var CONFIG_PATH = node_path_1.default.resolve(REPO_ROOT, "orchestrator", "config.json");
function loadConfig() {
    var raw = node_fs_1.default.readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
}
function resolveRepoPath(value) {
    return node_path_1.default.isAbsolute(value) ? value : node_path_1.default.resolve(REPO_ROOT, value);
}
function getAdapter(config) {
    switch (config.adapter) {
        case "codex":
            return index_js_1.run;
    }
}
function checkInbox(agent) {
    var inboxDir = node_path_1.default.resolve(REPO_ROOT, "agents", agent, "inbox");
    if (!node_fs_1.default.existsSync(inboxDir)) {
        return [];
    }
    return node_fs_1.default
        .readdirSync(inboxDir, { withFileTypes: true })
        .filter(function (entry) { return entry.isFile() && entry.name.endsWith(".md"); })
        .map(function (entry) { return node_path_1.default.join(inboxDir, entry.name); })
        .sort();
}
function runAgent(agent, inboxFile, adapter_model, threads) {
    var _a;
    var role = node_fs_1.default.readFileSync(node_path_1.default.resolve(REPO_ROOT, "agents", agent, "role.md"), "utf8");
    var inboxFileContent = node_fs_1.default.readFileSync(inboxFile, "utf8");
    var message = "\nInbox file:\n".concat(inboxFileContent, "\n\nCheck your inbox and proceed.");
    var threadId = (_a = threads[agent]) !== null && _a !== void 0 ? _a : null;
    return adapter_model(role, message, threadId);
}
function loadThreads(stateFile) {
    if (!node_fs_1.default.existsSync(stateFile)) {
        return {};
    }
    var raw = node_fs_1.default.readFileSync(stateFile, "utf8").trim();
    if (!raw) {
        return {};
    }
    return JSON.parse(raw);
}
function saveThreads(stateFile, threads) {
    node_fs_1.default.mkdirSync(node_path_1.default.dirname(stateFile), { recursive: true });
    node_fs_1.default.writeFileSync(stateFile, "".concat(JSON.stringify(threads, null, 2), "\n"), "utf8");
}
function moveToDone(inboxFile) {
    var doneDir = node_path_1.default.join(node_path_1.default.dirname(inboxFile), "done");
    node_fs_1.default.mkdirSync(doneDir, { recursive: true });
    node_fs_1.default.renameSync(inboxFile, node_path_1.default.join(doneDir, node_path_1.default.basename(inboxFile)));
}
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function watch() {
    return __awaiter(this, void 0, void 0, function () {
        var config, adapter, stateFile, threads, _i, _a, agent, files, _b, files_1, inboxFile, response, error_1, message;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    config = loadConfig();
                    adapter = getAdapter(config);
                    stateFile = resolveRepoPath(config.stateFile);
                    console.log("Watching inboxes...");
                    _c.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 11];
                    threads = loadThreads(stateFile);
                    _i = 0, _a = config.agents;
                    _c.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 9];
                    agent = _a[_i];
                    files = checkInbox(agent);
                    if (files.length === 0) {
                        return [3 /*break*/, 8];
                    }
                    console.log("-> ".concat(agent, " has ").concat(files.length, " file(s)"));
                    _b = 0, files_1 = files;
                    _c.label = 3;
                case 3:
                    if (!(_b < files_1.length)) return [3 /*break*/, 8];
                    inboxFile = files_1[_b];
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, runAgent(agent, inboxFile, adapter, threads)];
                case 5:
                    response = _c.sent();
                    if (response.thread_id) {
                        threads[agent] = response.thread_id;
                    }
                    console.log(response);
                    moveToDone(inboxFile);
                    saveThreads(stateFile, threads);
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _c.sent();
                    message = error_1 instanceof Error ? error_1.message : String(error_1);
                    console.error("Failed processing ".concat(agent, ":").concat(node_path_1.default.basename(inboxFile), ": ").concat(message));
                    return [3 /*break*/, 7];
                case 7:
                    _b++;
                    return [3 /*break*/, 3];
                case 8:
                    _i++;
                    return [3 /*break*/, 2];
                case 9: return [4 /*yield*/, sleep(config.watchInterval * 1000)];
                case 10:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 11: return [2 /*return*/];
            }
        });
    });
}
watch().catch(function (error) {
    var message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
});
