import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

function load(file) {
  const exports = {};
  new Function("exports", "require", ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText)(exports, createRequire(import.meta.url));
  return exports;
}

const { avatarStorageKey, parseContactAvatars, resolveContactAvatar, writeContactAvatar } = load("src/lib/contactAvatars.ts");
const { prepareAvatar } = load("src/lib/prepareAvatar.ts");
const ContactAvatar = load("src/components/ContactAvatar.tsx").default;
const photo = "data:image/png;base64,AA==";
const replacement = "data:image/webp;base64,AQ==";
const contact = name => ({ name, avatar: null });

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test("contact photos survive reload, replacement, and switching contacts", () => {
  const storage = memoryStorage();
  writeContactAvatar(storage, "Instinct", photo);
  writeContactAvatar(storage, "Camille", replacement);
  let reloaded = parseContactAvatars(storage.getItem(avatarStorageKey));
  assert.equal(resolveContactAvatar(reloaded, contact(" INSTINCT ")), photo);
  assert.equal(resolveContactAvatar(reloaded, contact("Camille")), replacement);
  assert.equal(resolveContactAvatar(reloaded, contact("Alex")), null);

  writeContactAvatar(storage, "Instinct", replacement);
  reloaded = parseContactAvatars(storage.getItem(avatarStorageKey));
  assert.equal(resolveContactAvatar(reloaded, contact("Instinct")), replacement);
  assert.equal(resolveContactAvatar(reloaded, contact("Camille")), replacement);
});

test("removing a photo persists and overrides an embedded scenario photo", () => {
  const storage = memoryStorage();
  writeContactAvatar(storage, "Instinct", photo);
  writeContactAvatar(storage, "Camille", replacement);
  writeContactAvatar(storage, "Instinct", null);
  const reloaded = parseContactAvatars(storage.getItem(avatarStorageKey));
  assert.equal(resolveContactAvatar(reloaded, { name: "Instinct", avatar: photo }), null);
  assert.equal(resolveContactAvatar(reloaded, contact("Camille")), replacement);
  assert.equal(resolveContactAvatar(reloaded, { name: "Alex", avatar: photo }), photo);
});

test("malformed storage and reserved object names do not break avatar lookup", () => {
  for (const value of [null, "{", "null", "[]"]) assert.deepEqual(parseContactAvatars(value), {});
  assert.deepEqual(parseContactAvatars(JSON.stringify({ instinct: photo, alex: 123, camille: "https://example.com/photo.png" })), { instinct: photo });
  assert.equal(resolveContactAvatar({}, contact("constructor")), null);
  const storage = memoryStorage();
  writeContactAvatar(storage, "__proto__", photo);
  assert.equal(resolveContactAvatar(parseContactAvatars(storage.getItem(avatarStorageKey)), contact("__proto__")), photo);
});

test("storage failure leaves the previous photo intact", () => {
  const storage = memoryStorage();
  writeContactAvatar(storage, "Instinct", photo);
  const fullStorage = { getItem: storage.getItem, setItem: () => { throw new Error("Quota exceeded"); } };
  assert.throws(() => writeContactAvatar(fullStorage, "Instinct", replacement), /Quota exceeded/);
  assert.equal(resolveContactAvatar(parseContactAvatars(storage.getItem(avatarStorageKey)), contact("Instinct")), photo);
});

test("avatar renders the local photo directly or falls back to the initial", () => {
  const image = renderToStaticMarkup(createElement(ContactAvatar, { name: "Instinct", src: photo }));
  assert.ok(image.includes(`src="${photo}"`));
  assert.match(image, /alt="Photo de Instinct"/);
  assert.doesNotMatch(image, /\/_next\/image/);
  const fallback = renderToStaticMarkup(createElement(ContactAvatar, { name: "Instinct", src: null }));
  assert.match(fallback, />I<\/span>/);
  assert.doesNotMatch(fallback, /<img/);
});

function imageEnvironment(t, width, height, decodeFails = false) {
  const draws = [];
  const revoked = [];
  const canvas = {
    width: 0, height: 0,
    getContext: () => ({ drawImage: (...args) => draws.push(args.slice(1)) }),
    toDataURL: (format, quality) => {
      assert.equal(format, "image/webp");
      assert.equal(quality, .85);
      return replacement;
    },
  };
  for (const [key, value] of Object.entries({
    Image: class {
      naturalWidth = width;
      naturalHeight = height;
      decode() { return decodeFails ? Promise.reject(new Error("Decode failed")) : Promise.resolve(); }
    },
    document: { createElement: name => { assert.equal(name, "canvas"); return canvas; } },
  })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, key, previous);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  t.mock.method(URL, "createObjectURL", () => "blob:avatar");
  t.mock.method(URL, "revokeObjectURL", url => revoked.push(url));
  return { draws, revoked, canvas };
}

for (const [width, height, cropX, cropY] of [[800, 400, 200, 0], [400, 800, 0, 200]]) {
  test(`a ${width}×${height} photo is center-cropped and reduced before persistence`, async t => {
    const { draws, revoked, canvas } = imageEnvironment(t, width, height);
    const result = await prepareAvatar({ type: "image/png", size: 100 });
    assert.equal(result, replacement);
    assert.deepEqual(draws, [[cropX, cropY, 400, 400, 0, 0, 256, 256]]);
    assert.equal(canvas.width, 256);
    assert.equal(canvas.height, 256);
    assert.deepEqual(revoked, ["blob:avatar"]);
  });
}

test("unreadable images release temporary URLs and produce an actionable error", async t => {
  const { revoked, draws } = imageEnvironment(t, 800, 400, true);
  await assert.rejects(prepareAvatar({ type: "image/png", size: 100 }), /JPEG, PNG ou WebP/);
  assert.deepEqual(revoked, ["blob:avatar"]);
  assert.deepEqual(draws, []);
});

test("non-image and oversized files are rejected before decoding", async () => {
  await assert.rejects(prepareAvatar({ type: "text/plain", size: 100 }), /fichier image/);
  await assert.rejects(prepareAvatar({ type: "image/png", size: 21 * 1024 * 1024 }), /20 Mo/);
});
