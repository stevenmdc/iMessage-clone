import { motion, useReducedMotion } from "framer-motion";
import type { Message, Sender, TapbackKind } from "@/engine/types";
import TapbackBadge from "./TapbackBadge";
export default function MessageBubble({ message, grouped, tail, reactions, status }: { message: Message; grouped: boolean; tail: boolean; reactions?: { kind: TapbackKind; from: Sender }[]; status?: string }) {
  const reducedMotion = useReducedMotion();
  return <motion.div layout={!reducedMotion} className={`message-row ${message.from === "me" ? "outgoing" : "incoming"} ${grouped ? "grouped" : ""} ${reactions?.length ? "has-reaction" : ""}`} initial={reducedMotion ? false : { opacity: 0, scale: .6, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ transformOrigin: message.from === "me" ? "right bottom" : "left bottom" }}>
    <div className={`bubble ${message.from === "me" ? "sent" : "received"} ${tail ? "tail" : ""}`}>{message.text}{!!reactions?.length && <div className="tapback-group">{reactions.map((r, i) => <TapbackBadge key={i} {...r}/>)}</div>}</div>
    {status && <span className="delivery-status">{status === "read" ? "Lu" : "Distribué"}</span>}
  </motion.div>;
}
