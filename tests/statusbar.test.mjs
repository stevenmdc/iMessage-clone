import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const exports = {};
new Function("exports", "require", ts.transpileModule(fs.readFileSync("src/components/StatusBar.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText)(exports, createRequire(import.meta.url));
const StatusBar = exports.default;
const status = { time: "9:81", network: "5G", wifi: true, battery: 120, charging: false };

test("fictional time and green battery overflow are rendered without clamping", () => {
  const html = renderToStaticMarkup(createElement(StatusBar, { status }));
  assert.match(html, /<span>9:81<\/span>/);
  assert.match(html, /aria-label="Batterie 120%"/);
  assert.match(html, /width:120%;background-color:#34c759/);
  assert.match(html, /<b>120<\/b>/);
});

test("normal and empty battery levels preserve their proportional fill", () => {
  for (const battery of [0, 87, 100]) {
    const html = renderToStaticMarkup(createElement(StatusBar, { status: { ...status, battery } }));
    assert.ok(html.includes(`style="width:${battery}%"`));
    assert.doesNotMatch(html, /#34c759/);
  }
});
