"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Play, Save } from "lucide-react";
import type { ScenarioLibrary } from "@/lib/useScenarioLibrary";
import ConversationImagesEditor from "./ConversationImagesEditor";

export default function ScenarioEditor({ library, onPreview }: {
  library: ScenarioLibrary;
  onPreview: () => void;
}) {
  const { live, source, lastApplied } = library;
  const [imageBusy, setImageBusy] = useState(false);
  const previewLive = useEffectEvent(() => library.preview(true));
  useEffect(() => {
    if (!live || source === lastApplied.current) return;
    const timer = setTimeout(() => previewLive(), 650);
    return () => clearTimeout(timer);
  }, [source, live, lastApplied]);

  return (
    <div>
      <ConversationImagesEditor library={library} onBusyChange={setImageBusy} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8c8198]">
        <label htmlFor="live-preview" className="flex cursor-pointer items-center gap-2">
          <input id="live-preview" type="checkbox" checked={live} disabled={imageBusy} onChange={event => library.setLive(event.target.checked)} className="accent-[#82718f]" />
          Aperçu live
        </label>
        <span>{library.parsed ? "JSON valide" : "À corriger"}</span>
      </div>
      <label className="sr-only" htmlFor="scenario-json">Scénario JSON</label>
      <textarea
        id="scenario-json"
        spellCheck={false}
        disabled={imageBusy}
        value={source}
        onChange={event => library.edit(event.target.value)}
        aria-invalid={!!library.error}
        aria-describedby="scenario-feedback"
        className="block h-[38dvh] min-h-[260px] max-h-[460px] w-full resize-y rounded-xl border border-[#ded5e8] bg-white p-4 font-mono text-[11px] leading-[1.8] text-[#7a668b] [tab-size:2] focus-visible:outline-2 focus-visible:outline-[#a793b9]"
      />
      <p id="scenario-feedback" role="status" className={`my-3 min-h-8 text-[11px] leading-relaxed ${library.error ? "text-[#b2697e]" : "text-[#929082]"}`}>
        {library.error || `${library.parsed?.events.filter(event => event.type === "message").length ?? 0} messages · Prêt à prévisualiser`}
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => { if (library.preview()) onPreview(); }} disabled={!library.parsed || imageBusy} className="flex flex-1 items-center justify-center gap-2 rounded-xl border-0 bg-[#6f5d7d] px-3 py-3 text-[11px] text-white disabled:cursor-default disabled:opacity-45">
          <Play size={14} aria-hidden="true" /> Prévisualiser
        </button>
        <button type="button" onClick={library.save} disabled={!library.parsed || imageBusy} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#d8cfe1] bg-white px-3 py-3 text-[11px] text-[#897298] disabled:cursor-default disabled:opacity-45">
          <Save size={14} aria-hidden="true" /> Enregistrer
        </button>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[#a098a8]">Prévisualiser ferme les réglages et lance la conversation. L’aperçu live rejoue les modifications valides après une courte pause. Vos enregistrements restent dans ce navigateur.</p>
      {library.notice && <p role="status" className="mt-3 text-[11px] leading-relaxed text-[#8e7b9b]">{library.notice}</p>}
    </div>
  );
}
