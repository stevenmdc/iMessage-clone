import { useState } from "react";
import Image from "next/image";

export default function ContactAvatar({ name, src, size = 56, className = "" }: {
  name: string;
  src: string | null;
  size?: number;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const showImage = src && failedSource !== src;

  return (
    <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[linear-gradient(145deg,#b9bdc8,#8a90a0)] font-medium text-white ${className}`} style={{ width: size, height: size, fontSize: size * .48, lineHeight: 1 }}>
      {showImage ? (
        <Image src={src} alt={`Photo de ${name}`} width={size} height={size} unoptimized className="size-full object-cover" onError={() => setFailedSource(src)} />
      ) : (
        <span role="img" aria-label={`Profil de ${name}`}>{name.trim().slice(0, 1).toLocaleUpperCase("fr") || "?"}</span>
      )}
    </div>
  );
}
