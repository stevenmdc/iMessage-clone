export type Sender = "me" | "them";
export type TapbackKind = "heart" | "thumbsUp" | "thumbsDown" | "haha" | "exclamation" | "question";
export interface MessageImage { id: string; width: number; height: number; alt?: string }
export type ScenarioEvent =
  | { type: "timestamp"; label: string; delay?: number }
  | { type: "message"; from: Sender; text: string; image?: MessageImage; delay?: number; typing?: number }
  | { type: "tapback"; target: number; from: Sender; kind: TapbackKind; delay?: number }
  | { type: "status"; target: number; value: "delivered" | "read"; delay?: number };
export interface Scenario {
  meta: { title: string; theme: string; contact: { name: string; avatar: string | null };
    statusBar: { time: string; network: string; wifi: boolean; battery: number; charging: boolean } };
  events: ScenarioEvent[];
}
export interface Cue { at: number; event: ScenarioEvent | { type: "typing" } | { type: "compose"; text: string; key: string | null; stroke: number } }
export interface Message { id: number; from: Sender; text: string; image?: MessageImage }
