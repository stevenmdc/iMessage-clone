import { Minus, Plus, Settings } from "lucide-react";

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 5;
const buttonClassName = "grid size-8 place-items-center border-0 bg-transparent p-0 text-inherit enabled:hover:text-[#39313f] disabled:cursor-default disabled:opacity-30";

export default function ZoomControl({ value, onChange, settingsOpen, onOpenSettings }: {
  value: number;
  onChange: (value: number) => void;
  settingsOpen: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <div className="fixed top-1/2 right-[clamp(12px,1.5vw,20px)] z-20 flex w-8 -translate-y-1/2 flex-col items-center gap-2.5 text-[#77727d]" role="group" aria-label="Réglages et zoom de l’iPhone">
      <button
        className={`${buttonClassName} absolute right-0 bottom-full mb-4 rounded-xl`}
        type="button"
        aria-label="Ouvrir les paramètres"
        aria-haspopup="dialog"
        aria-expanded={settingsOpen}
        aria-controls={settingsOpen ? "app-settings" : undefined}
        onClick={onOpenSettings}
      >
        <Settings size={19} strokeWidth={1.7} aria-hidden="true" />
      </button>
      <button
        className={buttonClassName}
        type="button"
        aria-label="Zoomer sur l’iPhone"
        disabled={value >= MAX_ZOOM}
        onClick={() => onChange(Math.min(MAX_ZOOM, value + ZOOM_STEP))}
      >
        <Plus size={18} aria-hidden="true" />
      </button>
      <input
        className="m-0 h-[clamp(80px,24dvh,140px)] w-6 cursor-pointer accent-[#82718f] [direction:rtl] [writing-mode:vertical-lr] focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#82718f]"
        type="range"
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={ZOOM_STEP}
        value={value}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        aria-label="Zoom de l’iPhone"
        aria-orientation="vertical"
        aria-valuetext={`${value} % de la taille ajustée à l’écran`}
      />
      <button
        className={buttonClassName}
        type="button"
        aria-label="Dézoomer sur l’iPhone"
        disabled={value <= MIN_ZOOM}
        onClick={() => onChange(Math.max(MIN_ZOOM, value - ZOOM_STEP))}
      >
        <Minus size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
