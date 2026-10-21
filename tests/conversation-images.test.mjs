import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function load(file, require = () => {}) {
  const exports = {};
  new Function("exports", "require", ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText)(exports, require);
  return exports;
}

const validation = load("src/engine/validateScenario.ts");
const { parseScenario } = validation;
const { addScenarioImage, removeScenarioImage } = load("src/lib/scenarioImages.ts", () => validation);
const session = load("src/lib/sessionImages.ts");
const { createTimeline } = load("src/engine/timeline.ts");
const demo = JSON.parse(fs.readFileSync("scenarios/demo.json", "utf8"));
const image = { id: "session-photo-1", width: 1280, height: 640, alt: "Un paysage" };
const asset = { ...image, src: "data:image/webp;base64,AA==" };

test("image-only messages and captions validate for both participants", () => {
  for (const from of ["me", "them"]) for (const text of ["", "Regarde cette photo !"]) {
    const scenario = { ...demo, events: [{ type: "message", from, text, image }, { type: "tapback", from: "them", kind: "heart", target: 0 }] };
    assert.deepEqual(parseScenario(JSON.stringify(scenario)), scenario);
  }
});

test("malformed image references are rejected before saving or playback", () => {
  for (const invalid of [null, "photo", { ...image, id: asset.src }, { ...image, width: 0 }, { ...image, height: "640" }, { ...image, alt: "x".repeat(201) }]) {
    assert.throws(() => parseScenario(JSON.stringify({ ...demo, events: [{ type: "message", from: "me", text: "Photo", image: invalid }] })), /image/);
  }
});

test("saving a scenario keeps image metadata without embedding the session file", () => {
  const scenario = addScenarioImage(demo, session.imageReference(asset), "me", "Mon image");
  assert.equal(scenario.events.length, demo.events.length + 1);
  assert.deepEqual(scenario.events.at(-1), { type: "message", from: "me", text: "Mon image", image, delay: 800, typing: 0 });
  const saved = JSON.stringify(scenario);
  assert.ok(saved.includes(image.id));
  assert.ok(!saved.includes("data:image"));
  assert.ok(!saved.includes('"src"'));
});

test("reimporting replaces the image while preserving sender, caption, and timing", () => {
  const scenario = addScenarioImage(demo, image, "them", "Souvenir");
  const eventIndex = scenario.events.length - 1;
  const replacement = { ...image, id: "replacement-photo", width: 640, height: 1280 };
  const updated = addScenarioImage(scenario, replacement, "me", "Ignored caption", eventIndex);
  assert.deepEqual(updated.events[eventIndex], { ...scenario.events[eventIndex], image: replacement });
});

test("removing an image-only message removes its reactions and updates later targets", () => {
  const scenario = { ...demo, events: [
    { type: "timestamp", label: "Aujourd’hui" },
    { type: "message", from: "me", text: "Avant" },
    { type: "message", from: "them", text: "", image },
    { type: "message", from: "me", text: "Après" },
    { type: "tapback", from: "me", kind: "heart", target: 1 },
    { type: "status", value: "read", target: 2 },
    { type: "tapback", from: "them", kind: "thumbsUp", target: 2 },
  ] };
  const updated = removeScenarioImage(scenario, 2);
  assert.equal(updated.events.filter(event => event.type === "message").length, 2);
  assert.deepEqual(updated.events.filter(event => "target" in event).map(event => [event.type, event.target]), [["status", 1], ["tapback", 1]]);
  assert.ok(!JSON.stringify(updated).includes(image.id));
});

test("removing an image with a caption keeps the text message and its target indexes", () => {
  const scenario = { ...demo, events: [
    { type: "message", from: "me", text: "Une légende", image },
    { type: "status", target: 0, value: "delivered" },
  ] };
  assert.deepEqual(removeScenarioImage(scenario, 0).events, [
    { type: "message", from: "me", text: "Une légende" },
    { type: "status", target: 0, value: "delivered" },
  ]);
});

test("session images remain available across resets, then disappear when memory is cleared", t => {
  session.clearSessionImages();
  t.after(() => session.clearSessionImages());
  let notifications = 0;
  const unsubscribe = session.subscribeSessionImages(() => notifications++);
  session.registerSessionImage(asset);
  assert.equal(session.getSessionImages()[0].src, asset.src);
  assert.equal(session.getSessionImages(), session.getSessionImages());
  assert.deepEqual(session.getServerSessionImages(), []);
  session.clearSessionImages();
  assert.deepEqual(session.getSessionImages(), []);
  assert.equal(notifications, 2);
  unsubscribe();
});

test("photo messages participate in the timeline without simulated text typing", () => {
  for (const from of ["me", "them"]) {
    const cues = createTimeline({ events: [
      { type: "message", from, text: "", image, delay: 800 },
      { type: "status", target: 0, value: "read", delay: 500 },
    ] });
    assert.deepEqual(cues.map(cue => [cue.at, cue.event.type]), [[800, "message"], [1300, "status"]]);
    assert.deepEqual(cues[0].event.image, image);
  }
});

test("conversation photos preserve their aspect ratio and release temporary URLs", async t => {
  const revoked = [];
  const draws = [];
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: (...args) => draws.push(args.slice(1)) }), toDataURL: () => asset.src };
  for (const [key, value] of Object.entries({
    Image: class { naturalWidth = 2400; naturalHeight = 1200; decode() { return Promise.resolve(); } },
    document: { createElement: () => canvas },
  })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => previous ? Object.defineProperty(globalThis, key, previous) : Reflect.deleteProperty(globalThis, key));
  }
  t.mock.method(URL, "createObjectURL", () => "blob:photo");
  t.mock.method(URL, "revokeObjectURL", url => revoked.push(url));
  const prepared = await session.prepareConversationImage({ type: "image/png", size: 100, name: "Mon paysage.png" });
  assert.equal(prepared.width, 1280);
  assert.equal(prepared.height, 640);
  assert.equal(prepared.alt, "Mon paysage.png");
  assert.deepEqual(draws, [[0, 0, 1280, 640]]);
  assert.deepEqual(revoked, ["blob:photo"]);
  assert.equal(session.getSessionImages().length, 0);
});
