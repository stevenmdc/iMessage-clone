import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const timeline = {};
new Function("exports", ts.transpileModule(fs.readFileSync("src/engine/timeline.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(timeline);

test("incoming typing preserves its delay and message timing", () => {
  const cues = timeline.createTimeline({ events: [{ type: "message", from: "them", text: "Salut", delay: 100, typing: 600 }] });
  assert.deepEqual(cues.map(c => [c.at, c.event.type]), [[100, "typing"], [700, "message"]]);
});

test("outgoing composition preserves graphemes, then sends and schedules dependent events", () => {
  const text = "e\u0301👩‍💻!";
  const cues = timeline.createTimeline({ events: [
    { type: "message", from: "me", text, delay: 100, typing: 900 },
    { type: "status", target: 0, value: "delivered", delay: 400 },
    { type: "tapback", target: 0, from: "them", kind: "heart", delay: 200 },
  ] });
  assert.deepEqual(cues.filter(c => c.event.type === "compose").map(c => [c.at, c.event.text]), [
    [100, ""], [400, "e\u0301"], [700, "e\u0301👩‍💻"], [1000, text],
  ]);
  assert.deepEqual(cues.slice(-3).map(c => [c.at, c.event.type]), [[1220, "message"], [1620, "status"], [1820, "tapback"]]);
  assert.equal(cues.at(-1).event.target, 0);
});

test("typing zero sends immediately and an empty scenario stays empty", () => {
  const event = { type: "message", from: "me", text: "Direct", delay: 80, typing: 0 };
  assert.deepEqual(timeline.createTimeline({ events: [event] }), [{ at: 80, event }]);
  assert.deepEqual(timeline.createTimeline({ events: [] }), []);
});

test("automatic typing has a bounded duration and unique keystrokes", () => {
  for (const text of ["OK", "Un long message ".repeat(50)]) {
    const cues = timeline.createTimeline({ events: [{ type: "message", from: "me", text }] });
    assert(cues.at(-1).at >= 1420 && cues.at(-1).at <= 4720);
    const strokes = cues.filter(c => c.event.type === "compose").map(c => c.event.stroke);
    assert.equal(new Set(strokes).size, strokes.length);
    assert(cues.every((c, i) => i === 0 || c.at >= cues[i - 1].at));
  }
});
