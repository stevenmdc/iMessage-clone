import type { MessageImage, Scenario, ScenarioEvent, Sender } from "@/engine/types";
import { parseScenario } from "../engine/validateScenario";

export function addScenarioImage(scenario: Scenario, image: MessageImage, from: Sender, caption: string, eventIndex?: number): Scenario {
  const events = [...scenario.events];
  if (eventIndex === undefined) {
    events.push({ type: "message", from, text: caption, image, delay: 800, typing: 0 });
  } else {
    const event = events[eventIndex];
    if (!event || event.type !== "message") throw new Error("Le message à modifier est introuvable.");
    events[eventIndex] = { ...event, image };
  }
  return parseScenario(JSON.stringify({ ...scenario, events }));
}

export function removeScenarioImage(scenario: Scenario, eventIndex: number): Scenario {
  const event = scenario.events[eventIndex];
  if (!event || event.type !== "message" || !event.image) throw new Error("Image introuvable.");
  if (event.text.trim()) {
    const message = { ...event, image: undefined };
    return parseScenario(JSON.stringify({ ...scenario, events: scenario.events.map((item, index) => index === eventIndex ? message : item) }));
  }
  const target = scenario.events.slice(0, eventIndex).filter(item => item.type === "message").length;
  const events = scenario.events.flatMap<ScenarioEvent>((item, index) => {
    if (index === eventIndex) return [];
    if (item.type !== "tapback" && item.type !== "status") return [item];
    if (item.target === target) return [];
    return [{ ...item, target: item.target > target ? item.target - 1 : item.target }];
  });
  return parseScenario(JSON.stringify({ ...scenario, events }));
}
