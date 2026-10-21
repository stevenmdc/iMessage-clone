import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { useScenario } from "@/engine/useScenario";

export default function Controls({ player, onPlay, muted, onMute }: { player: ReturnType<typeof useScenario>; onPlay: () => void; muted: boolean; onMute: () => void }) {
  const finished = player.started && player.elapsed >= player.duration;
  const playLabel = player.playing ? "Mettre en pause" : finished ? "Rejouer" : "Lire la conversation";

  return (
    <div role="group" aria-label="Commandes de lecture" className="flex items-center justify-center gap-4 rounded-2xl border border-white/75 bg-white/65 p-2 shadow-[0_4px_15px_#44444404]">
      <button
        type="button"
        onClick={player.playing ? player.pause : onPlay}
        aria-label={playLabel}
        title={playLabel}
        className="grid size-12 shrink-0 place-items-center rounded-xl border-0 bg-[#292830] p-0 text-white hover:bg-[#403e49]"
      >
        {player.playing ? <Pause size={28} fill="currentColor" aria-hidden="true" />
          : finished ? <RotateCcw size={28} aria-hidden="true" />
            : <Play size={28} fill="currentColor" aria-hidden="true" />}
      </button>
      <div className="h-6 w-px bg-[#dedce2]" aria-hidden="true" />
      <select aria-label="Vitesse de lecture" value={player.speed} onChange={event => player.setSpeed(Number(event.target.value))} className="h-11 w-[60px] border-0 bg-transparent text-[14px] text-[#66616e]">
        <option value={.5}>0.5×</option>
        <option value={1}>1×</option>
        <option value={2}>2×</option>
      </select>
      <button type="button" onClick={onMute} aria-label={muted ? "Activer le son" : "Couper le son"} title={muted ? "Activer le son" : "Couper le son"} aria-pressed={muted} className="grid size-11 shrink-0 place-items-center rounded-xl border-0 bg-transparent p-0 text-[#77727d] hover:text-[#39313f]">
        {muted ? <VolumeX size={27} aria-hidden="true" /> : <Volume2 size={27} aria-hidden="true" />}
      </button>
    </div>
  );
}
