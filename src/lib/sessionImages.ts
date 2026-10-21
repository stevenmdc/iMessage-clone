import type { MessageImage } from "@/engine/types";

export interface SessionImage extends MessageImage { src: string }
const empty: readonly SessionImage[] = [];
let images = empty;
const listeners = new Set<() => void>();

export function subscribeSessionImages(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function getSessionImages() { return images; }
export function getServerSessionImages() { return empty; }

// File contents stay in this module's memory, never in saved scenario JSON.
export function registerSessionImage(image: SessionImage) {
  images = [...images.filter(item => item.id !== image.id), image];
  listeners.forEach(listener => listener());
}

export function clearSessionImages() {
  images = empty;
  listeners.forEach(listener => listener());
}

export function imageReference(image: SessionImage): MessageImage {
  return { id: image.id, width: image.width, height: image.height, alt: image.alt };
}

export async function prepareConversationImage(file: File): Promise<SessionImage> {
  if (!file.type.startsWith("image/")) throw new Error("Choisissez un fichier image.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Choisissez une image de moins de 20 Mo.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); }
    catch { throw new Error("Image illisible. Essayez une photo JPEG, PNG ou WebP."); }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error("Image sans dimensions valides.");
    const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("La préparation des images est indisponible.");
    context.drawImage(image, 0, 0, width, height);
    return { id: crypto.randomUUID(), width, height, alt: file.name.slice(0, 200), src: canvas.toDataURL("image/webp", .85) };
  } finally {
    URL.revokeObjectURL(url);
  }
}
