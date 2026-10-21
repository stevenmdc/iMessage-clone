import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function load(file, require = () => {}) {
  const exports = {};
  new Function("exports", "require", ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText)(exports, require);
  return exports;
}
const { parseScenario } = load("src/engine/validateScenario.ts");
const demo = JSON.parse(fs.readFileSync("scenarios/demo.json", "utf8"));
const { presets } = load("src/lib/scenarios.ts", () => demo);

test("all recommended scenarios are valid and have distinct ids", () => {
  assert.equal(new Set(presets.map(preset => preset.id)).size, presets.length);
  for (const preset of presets) assert.deepEqual(parseScenario(JSON.stringify(preset.scenario)), preset.scenario);
});

test("invalid live edits are rejected with actionable errors", () => {
  assert.throws(() => parseScenario("{"), /JSON invalide/);
  assert.throws(() => parseScenario("null"), /meta/);
  assert.throws(() => parseScenario(JSON.stringify({ ...demo, events: [] })), /1 et 200/);
  for (const event of [
    { type: "message", from: "unknown", text: "Hello" },
    { type: "message", from: "me", text: "" },
    { type: "message", from: "me", text: "Hello", delay: -1 },
    { type: "message", from: "me", text: "Hello", typing: "100" },
    { type: "tapback", target: 0, from: "them", kind: "heart" },
    { type: "unknown" },
  ]) assert.throws(() => parseScenario(JSON.stringify({ ...demo, events: [event] })), /Événement 1/);
});

test("target indexes count messages, not timestamps", () => {
  const events = [
    { type: "timestamp", label: "Maintenant" },
    { type: "message", from: "me", text: "Test" },
    { type: "tapback", target: 0, from: "them", kind: "heart" },
  ];
  assert.equal(parseScenario(JSON.stringify({ ...demo, events })).events.length, 3);
  events[2].target = 1;
  assert.throws(() => parseScenario(JSON.stringify({ ...demo, events })), /target/);
});

test("malformed metadata and excessive durations are rejected", () => {
  const invalid = structuredClone(demo);
  invalid.meta.statusBar.battery = 120;
  assert.throws(() => parseScenario(JSON.stringify(invalid)), /statusBar/);
  invalid.meta.statusBar.battery = 50;
  invalid.meta.statusBar.time = "24:99";
  assert.throws(() => parseScenario(JSON.stringify(invalid)), /statusBar/);
  const events = Array.from({ length: 11 }, () => ({ type: "message", from: "them", text: "Long", delay: 60000 }));
  assert.throws(() => parseScenario(JSON.stringify({ ...demo, events })), /10 minutes/);
});
