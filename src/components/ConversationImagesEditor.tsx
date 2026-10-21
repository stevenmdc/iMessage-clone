"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import type { Sender } from "@/engine/types";
import type { ScenarioLibrary } from "@/lib/useScenarioLibrary";
import { imageReference, prepareConversationImage, registerSessionImage } from "@/lib/sessionImages";
import ConversationImage from "./ConversationImage";

export default function ConversationImagesEditor({ library, onBusyChange }: {
  library: ScenarioLibrary;
  onBusyChange: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const replacement = useRef<number | undefined>(undefined);
  const mounted = useRef(true);
  const [from, setFrom] = useState<Sender>("me");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function upload(file: File, eventIndex?: number) {
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      const image = await prepareConversationImage(file);
      if (!mounted.current) return;
      if (library.addImage(imageReference(image), from, caption, eventIndex)) {
        registerSessionImage(image);
        setCaption("");
      }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "Import impossible.");
    } finally {
      if (mounted.current) { setBusy(false); onBusyChange(false); }
    }
  }

  function choose(eventIndex?: number) {
    replacement.current = eventIndex;
    input.current?.click();
  }

  return (
    <div className="mb-5 rounded-2xl border border-[#e7e2ec] bg-white/65 p-4">
      <h4 className="text-[12px] font-semibold text-[#726180]">Images de la conversation</h4>
      <p className="mt-1 text-[11px] leading-relaxed text-[#a098a8]">Temporaires : les fichiers disparaissent au rechargement ou à la fermeture de l’onglet. Les scénarios enregistrés gardent leur emplacement.</p>
      <input ref={input} type="file" accept="image/*" hidden disabled={busy} aria-label="Importer une image dans la conversation" onChange={event => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (file) void upload(file, replacement.current);
      }} />
      <div className="mt-3 flex flex-wrap gap-2">
        <select aria-label="Expéditeur de l’image" value={from} onChange={event => setFrom(event.target.value as Sender)} disabled={busy} className="rounded-lg border border-[#e7e2ec] bg-white px-2 py-2 text-[11px] text-[#726180]">
          <option value="me">Moi · à droite</option>
          <option value="them">Contact · à gauche</option>
        </select>
        <button type="button" onClick={() => choose()} disabled={busy || !library.parsed} className="flex items-center gap-2 rounded-lg border-0 bg-[#eee8f3] px-3 py-2 text-[11px] text-[#726180] disabled:cursor-default disabled:opacity-45">
          <ImagePlus size={14} aria-hidden="true" />{busy ? "Préparation…" : "Ajouter une image"}
        </button>
      </div>
      <label className="mt-3 block text-[11px] text-[#968b9f]" htmlFor="image-caption">Légende facultative</label>
      <input id="image-caption" type="text" maxLength={1000} value={caption} onChange={event => setCaption(event.target.value)} disabled={busy} placeholder="Texte sous la photo" className="mt-1 w-full rounded-lg border border-[#e7e2ec] bg-white px-3 py-2 text-[11px] text-[#726180]" />
      <div className="mt-3 flex flex-col gap-2">
        {library.parsed?.events.map((event, index) => event.type === "message" && event.image ? (
          <div key={`${index}-${event.image.id}`} className="flex items-center gap-2 rounded-xl bg-[#f5f2f7] p-2">
            <ConversationImage image={event.image} compact />
            <span className="min-w-0 flex-1 truncate text-[11px] text-[#8c8198]">{event.from === "me" ? "Moi" : "Contact"} · {event.image.alt || "Image"}</span>
            <button type="button" disabled={busy} onClick={() => choose(index)} aria-label={`Réimporter l’image du message ${index + 1}`} className="grid size-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-[#8c8198] disabled:opacity-45"><RefreshCw size={14} aria-hidden="true" /></button>
            <button type="button" disabled={busy} onClick={() => library.removeImage(index)} aria-label={`Retirer l’image du message ${index + 1}`} className="grid size-8 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-[#a48d9f] disabled:opacity-45"><Trash2 size={14} aria-hidden="true" /></button>
          </div>
        ) : null)}
      </div>
      {error && <p role="alert" className="mt-2 text-[11px] leading-relaxed text-[#b2697e]">{error}</p>}
    </div>
  );
}
