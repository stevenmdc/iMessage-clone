"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { MessageImage } from "@/engine/types";
import { getServerSessionImages, getSessionImages, subscribeSessionImages } from "@/lib/sessionImages";

export default function ConversationImage({ image, compact = false }: { image: MessageImage; compact?: boolean }) {
  const images = useSyncExternalStore(subscribeSessionImages, getSessionImages, getServerSessionImages);
  const asset = images.find(item => item.id === image.id);
  const [failedSource, setFailedSource] = useState("");

  return (
    <div className={`relative shrink-0 overflow-hidden bg-[#f2f2f7] ${compact ? "size-10 rounded-lg" : "w-full rounded-[14px]"}`} style={compact ? undefined : { aspectRatio: `${image.width}/${image.height}`, maxHeight: 320 }}>
      {asset && failedSource !== asset.src ? (
        <Image src={asset.src} alt={image.alt || "Image de la conversation"} width={image.width} height={image.height} unoptimized className={`block size-full ${compact ? "object-cover" : "object-contain"}`} onError={() => setFailedSource(asset.src)} />
      ) : (
        <div role="img" aria-label="Image temporaire indisponible" className="flex size-full flex-col items-center justify-center gap-2 p-2 text-center text-[#96929e]">
          <ImageOff size={compact ? 18 : 28} aria-hidden="true" />
          {!compact && <span className="text-[11px] leading-[15px] whitespace-normal">Image temporaire indisponible.<br />Réimportez-la dans les réglages.</span>}
        </div>
      )}
    </div>
  );
}
