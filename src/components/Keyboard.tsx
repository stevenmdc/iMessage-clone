"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowBigUp, CornerDownLeft, Delete, Keyboard as KeyboardIcon, Mic, Smile, Sticker, TextCursorInput } from "lucide-react";
import styles from "./Keyboard.module.css";

interface KeyPress { key: string; at: number; id: string }
interface Props { keyPress: KeyPress | null; elapsed: number; playing: boolean; draft: string; speed: number; layout: "azerty" | "qwerty" }

export function getKeyboardKey(character: string) {
  if (character === " ") return "space";
  if (character === "send" || character === "\n") return "return";
  const normalized = character.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/^[a-z]$/.test(normalized)) return normalized;
  if (/^[0-9.,?!'’\-:;]$/.test(character)) return character === "’" ? "'" : character;
  return "emoji";
}

function KeyboardKey({ label, active, feedbackId, playing, popover, utility, sizing }: {
  label: ReactNode; active: boolean; feedbackId?: string; playing: boolean; popover: boolean; utility: boolean; sizing: string;
}) {
  return <span className={`relative isolate flex min-w-0 items-center justify-center font-normal ${sizing} ${utility ? "h-8 w-8 bg-transparent" : `h-11 rounded-lg text-[25px] tracking-[-0.6px] ${active ? "bg-[#c8c8d1] shadow-[inset_0_1px_2px_#0000000b]" : "bg-[#ffffffed] shadow-[0_1px_0_#a8a8b42b]"}`}`}>
    {label}
    {feedbackId && <span key={feedbackId} className={`${styles.ping} pointer-events-none absolute z-[6] size-[25px] rounded-full border-[1.5px] border-[#8c93a166] bg-[#a9b1c31f]`} style={{ animationPlayState: playing ? "running" : "paused" }}/>}
    {popover && <span className="pointer-events-none absolute bottom-0 left-1/2 z-[5] flex h-[91px] w-12 -translate-x-1/2 justify-center rounded-t-[11px] rounded-b-[7px] bg-white pt-1 text-[32px] shadow-[0_-1px_6px_#32323d24]">{label}</span>}
  </span>;
}

export default function Keyboard({ keyPress, elapsed, playing, draft, speed, layout }: Props) {
  const reducedMotion = useReducedMotion();
  const pressedKey = keyPress ? getKeyboardKey(keyPress.key) : null;
  const symbols = pressedKey !== null && /^[0-9.,?!'\-:;]$/.test(pressedKey);
  const uppercase = !draft || (keyPress?.key ? keyPress.key !== keyPress.key.toLowerCase() : false);
  const rows = symbols ? ["1234567890".split(""), ["-", "/", ":", ";", "(", ")", "€", "&", "@", '"'], [".", ",", "?", "!", "'"]] : (layout === "azerty" ? ["azertyuiop", "qsdfghjklm", "wxcvbn"] : ["qwertyuiop", "asdfghjkl", "zxcvbnm"]).map(row => row.split(""));

  function key(id: string, label: ReactNode, sizing = "flex-1", utility = false) {
    const active = !!keyPress && pressedKey === id && elapsed - keyPress.at < 150 * speed;
    const feedback = !!keyPress && pressedKey === id && elapsed - keyPress.at < 460 * speed;
    return <KeyboardKey key={id} label={label} active={active} feedbackId={feedback && !reducedMotion ? keyPress?.id : undefined} playing={playing} popover={active && !reducedMotion && id.length === 1} utility={utility} sizing={sizing}/>;
  }

  return <motion.div className="shrink-0 overflow-hidden rounded-t-[28px] border-t border-[#d4d4d999] bg-[linear-gradient(180deg,#e3e3e7,#e6e6ea_80%)] text-[#101014] shadow-[inset_0_1px_0_#fff9]" aria-hidden="true"
    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
    transition={{ duration: reducedMotion ? 0 : .3, ease: [.22, 1, .36, 1] }}>
    <div className="px-[5px] select-none">
      <div className="flex h-12 items-center justify-between px-[13px] text-[#3e3e43]"><Sticker size={20}/><span className="mx-[18px] flex flex-1 items-center justify-center gap-2 border-x border-[#d2d2d8] text-sm"><KeyboardIcon size={19}/>{layout === "azerty" ? "Français" : "English (US)"}</span><TextCursorInput size={20}/></div>
      {rows.map((row, index) => <div className={`mb-[11px] flex justify-center gap-[6px] ${index === 1 && layout === "qwerty" ? "px-[19px]" : ""}`} key={index}>
        {index === 2 && key("shift", symbols ? "#+=" : <ArrowBigUp size={23} fill={uppercase ? "currentColor" : "none"}/>, "mr-auto flex-[0_0_43px]")}
        {row.map(letter => key(letter, uppercase && !symbols ? letter.toUpperCase() : letter, index === 2 ? layout === "azerty" ? "flex-[0_1_36px]" : "flex-[0_1_33px]" : "flex-1"))}
        {index === 2 && key("delete", <Delete size={22}/>, "ml-auto flex-[0_0_43px]")}
      </div>)}
      <div className="flex justify-center gap-[6px]">{key("numbers", <span className="text-lg tracking-normal">{symbols ? "ABC" : "123"}</span>, "flex-[0_0_92px]")}{key("space", "")}{key("return", <CornerDownLeft size={24}/>, "flex-[0_0_92px]")}</div>
      <div className="flex h-16 items-center justify-between px-[21px] pt-[11px]">{key("emoji", <Smile size={28} strokeWidth={1.6}/>, "flex-[0_0_32px]", true)}<Mic size={27} strokeWidth={1.6}/></div>
    </div>
  </motion.div>;
}
