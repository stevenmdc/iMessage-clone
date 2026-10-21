import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { useScenario } from "@/engine/useScenario";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
export default function MessageList({ player }: { player: ReturnType<typeof useScenario> }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastSent = [...player.messages].reverse().find(m => m.from === "me")?.id;
  const reactionCount = Object.keys(player.tapbacks).length;
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" }); }, [player.messages.length, player.typing, reactionCount]);
  return <div className="message-list" ref={ref} role="log" aria-label="Conversation" aria-live="polite">
    {player.timestamp && <div className="timestamp">{player.timestamp}</div>}
    <AnimatePresence>{player.messages.map((message, i) => <MessageBubble key={message.id} message={message} grouped={player.messages[i - 1]?.from === message.from} tail={player.messages[i + 1]?.from !== message.from} reactions={player.tapbacks[message.id]} status={message.id === lastSent ? player.statuses[message.id] : undefined}/>)}</AnimatePresence>
    {player.typing && <TypingIndicator/>}
  </div>;
}
