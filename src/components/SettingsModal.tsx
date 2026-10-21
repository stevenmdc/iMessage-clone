"use client";

import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Braces, Settings, SlidersHorizontal, Volume2, X } from "lucide-react";
import { previewSound, type Sound } from "@/audio/sounds";
import type { Scenario } from "@/engine/types";
import AvatarUpload from "./AvatarUpload";

type Meta = Scenario["meta"];
interface Props {
  onClose: () => void;
  muted: boolean;
  onSoundChange: (enabled: boolean) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  meta: Meta;
  onMetaChange: (meta: Meta) => void;
  avatar: string | null;
  onAvatarChange: (avatar: string | null) => void;
  keyboardLayout: "qwerty" | "azerty";
  onKeyboardLayoutChange: (layout: "qwerty" | "azerty") => void;
  scenarioEditor: ReactNode;
}

function SettingRow({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return <div className="setting-row">
    <div className="setting-copy"><label htmlFor={id}>{title}</label><p id={`${id}-description`}>{description}</p></div>
    <div className="setting-control">{children}</div>
  </div>;
}

export default function SettingsModal({ onClose, muted, onSoundChange, speed, onSpeedChange, meta, onMetaChange, avatar, onAvatarChange, keyboardLayout, onKeyboardLayoutChange, scenarioEditor }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const [previewing, setPreviewing] = useState<Sound | null>(null);
  const [audioError, setAudioError] = useState("");
  const [section, setSection] = useState<"general" | "editor">("general");
  const close = useEffectEvent(() => onClose());

  async function preview(name: Sound) {
    setPreviewing(name);
    setAudioError("");
    try { await previewSound(name); }
    catch { setAudioError("Son indisponible. Vérifiez les fichiers audio locaux."); }
    finally { setPreviewing(null); }
  }

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const siblings = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay.current)
      .map(element => ({ element, inert: element.inert }));
    siblings.forEach(({ element }) => { element.inert = true; });
    document.body.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
      ) ?? []).filter(element => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first) { event.preventDefault(); dialog.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.current?.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.current?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      siblings.forEach(({ element, inert }) => { element.inert = inert; });
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  function updateStatus(patch: Partial<Meta["statusBar"]>) {
    onMetaChange({ ...meta, statusBar: { ...meta.statusBar, ...patch } });
  }

  return createPortal(<motion.div ref={overlay} className="settings-overlay"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: reducedMotion ? 0 : .2 }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div ref={dialog} id="app-settings" className="settings-dialog" role="dialog" aria-modal="true" tabIndex={-1} aria-labelledby="settings-title" aria-describedby="settings-description"
    initial={{ opacity: 0, y: reducedMotion ? 0 : 14, scale: reducedMotion ? 1 : .97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : .98 }}
    transition={{ duration: reducedMotion ? 0 : .22, ease: [.22, 1, .36, 1] }}>
    <div className="settings-shell">
      <aside className="settings-sidebar">
        <div className="settings-emblem"><Settings size={22} strokeWidth={1.6}/></div>
        <h2 id="settings-title">Paramètres</h2>
        <p id="settings-description">Votre studio,<br/>à votre façon.</p>
        <nav className="mt-6 mb-8 flex gap-2 sm:flex-col" aria-label="Sections des paramètres">
          <button type="button" aria-pressed={section === "general"} onClick={() => setSection("general")} className={`flex flex-1 items-center gap-2 rounded-xl border border-transparent px-3 py-3 text-left text-[12px] ${section === "general" ? "bg-white/75 text-[#665d77] shadow-sm" : "bg-transparent text-[#a098aa] hover:text-[#665d77]"}`}>
            <SlidersHorizontal size={15} aria-hidden="true" /> Général
          </button>
          <button type="button" aria-pressed={section === "editor"} onClick={() => setSection("editor")} className={`flex flex-1 items-center gap-2 rounded-xl border border-transparent px-3 py-3 text-left text-[12px] ${section === "editor" ? "bg-white/75 text-[#665d77] shadow-sm" : "bg-transparent text-[#a098aa] hover:text-[#665d77]"}`}>
            <Braces size={15} aria-hidden="true" /> Éditeur JSON
          </button>
        </nav>
        <span className="settings-sidebar-note">iMessage studio<br/><span>Les détails font l’histoire.</span></span>
      </aside>
      <section className="settings-content" aria-labelledby="settings-section-title">
        <div className="settings-heading"><div><span className="settings-eyebrow">LE STUDIO</span><h3 id="settings-section-title">{section === "general" ? "Les petits réglages." : "Votre scénario JSON."}</h3><p>{section === "general" ? "Les changements s’appliquent en direct." : "Modifiez, prévisualisez et enregistrez votre conversation."}</p></div><button ref={closeButton} type="button" className="settings-close" aria-label="Fermer les paramètres" onClick={onClose}><X size={18}/></button></div>
        <div hidden={section !== "general"}>
          <div className="settings-fields">
            <SettingRow id="setting-sound" title="Sons de la conversation" description="Jouer les sons d’envoi, de réception et de réaction lorsqu’ils sont disponibles.">
              <input id="setting-sound" className="setting-switch" type="checkbox" role="switch" checked={!muted} onChange={e => onSoundChange(e.target.checked)} aria-describedby="setting-sound-description"/>
            </SettingRow>
            <div className="sound-previews" role="group" aria-label="Écouter les sons">
              {([['send', 'Envoi'], ['receive', 'Réception'], ['tapback-send', 'Réaction envoyée'], ['tapback', 'Réaction reçue']] as const).map(([name, label]) => <button type="button" key={name} disabled={previewing !== null} onClick={() => void preview(name)}><Volume2 size={12}/>{previewing === name ? "Chargement…" : label}</button>)}
            </div>
            {audioError && <p className="sound-preview-error" role="status">{audioError}</p>}
            <SettingRow id="setting-speed" title="Vitesse de lecture" description="Ajuster le rythme des messages et les temps de frappe.">
              <select id="setting-speed" value={speed} onChange={e => onSpeedChange(Number(e.target.value))} aria-describedby="setting-speed-description"><option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option></select>
            </SettingRow>
            <SettingRow id="setting-contact" title="Nom du contact" description="Le nom affiché en haut de la conversation.">
              <input id="setting-contact" type="text" maxLength={30} value={meta.contact.name} onChange={e => onMetaChange({ ...meta, contact: { ...meta.contact, name: e.target.value } })} aria-describedby="setting-contact-description"/>
            </SettingRow>
            <SettingRow id="setting-avatar" title="Photo de profil" description="Importez une photo pour ce contact. Elle reste enregistrée dans ce navigateur.">
              <AvatarUpload key={meta.contact.name} name={meta.contact.name} avatar={avatar} onChange={onAvatarChange} />
            </SettingRow>
            <SettingRow id="setting-keyboard" title="Disposition du clavier" description="QWERTY comme la capture de référence, ou AZERTY pour une conversation en français.">
              <select id="setting-keyboard" value={keyboardLayout} onChange={e => onKeyboardLayoutChange(e.target.value as "qwerty" | "azerty")} aria-describedby="setting-keyboard-description"><option value="qwerty">QWERTY</option><option value="azerty">AZERTY</option></select>
            </SettingRow>
            <SettingRow id="setting-time" title="Heure du téléphone" description="Affichage libre, y compris une heure fictive comme 9:81.">
              <input id="setting-time" type="text" spellCheck={false} placeholder="9:81" value={meta.statusBar.time} onChange={e => updateStatus({ time: e.target.value })} aria-describedby="setting-time-description"/>
            </SettingRow>
            <SettingRow id="setting-wifi" title="Connexion Wi-Fi" description="Afficher le Wi-Fi à côté du signal réseau.">
              <input id="setting-wifi" className="setting-switch" type="checkbox" role="switch" checked={meta.statusBar.wifi} onChange={e => updateStatus({ wifi: e.target.checked })} aria-describedby="setting-wifi-description"/>
            </SettingRow>
            <SettingRow id="setting-battery" title="Niveau de batterie" description="Au-delà de 100 %, le remplissage devient vert et dépasse proportionnellement.">
              <div className="flex flex-col items-end gap-2">
                <input id="setting-battery" type="range" min={0} max={Math.max(200, meta.statusBar.battery)} value={meta.statusBar.battery} onChange={e => updateStatus({ battery: Number(e.target.value) })} aria-describedby="setting-battery-description" className="h-1 w-[132px] cursor-pointer accent-[#82718f]" />
                <div className="flex items-center gap-2 text-[11px] text-[#968b9f]">
                  <input id="setting-battery-value" type="number" min={0} step={1} value={meta.statusBar.battery} onChange={e => { const battery = e.currentTarget.valueAsNumber; if (Number.isFinite(battery) && battery >= 0) updateStatus({ battery }); }} aria-label="Pourcentage de batterie" aria-describedby="setting-battery-description" />
                  <span aria-hidden="true">%</span>
                </div>
              </div>
            </SettingRow>
          </div>
        </div>
        {section === "editor" && scenarioEditor}
        <div className="settings-footer"><span>{section === "general" ? "Appliqué à cette session" : "Brouillon conservé pendant la session"}</span><button type="button" onClick={onClose}>Terminé</button></div>
      </section>
    </div>
    </motion.div>
  </motion.div>, document.body);
}
