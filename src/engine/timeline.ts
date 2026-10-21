import type { Cue, Scenario } from "./types";
export function createTimeline(scenario: Scenario): Cue[] {
  let at = 0;
  let stroke = 0;
  const cues: Cue[] = [];
  for (const event of scenario.events) {
    at += Math.max(0, event.delay ?? 0);
    if (event.type === "message" && event.from === "them" && event.typing) {
      cues.push({ at, event: { type: "typing" } });
      at += Math.max(0, event.typing);
    }
    if (event.type === "message" && event.from === "me" && event.text && event.typing !== 0) {
      // Graphemes keep accented characters and emoji families intact while typing.
      const letters = Array.from(new Intl.Segmenter("fr", { granularity: "grapheme" }).segment(event.text), part => part.segment);
      const typingDuration = Math.max(0, event.typing ?? Math.min(4500, Math.max(1200, letters.length * 85)));
      cues.push({ at, event: { type: "compose", text: "", key: null, stroke: stroke++ } });
      let text = "";
      letters.forEach((key, index) => {
        text += key;
        cues.push({ at: at + typingDuration * (index + 1) / letters.length, event: { type: "compose", text, key, stroke: stroke++ } });
      });
      at += typingDuration + 220;
    }
    cues.push({ at, event });
  }
  return cues;
}
