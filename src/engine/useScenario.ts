"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { playSound } from "@/audio/sounds";
import { createTimeline } from "./timeline";
import type { Message, Scenario, Sender, TapbackKind } from "./types";
export function useScenario(scenario: Scenario, muted: boolean) {
  const cues = useMemo(() => createTimeline(scenario), [scenario]);
  const duration = cues.at(-1)?.at ?? 0;
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const clock = useRef(0);
  const cursor = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let previous = performance.now();
    let frame: number;
    const tick = (now: number) => {
      clock.current = Math.min(duration, clock.current + (now - previous) * speed);
      previous = now;
      while (cursor.current < cues.length && cues[cursor.current].at <= clock.current) {
        const event = cues[cursor.current++].event;
        if (!muted && event.type === "message") playSound(event.from === "me" ? "send" : "receive");
        if (!muted && event.type === "tapback") playSound(event.from === "me" ? "tapback-send" : "tapback");
      }
      setElapsed(clock.current);
      if (clock.current >= duration) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, muted, cues, duration]);
  const messages: Message[] = [];
  const tapbacks: Record<number, { from: Sender; kind: TapbackKind }[]> = {};
  const statuses: Record<number, "delivered" | "read"> = {};
  let timestamp = "";
  let typing = false;
  let draft = "";
  let keyPress: { key: string; at: number; id: string } | null = null;
  if (started) for (const { at, event } of cues) {
    if (at > elapsed) break;
    switch (event.type) {
      case "typing": typing = true; break;
      case "compose":
        draft = event.text;
        if (event.key) keyPress = { key: event.key, at, id: `stroke-${event.stroke}` };
        break;
      case "timestamp": timestamp = event.label; break;
      case "message":
        typing = false;
        if (event.from === "me") { draft = ""; keyPress = { key: "send", at, id: `send-${messages.length}` }; }
        messages.push({ id: messages.length, from: event.from, text: event.text });
        break;
      case "tapback": (tapbacks[event.target] ??= []).push(event); break;
      case "status": statuses[event.target] = event.value; break;
    }
  }
  function reset() {
    clock.current = 0; cursor.current = 0;
    setElapsed(0); setStarted(false); setPlaying(false);
  }
  function play() {
    if (clock.current >= duration) { clock.current = 0; cursor.current = 0; setElapsed(0); }
    setStarted(true); setPlaying(true);
  }
  return { messages, tapbacks, statuses, timestamp, typing, draft, keyPress, elapsed, duration, started, playing, speed, setSpeed, reset, play, pause: () => setPlaying(false) };
}
