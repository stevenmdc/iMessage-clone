"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { presets } from "./scenarios";
import { parseScenario } from "@/engine/validateScenario";
import type { MessageImage, Scenario, Sender } from "@/engine/types";
import { addScenarioImage, removeScenarioImage } from "./scenarioImages";

interface Saved { id: string; scenario: Scenario }
const storageKey = "imessage-studio.scenarios.v1";
const storageEvent = "imessage-studio.scenarios.changed";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(storageEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(storageEvent, listener);
  };
}

function getStorage() {
  try { return localStorage.getItem(storageKey) ?? "[]"; }
  catch { return "[]"; }
}

function getServerStorage() { return "[]"; }

export function useScenarioLibrary(onApply: (scenario: Scenario, play: boolean) => void) {
  const [selected, setSelected] = useState(presets[0].id);
  const [source, setSource] = useState(JSON.stringify(presets[0].scenario, null, 2));
  const [live, setLive] = useState(false);
  const [notice, setNotice] = useState("");
  const lastApplied = useRef(source);
  const storedSource = useSyncExternalStore(subscribe, getStorage, getServerStorage);
  const saved = useMemo<Saved[]>(() => {
    try {
      const stored: unknown = JSON.parse(storedSource);
      return Array.isArray(stored) ? stored.slice(0, 10).flatMap(item => {
        try {
          return typeof item?.id === "string"
            ? [{ id: item.id, scenario: parseScenario(JSON.stringify(item.scenario)) }]
            : [];
        } catch { return []; }
      }) : [];
    } catch { return []; }
  }, [storedSource]);
  const { parsed, error } = useMemo(() => {
    try { return { parsed: parseScenario(source), error: "" }; }
    catch (cause) {
      return { parsed: null, error: cause instanceof Error ? cause.message : "Scénario invalide." };
    }
  }, [source]);

  function select(id: string, scenario: Scenario) {
    const json = JSON.stringify(scenario, null, 2);
    setSelected(id);
    setSource(json);
    lastApplied.current = json;
    setNotice("");
    onApply(scenario, false);
  }

  function preview(automatic = false) {
    if (!parsed) return false;
    lastApplied.current = source;
    setSelected("custom");
    onApply(parsed, true);
    setNotice(automatic ? "Prévisualisation mise à jour" : "Prévisualisation lancée");
    return true;
  }

  function persist(next: Saved[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event(storageEvent));
      return true;
    } catch {
      setNotice("L’enregistrement local est indisponible dans ce navigateur.");
      return false;
    }
  }

  function save() {
    if (!parsed) return;
    const id = selected.startsWith("saved-") ? selected
      : `saved-${Math.max(0, ...saved.map(item => Number(item.id.replace("saved-", "")) || 0)) + 1}`;
    const next = [{ id, scenario: parsed }, ...saved.filter(item => item.id !== id)].slice(0, 10);
    if (persist(next)) {
      select(id, parsed);
      setNotice("Scénario enregistré dans ce navigateur");
    }
  }

  function remove(id: string) {
    if (persist(saved.filter(item => item.id !== id))) {
      if (selected === id) setSelected("custom");
      setNotice("Enregistrement supprimé ; la conversation affichée reste disponible.");
    }
  }

  function edit(next: string) {
    setSource(next);
    setNotice("");
  }

  function addImage(image: MessageImage, from: Sender, caption: string, eventIndex?: number) {
    if (!parsed) return false;
    try {
      edit(JSON.stringify(addScenarioImage(parsed, image, from, caption, eventIndex), null, 2));
      return true;
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Ajout de l’image impossible.");
      return false;
    }
  }

  function removeImage(eventIndex: number) {
    if (!parsed) return;
    try { edit(JSON.stringify(removeScenarioImage(parsed, eventIndex), null, 2)); }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : "Suppression de l’image impossible."); }
  }

  return { selected, source, saved, live, setLive, notice, lastApplied, parsed, error, select, preview, save, remove, edit, addImage, removeImage };
}

export type ScenarioLibrary = ReturnType<typeof useScenarioLibrary>;
