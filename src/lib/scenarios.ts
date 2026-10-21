import demo from "../../scenarios/demo.json";
import type { Scenario } from "@/engine/types";

export interface Preset { id: string; tag: string; description: string; scenario: Scenario }
const base = demo as Scenario;
export const presets: Preset[] = [
  { id: "demo", tag: "LE QUOTIDIEN", description: "Un resto, un plan B et quelques réactions.", scenario: base },
  { id: "surprise", tag: "LE SUSPENSE", description: "Une annonce qui prend son temps.", scenario: {
    meta: { ...base.meta, title: "J’ai quelque chose à te dire", contact: { name: "Camille", avatar: null } },
    events: [
      { type: "timestamp", label: "Aujourd’hui 09:41" },
      { type: "message", from: "them", text: "T’es là ?", delay: 500, typing: 1100 },
      { type: "message", from: "me", text: "Oui, qu’est-ce qu’il se passe ?", delay: 700, typing: 2000 },
      { type: "status", target: 1, value: "read", delay: 400 },
      { type: "message", from: "them", text: "J’ai eu la réponse…", delay: 800, typing: 1600 },
      { type: "message", from: "them", text: "ON PART À TOKYO ✈️", delay: 1200, typing: 1300 },
      { type: "tapback", target: 3, from: "me", kind: "exclamation", delay: 500 },
      { type: "message", from: "me", text: "Attends QUOI 😭", delay: 600, typing: 1600 },
      { type: "tapback", target: 4, from: "them", kind: "heart", delay: 600 },
    ],
  } },
  { id: "launch", tag: "LE BUILD", description: "Le moment où le projet devient réel.", scenario: {
    meta: { ...base.meta, title: "On le lance ?", contact: { name: "Alex", avatar: null } },
    events: [
      { type: "timestamp", label: "Aujourd’hui 09:41" },
      { type: "message", from: "them", text: "Alors, ce projet secret ? 👀", delay: 600, typing: 1500 },
      { type: "message", from: "me", text: "Je viens de terminer la première version.", delay: 700, typing: 2600 },
      { type: "message", from: "me", text: "Messages, sons, réactions… tout est là.", delay: 500, typing: 2500 },
      { type: "tapback", target: 2, from: "them", kind: "thumbsUp", delay: 700 },
      { type: "message", from: "them", text: "Arrête de peaufiner. Montre-le au monde 🚀", delay: 600, typing: 1900 },
      { type: "message", from: "me", text: "Allez. On le lance !", delay: 700, typing: 1600 },
      { type: "status", target: 4, value: "read", delay: 500 },
    ],
  } },
];
