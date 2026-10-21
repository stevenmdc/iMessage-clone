"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { prepareAvatar } from "@/lib/prepareAvatar";
import ContactAvatar from "./ContactAvatar";

export default function AvatarUpload({ name, avatar, onChange }: {
  name: string;
  avatar: string | null;
  onChange: (avatar: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try { onChange(await prepareAvatar(file)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Import de la photo impossible."); }
    finally { setBusy(false); }
  }

  function remove() {
    setError("");
    try { onChange(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Suppression de la photo impossible."); }
  }

  return (
    <div className="flex max-w-[220px] flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        <ContactAvatar name={name} src={avatar} size={48} />
        <div className="flex flex-col items-start gap-2">
          <input ref={input} id="setting-avatar" type="file" accept="image/*" hidden disabled={busy} aria-describedby="setting-avatar-description" onChange={event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void upload(file);
          }} />
          <button type="button" disabled={busy || !name.trim()} aria-busy={busy} onClick={() => input.current?.click()} className="flex items-center gap-2 rounded-lg border-0 bg-[#eee8f3] px-3 py-2 text-[11px] text-[#726180] disabled:cursor-default disabled:opacity-50">
            <ImagePlus size={14} aria-hidden="true" />{busy ? "Préparation…" : avatar ? "Remplacer" : "Importer"}
          </button>
          {avatar && <button type="button" disabled={busy} onClick={remove} aria-label={`Retirer la photo de ${name}`} className="flex items-center gap-2 rounded-lg border-0 bg-transparent px-1 text-[11px] text-[#a48d9f] disabled:opacity-50"><Trash2 size={12} aria-hidden="true" />Retirer</button>}
        </div>
      </div>
      {error && <p role="alert" className="text-right text-[11px] leading-relaxed text-[#b2697e]">{error}</p>}
    </div>
  );
}
