import { motion, useReducedMotion } from "framer-motion";
import type { Sender, TapbackKind } from "@/engine/types";
const symbols: Record<TapbackKind, string> = { heart: "♥", thumbsUp: "👍", thumbsDown: "👎", haha: "HA", exclamation: "‼", question: "?" };
export default function TapbackBadge({ kind, from }: { kind: TapbackKind; from: Sender }) {
  const reducedMotion = useReducedMotion();
  return <motion.span className={`tapback tapback-${kind} ${from === 'me' ? 'own' : ''}`} initial={reducedMotion ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} aria-label={`Réaction ${kind}`}>{symbols[kind]}</motion.span>;
}
