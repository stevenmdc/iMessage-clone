export type Sound = "send" | "receive" | "tapback" | "tapback-send";
let context: AudioContext | undefined;
let loading: Promise<void> | undefined;
const buffers = new Map<Sound, AudioBuffer>();
export async function unlockAudio() {
  context ??= new AudioContext();
  const resumed = context.resume();
  loading ??= Promise.all((["send", "receive", "tapback", "tapback-send"] as Sound[]).map(async name => {
    if (buffers.has(name)) return;
    try {
      const response = await fetch(`/sounds/${name}.m4a`);
      if (response.ok) buffers.set(name, await context!.decodeAudioData(await response.arrayBuffer()));
    } catch { /* Local assets are optional. */ }
  })).then(() => { loading = undefined; });
  await Promise.all([resumed, loading]);
}
export function playSound(name: Sound) {
  const buffer = buffers.get(name);
  if (!context || !buffer) return;
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
}

export async function previewSound(name: Sound) {
  await unlockAudio();
  if (!buffers.has(name)) throw new Error("Son indisponible");
  playSound(name);
}
