import type { CSSProperties } from "react";

export const tokens = {
  screen: { width: 402, height: 874, radius: 55 },
  frame: { inset: 12, radius: 65 },
  font: {
    family: '"SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: { size: 17, lineHeight: 22, weight: 400 },
    caption: { size: 11, weight: 400 },
    title: { size: 12, weight: 600 },
    status: { size: 17, weight: 600 },
  },
  bubble: { radius: 18, paddingX: 12, paddingY: 7, maxWidthRatio: .72, gapSameSender: 2, gapDifferentSender: 8 },
  color: { screen: "#FFFFFF", sent: "#0A84FF", received: "#E9E9EB", receivedDark: "#26252A", text: { sent: "#FFFFFF", received: "#000000", receivedDark: "#FFFFFF", secondary: "#8C8C91" } },
  tapback: { size: 26, offset: { x: -8, y: -10 }, borderWidth: 2, fromMe: "#0A84FF", fromOther: "#E9E9EB" },
} as const;

export const phoneSize = {
  width: tokens.screen.width + tokens.frame.inset * 2,
  height: tokens.screen.height + tokens.frame.inset * 2,
};

// A single source for phone geometry and CSS values; studio chrome keeps its own styles.
export const phoneVariables = {
  "--screen-width": `${tokens.screen.width}px`, "--screen-height": `${tokens.screen.height}px`, "--screen-radius": `${tokens.screen.radius}px`,
  "--frame-width": `${phoneSize.width}px`, "--frame-height": `${phoneSize.height}px`, "--frame-radius": `${tokens.frame.radius}px`, "--frame-padding": `${tokens.frame.inset - 2}px`,
  "--phone-font": tokens.font.family,
  "--body-size": `${tokens.font.body.size}px`, "--body-line-height": `${tokens.font.body.lineHeight}px`, "--body-weight": tokens.font.body.weight,
  "--caption-size": `${tokens.font.caption.size}px`, "--caption-weight": tokens.font.caption.weight,
  "--title-size": `${tokens.font.title.size}px`, "--title-weight": tokens.font.title.weight,
  "--status-size": `${tokens.font.status.size}px`, "--status-weight": tokens.font.status.weight,
  "--bubble-radius": `${tokens.bubble.radius}px`, "--bubble-padding-x": `${tokens.bubble.paddingX}px`, "--bubble-padding-y": `${tokens.bubble.paddingY}px`, "--bubble-max-width": `${tokens.bubble.maxWidthRatio * 100}%`,
  "--gap-same": `${tokens.bubble.gapSameSender}px`, "--gap-different": `${tokens.bubble.gapDifferentSender}px`,
  "--screen-background": tokens.color.screen, "--sent": tokens.color.sent, "--received": tokens.color.received,
  "--sent-text": tokens.color.text.sent, "--received-text": tokens.color.text.received, "--secondary-text": tokens.color.text.secondary,
  "--tapback-size": `${tokens.tapback.size}px`, "--tapback-x": `${tokens.tapback.offset.x}px`, "--tapback-y": `${tokens.tapback.offset.y}px`, "--tapback-border": `${tokens.tapback.borderWidth}px`, "--tapback-own": tokens.tapback.fromMe, "--tapback-other": tokens.tapback.fromOther,
} satisfies CSSProperties & Record<`--${string}`, string | number>;
