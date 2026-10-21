"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, BookOpen, Braces, Check, Play, Save, Trash2 } from "lucide-react";
import { presets } from "@/lib/scenarios";
import { parseScenario } from "@/engine/validateScenario";
import type { Scenario } from "@/engine/types";

interface Saved { id: string; scenario: Scenario }
const storageKey = "imessage-studio.scenarios.v1";
const storageEvent = "imessage-studio.scenarios.changed";
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener); window.addEventListener(storageEvent, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(storageEvent, listener); };
}
function getStorage() { try { return localStorage.getItem(storageKey) ?? "[]"; } catch { return "[]"; } }
function getServerStorage() { return "[]"; }
export default function ScenarioPanel({ onApply }: { onApply: (scenario: Scenario, play: boolean) => void }) {
  const [tab, setTab] = useState<"presets" | "editor">("presets");
  const [selected, setSelected] = useState("demo");
  const [source, setSource] = useState(JSON.stringify(presets[0].scenario, null, 2));
  const storedSource = useSyncExternalStore(subscribe, getStorage, getServerStorage);
  const saved = useMemo<Saved[]>(() => {
    try {
      const stored: unknown = JSON.parse(storedSource);
      return Array.isArray(stored) ? stored.slice(0, 10).flatMap(item => {
        try { return typeof item?.id === "string" ? [{ id: item.id, scenario: parseScenario(JSON.stringify(item.scenario)) }] : []; } catch { return []; }
      }) : [];
    } catch { return []; }
  }, [storedSource]);
  const [live, setLive] = useState(false);
  const [notice, setNotice] = useState("");
  const lastApplied = useRef(source);
  const apply = useEffectEvent(onApply);
  const { parsed, error } = useMemo(() => {
    try { return { parsed: parseScenario(source), error: "" }; }
    catch (cause) { return { parsed: null, error: cause instanceof Error ? cause.message : "Scénario invalide." }; }
  }, [source]);

  useEffect(() => {
    if (!live || tab !== "editor" || source === lastApplied.current) return;
    const timer = setTimeout(() => {
      try {
        const scenario = parseScenario(source);
        lastApplied.current = source;
        apply(scenario, true);
        setSelected("custom");
        setNotice("Prévisualisation mise à jour");
      } catch { /* Keep the last valid scenario while editing. */ }
    }, 650);
    return () => clearTimeout(timer);
  }, [source, live, tab]);

  function select(id: string, scenario: Scenario) {
    const json = JSON.stringify(scenario, null, 2);
    setSelected(id); setSource(json); lastApplied.current = json; setNotice("");
    onApply(scenario, false);
  }
  function preview() {
    if (!parsed) return;
    lastApplied.current = source;
    setSelected("custom"); onApply(parsed, true); setNotice("Prévisualisation lancée");
  }
  function persist(next: Saved[]) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); window.dispatchEvent(new Event(storageEvent)); return true; }
    catch { setNotice("L’enregistrement local est indisponible dans ce navigateur."); return false; }
  }
  function save() {
    if (!parsed) return;
    const id = selected.startsWith("saved-") ? selected : `saved-${Math.max(0, ...saved.map(item => Number(item.id.replace("saved-", "")) || 0)) + 1}`;
    const next = [{ id, scenario: parsed }, ...saved.filter(item => item.id !== id)].slice(0, 10);
    if (persist(next)) { setSelected(id); setNotice("Scénario enregistré dans ce navigateur"); }
  }

  return <aside className="scenario-library" aria-label="Scénarios et éditeur">
    <div className="library-intro"><span className="settings-eyebrow">À VOUS DE JOUER</span><h1>Chaque message<br/>raconte une histoire.</h1><p>Choisissez un point de départ.<br/>Puis faites-en votre conversation.</p></div>
    <div className="library-tabs" role="tablist" aria-label="Mode de scénario"><button id="presets-tab" role="tab" aria-selected={tab === "presets"} aria-controls="presets-panel" onClick={() => setTab("presets")}><BookOpen size={14}/> Scénarios</button><button id="editor-tab" role="tab" aria-selected={tab === "editor"} aria-controls="editor-panel" onClick={() => setTab("editor")}><Braces size={14}/> Éditeur JSON</button></div>
    {tab === "presets" ? <div role="tabpanel" id="presets-panel" aria-labelledby="presets-tab" className="preset-list">
      {presets.map(preset => <button key={preset.id} className={`preset-card ${selected === preset.id ? "selected" : ""}`} onClick={() => select(preset.id, preset.scenario)} aria-pressed={selected === preset.id}><span className="preset-tag">{preset.tag}</span><strong>{preset.scenario.meta.title}</strong><span className="preset-description">{preset.description}</span><span className="preset-meta">{preset.scenario.events.filter(e => e.type === "message").length} messages <span>{selected === preset.id ? <Check size={14}/> : <ArrowRight size={14}/>}</span></span></button>)}
      {!!saved.length && <span className="saved-label">VOS SCÉNARIOS</span>}
      {saved.map(item => <div className="saved-scenario" key={item.id}><button aria-pressed={selected === item.id} onClick={() => select(item.id, item.scenario)}><span>{item.scenario.meta.title}</span><small>{item.scenario.meta.contact.name}</small></button><button className="delete-scenario" aria-label={`Supprimer ${item.scenario.meta.title}`} onClick={() => { if (persist(saved.filter(s => s.id !== item.id))) setNotice("Enregistrement supprimé ; la conversation affichée reste disponible."); }}><Trash2 size={14}/></button></div>)}
      <p className="library-hint">Un scénario sélectionné est prêt à jouer.<br/>Personnalisez-le dans l’éditeur.</p>
    </div> : <div role="tabpanel" id="editor-panel" aria-labelledby="editor-tab" className="scenario-editor">
      <div className="editor-toolbar"><label htmlFor="live-preview"><input id="live-preview" type="checkbox" checked={live} onChange={e => setLive(e.target.checked)}/><span className={live ? "live-dot" : ""}/> Aperçu live</label><span>{parsed ? "JSON valide" : "À corriger"}</span></div>
      <label className="sr-only" htmlFor="scenario-json">Scénario JSON</label><textarea id="scenario-json" spellCheck={false} value={source} onChange={e => { setSource(e.target.value); setNotice(""); }} aria-invalid={!!error} aria-describedby="scenario-feedback"/>
      <p id="scenario-feedback" className={`editor-feedback ${error ? "is-error" : ""}`} role="status">{error || `${parsed?.events.filter(e => e.type === "message").length ?? 0} messages · Prêt à prévisualiser`}</p>
      <div className="editor-actions"><button onClick={preview} disabled={!parsed}><Play size={13}/> Prévisualiser</button><button onClick={save} disabled={!parsed}><Save size={13}/> Enregistrer</button></div>
      <p className="library-hint">Le mode live rejoue le JSON valide après une courte pause de saisie. Vos enregistrements restent dans ce navigateur.</p>
    </div>}
    {notice && <p className="library-notice" role="status">{notice}</p>}
  </aside>;
}
