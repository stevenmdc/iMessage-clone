import { useEffect, useRef } from "react";
import { ArrowUp, Mic, Plus } from "lucide-react";

export default function InputBar({ draft, keyboardVisible, playing }: { draft: string; keyboardVisible: boolean; playing: boolean }) {
  const text = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (text.current) text.current.scrollTop = text.current.scrollHeight; }, [draft]);
  return (
    <div className="flex shrink-0 items-end gap-[10px] bg-white px-[15px] pt-2 pb-3" aria-hidden="true">
      <span className="mb-px grid size-[38px] shrink-0 place-items-center rounded-full bg-white shadow-[0_5px_12px_#00000017]">
        <Plus size={26} strokeWidth={1.7} />
      </span>
      <div className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-[24px] bg-white py-[7px] pr-2 pl-[14px] shadow-[0_5px_16px_#00000014]">
        <span ref={text} className={`relative max-h-[88px] min-w-0 flex-1 overflow-y-auto text-[length:var(--body-size)] leading-[var(--body-line-height)] whitespace-pre-wrap [overflow-wrap:anywhere] [scrollbar-width:none] ${draft ? "text-[#111]" : "text-[#b7b7bb]"}`}>
          {draft || "iMessage"}
          {keyboardVisible && (
            <i
              className={`h-5 w-0.5 bg-[var(--sent)] motion-safe:animate-[input-blink_1s_steps(1)_infinite] ${draft ? "ml-px inline-block align-[-4px]" : "absolute top-1/2 left-0 -translate-y-1/2"}`}
              style={{ animationPlayState: playing ? "running" : "paused" }}
            />
          )}
        </span>
        {draft ? (
          <span className="grid size-[27px] shrink-0 place-items-center self-end rounded-full bg-[var(--sent)] text-white">
            <ArrowUp size={20} strokeWidth={3} />
          </span>
        ) : (
          <span className="grid size-[26px] shrink-0 place-items-center text-[#b7b7bb]">
            <Mic size={20} strokeWidth={1.6} />
          </span>
        )}
      </div>
    </div>
  );
}
