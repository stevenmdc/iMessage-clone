import { motion, useReducedMotion } from "framer-motion";
import type { Message, Sender, TapbackKind } from "@/engine/types";
import TapbackBadge from "./TapbackBadge";
import ConversationImage from "./ConversationImage";
export default function MessageBubble({ message, grouped, tail, reactions, status }: { message: Message; grouped: boolean; tail: boolean; reactions?: { kind: TapbackKind; from: Sender }[]; status?: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      layout={reducedMotion ? false : "position"}
      className={`message-row ${message.from === "me" ? "outgoing" : "incoming"} ${grouped ? "grouped" : ""} ${reactions?.length ? "has-reaction" : ""}`}
      transition={{ layout: { duration: .2, ease: [.22, 1, .36, 1] } }}
    >
      <motion.div
        className={`bubble ${message.from === "me" ? "sent" : "received"} ${tail ? "tail" : ""}`}
        style={message.image ? { width: "var(--bubble-max-width)", padding: 3 } : undefined}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : .2, ease: [.22, 1, .36, 1] }}
      >
        {message.image ? <><ConversationImage image={message.image} />{message.text && <div className="px-2 pt-1 pb-1">{message.text}</div>}</> : message.text}
        {!!reactions?.length && <div className="tapback-group">{reactions.map((reaction, index) => <TapbackBadge key={index} {...reaction} />)}</div>}
      </motion.div>
      {status && <span className="delivery-status">{status === "read" ? "Lu" : "Distribué"}</span>}
    </motion.div>
  );
}
